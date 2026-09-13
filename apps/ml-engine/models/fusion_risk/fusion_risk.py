#!/usr/bin/env python3
"""
Main execution script for Fusion/Risk model
Runs complete pipeline: train, evaluate, predict, explain, export
"""

import sys
from pathlib import Path

# Add parent directory to path so src is imported as package
sys.path.insert(0, str(Path(__file__).parent))

from src.config import get_config, SAVED_MODELS, STATIC_SUSCEPTIBILITY
from src.train import TrainingPipeline
from src.evaluate import ModelEvaluator
from src.predict import RiskPredictor
from src.explain import ExplainabilityAnalyzer
from src.spatial_export import SpatialExporter
from src.data_loader import DataLoader
from src.model import FusionRiskModel
from src.preprocessing import Preprocessor
from src.config import LOGS_DIR
from src.utils import setup_logging


def main():
    """Run complete Fusion/Risk pipeline"""

    # Setup logging
    logger = setup_logging(LOGS_DIR, "fusion_risk_main")

    logger.info("="*80)
    logger.info("FUSION/RISK MODEL - COMPLETE PIPELINE")
    logger.info("="*80)

    # Load configuration
    config = get_config()

    # PHASE 1: TRAINING
    logger.info("\n" + "="*80)
    logger.info("PHASE 1: MODEL TRAINING")
    logger.info("="*80)

    pipeline = TrainingPipeline(config)
    training_results = pipeline.run()

    if not training_results["success"]:
        logger.error("Training failed!")
        return 1

    logger.info(f"\nTraining completed in {training_results['duration_seconds']:.1f}s")

    # PHASE 2: EVALUATION
    logger.info("\n" + "="*80)
    logger.info("PHASE 2: MODEL EVALUATION")
    logger.info("="*80)

    evaluator = ModelEvaluator(config)

    # Evaluate on test set
    test_metrics = evaluator.evaluate(
        pipeline.y_test,
        pipeline.model.predict_proba(pipeline.X_test),
        split_name="test"
    )

    # Generate evaluation plots
    evaluator.plot_roc_curve(pipeline.y_test, pipeline.model.predict_proba(pipeline.X_test))
    evaluator.plot_precision_recall_curve(pipeline.y_test, pipeline.model.predict_proba(pipeline.X_test))
    evaluator.plot_confusion_matrix(pipeline.y_test, pipeline.model.predict(pipeline.X_test))

    # Feature importance
    feature_importance = pipeline.model.get_feature_importance()
    evaluator.plot_feature_importance(feature_importance)

    # Generate report
    evaluator.generate_evaluation_report(test_metrics, feature_importance)
    evaluator.save_metrics(test_metrics)

    # PHASE 3: FULL GRID PREDICTION
    logger.info("\n" + "="*80)
    logger.info("PHASE 3: FULL GRID PREDICTION")
    logger.info("="*80)

    predictor = RiskPredictor(pipeline.model, pipeline.preprocessor, config)

    risk_map, confidence_map, valid_mask = predictor.predict_full_grid(
        pipeline.feature_arrays,
        pipeline.feature_names
    )

    # Classify risk levels
    risk_levels = predictor.classify_risk_levels(risk_map)

    # Save predictions
    df_predictions, summary = predictor.save_predictions(
        risk_map, confidence_map, risk_levels
    )

    # PHASE 4: SPATIAL EXPORT
    logger.info("\n" + "="*80)
    logger.info("PHASE 4: SPATIAL EXPORT")
    logger.info("="*80)

    exporter = SpatialExporter(config)

    # Export primary risk map (30m GeoTIFF)
    risk_tif = exporter.export_risk_map(risk_map, STATIC_SUSCEPTIBILITY)
    logger.info(f"Exported: {risk_tif}")

    # Export confidence map
    confidence_tif = exporter.export_confidence_map(confidence_map, STATIC_SUSCEPTIBILITY)
    logger.info(f"Exported: {confidence_tif}")

    # Export classification
    classification_tif = exporter.export_risk_classification(risk_levels, STATIC_SUSCEPTIBILITY)
    logger.info(f"Exported: {classification_tif}")

    # Validate outputs
    for tif_path in [risk_tif, confidence_tif, classification_tif]:
        exporter.validate_output_raster(tif_path)

    # PHASE 5: EXPLAINABILITY
    logger.info("\n" + "="*80)
    logger.info("PHASE 5: EXPLAINABILITY (SHAP)")
    logger.info("="*80)

    try:
        analyzer = ExplainabilityAnalyzer(pipeline.model, config)

        # Compute SHAP on validation set sample
        sample_size = min(1000, len(pipeline.X_val))
        X_explain = pipeline.X_val[:sample_size]

        analyzer.compute_shap_values(pipeline.X_train[:1000], X_explain)
        analyzer.plot_shap_summary(X_explain, pipeline.feature_names)
        shap_importance = analyzer.plot_shap_feature_importance(pipeline.feature_names)

        # Feature group contributions
        feature_groups = pipeline.feature_builder.get_feature_groups(pipeline.feature_names)
        group_contributions = analyzer.get_feature_group_contributions(
            pipeline.feature_names, feature_groups
        )

        logger.info("\nFeature group contributions:")
        for group, contrib in sorted(group_contributions.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {group}: {contrib:.2f}%")

    except Exception as e:
        logger.warning(f"SHAP explainability skipped: {e}")

    # FINAL SUMMARY
    logger.info("\n" + "="*80)
    logger.info("PIPELINE COMPLETED SUCCESSFULLY")
    logger.info("="*80)
    logger.info(f"\nModel: {training_results['model_path']}")
    logger.info(f"Test ROC-AUC: {test_metrics['roc_auc']:.4f}")
    logger.info(f"Test F1: {test_metrics['f1']:.4f}")
    logger.info(f"\nSpatial outputs:")
    logger.info(f"  Risk map (30m): {risk_tif}")
    logger.info(f"  Confidence map (30m): {confidence_tif}")
    logger.info(f"  Classification (30m): {classification_tif}")
    logger.info(f"\nFeatures used: {len(pipeline.feature_names)}")
    logger.info(f"Training samples: {len(pipeline.X_train):,}")
    logger.info(f"Valid predictions: {summary['total_valid_pixels']:,}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
