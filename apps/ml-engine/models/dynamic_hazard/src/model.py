"""
LSTM model architecture for Dynamic Hazard prediction
Production-quality deep learning model for landslide forecasting
"""
from __future__ import annotations

import numpy as np
from typing import Optional, Tuple, Dict, Any
import logging

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, models, callbacks, optimizers
    from tensorflow.keras import backend as K
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    tf = None
    keras = None

from config import ModelConfig
from utils import calculate_class_weights


class DynamicHazardLSTM:
    """LSTM model for dynamic landslide hazard prediction"""

    def __init__(
        self,
        config: ModelConfig,
        input_shape: Tuple[int, int],
        logger: Optional[logging.Logger] = None
    ):
        """
        Initialize LSTM model

        Args:
            config: Model configuration
            input_shape: (sequence_length, n_features)
            logger: Optional logger instance
        """
        if not TENSORFLOW_AVAILABLE:
            raise ImportError(
                "TensorFlow is required for LSTM model. "
                "Install with: pip install tensorflow"
            )

        self.config = config
        self.input_shape = input_shape
        self.logger = logger or logging.getLogger(__name__)
        self.model = None
        self.history = None

    def build_model(self) -> keras.Model:
        """
        Build LSTM model architecture

        Returns:
            Compiled Keras model
        """
        self.logger.info("Building LSTM model...")
        self.logger.info(f"Input shape: {self.input_shape}")

        # Input layer
        inputs = layers.Input(shape=self.input_shape, name="sequence_input")

        # LSTM layers
        x = inputs
        for i, units in enumerate(self.config.lstm_units):
            return_sequences = i < len(self.config.lstm_units) - 1

            x = layers.LSTM(
                units=units,
                return_sequences=return_sequences,
                dropout=self.config.dropout_rate,
                recurrent_dropout=self.config.recurrent_dropout,
                kernel_regularizer=keras.regularizers.l2(self.config.l2_reg),
                name=f"lstm_{i+1}"
            )(x)

            self.logger.info(
                f"LSTM layer {i+1}: {units} units, "
                f"return_sequences={return_sequences}"
            )

        # Dense layers
        for i, units in enumerate(self.config.dense_units):
            x = layers.Dense(
                units=units,
                activation="relu",
                kernel_regularizer=keras.regularizers.l2(self.config.l2_reg),
                name=f"dense_{i+1}"
            )(x)
            x = layers.Dropout(self.config.dropout_rate, name=f"dropout_dense_{i+1}")(x)
            self.logger.info(f"Dense layer {i+1}: {units} units")

        # Output layer (binary classification)
        outputs = layers.Dense(
            units=1,
            activation=self.config.activation,
            name="output"
        )(x)

        # Create model
        model = models.Model(inputs=inputs, outputs=outputs, name="dynamic_hazard_lstm")

        # Compile model
        optimizer = optimizers.Adam(learning_rate=self.config.learning_rate)

        model.compile(
            optimizer=optimizer,
            loss="binary_crossentropy",
            metrics=[
                "accuracy",
                keras.metrics.Precision(name="precision"),
                keras.metrics.Recall(name="recall"),
                keras.metrics.AUC(name="auc"),
                keras.metrics.AUC(curve="PR", name="pr_auc")
            ]
        )

        self.model = model
        self.logger.info(f"Model built with {model.count_params():,} parameters")
        return model

    def get_callbacks(
        self,
        checkpoint_path: str,
        log_dir: str
    ) -> list:
        """
        Get training callbacks

        Args:
            checkpoint_path: Path to save model checkpoints
            log_dir: Directory for TensorBoard logs

        Returns:
            List of Keras callbacks
        """
        callback_list = []

        # Early stopping
        early_stop = callbacks.EarlyStopping(
            monitor="val_loss",
            patience=self.config.patience,
            min_delta=self.config.min_delta,
            restore_best_weights=True,
            verbose=1
        )
        callback_list.append(early_stop)

        # Model checkpoint
        checkpoint = callbacks.ModelCheckpoint(
            filepath=checkpoint_path,
            monitor="val_loss",
            save_best_only=True,
            verbose=1
        )
        callback_list.append(checkpoint)

        # Reduce learning rate on plateau
        reduce_lr = callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
        callback_list.append(reduce_lr)

        # TensorBoard
        tensorboard = callbacks.TensorBoard(
            log_dir=log_dir,
            histogram_freq=1,
            write_graph=True
        )
        callback_list.append(tensorboard)

        self.logger.info(f"Configured {len(callback_list)} callbacks")
        return callback_list

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        class_weights: Optional[Dict[int, float]] = None,
        checkpoint_path: Optional[str] = None,
        log_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Train the model

        Args:
            X_train: Training sequences
            y_train: Training labels
            X_val: Validation sequences
            y_val: Validation labels
            class_weights: Optional class weights for imbalance
            checkpoint_path: Path to save checkpoints
            log_dir: TensorBoard log directory

        Returns:
            Training history dictionary
        """
        if self.model is None:
            raise ValueError("Model not built. Call build_model() first.")

        self.logger.info("Starting training...")
        self.logger.info(f"Training samples: {len(X_train)}")
        if X_val is not None:
            self.logger.info(f"Validation samples: {len(X_val)}")

        # Calculate class weights if requested
        if self.config.use_class_weights and class_weights is None:
            class_weights = calculate_class_weights(y_train)
            self.logger.info(f"Using class weights: {class_weights}")

        # Prepare validation data
        validation_data = None
        if X_val is not None and y_val is not None:
            validation_data = (X_val, y_val)

        # Get callbacks
        callback_list = []
        if checkpoint_path and log_dir:
            callback_list = self.get_callbacks(checkpoint_path, log_dir)

        # Train
        history = self.model.fit(
            X_train,
            y_train,
            batch_size=self.config.batch_size,
            epochs=self.config.epochs,
            validation_data=validation_data,
            class_weight=class_weights,
            callbacks=callback_list,
            verbose=1
        )

        self.history = history.history
        self.logger.info("Training complete")

        return self.history

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions

        Args:
            X: Input sequences

        Returns:
            Predicted probabilities
        """
        if self.model is None:
            raise ValueError("Model not built or loaded")

        predictions = self.model.predict(X, verbose=0)
        return predictions.flatten()

    def predict_binary(self, X: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        """
        Make binary predictions

        Args:
            X: Input sequences
            threshold: Classification threshold

        Returns:
            Binary predictions
        """
        probabilities = self.predict(X)
        return (probabilities >= threshold).astype(int)

    def save_model(self, filepath: str) -> None:
        """
        Save model to file

        Args:
            filepath: Path to save model
        """
        if self.model is None:
            raise ValueError("No model to save")

        self.model.save(filepath)
        self.logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath: str) -> None:
        """
        Load model from file

        Args:
            filepath: Path to model file
        """
        self.model = keras.models.load_model(filepath)
        self.logger.info(f"Model loaded from {filepath}")

    def get_model_summary(self) -> str:
        """
        Get model architecture summary

        Returns:
            String summary of model
        """
        if self.model is None:
            return "Model not built"

        import io
        stream = io.StringIO()
        self.model.summary(print_fn=lambda x: stream.write(x + "\n"))
        return stream.getvalue()


if __name__ == "__main__":
    from config import get_config

    config = get_config()

    # Example model
    input_shape = (14, 30)  # 14-day sequences, 30 features
    model = DynamicHazardLSTM(config.model, input_shape)
    model.build_model()

    print("\nModel Summary:")
    print(model.get_model_summary())
