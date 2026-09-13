# Fusion/Risk Model

Production-quality landslide risk prediction model that fuses static susceptibility, dynamic hazard, and environmental features.

## Model Purpose

Combines multiple data sources into a final landslide risk score with confidence and explainability:
- Static susceptibility (from XGBoost susceptibility model)
- Dynamic hazard (from LSTM temporal model)
- Topographic features (CartoDEM/ISRO)
- Rainfall features (IMD)
- Vegetation (Sentinel-2 NDVI)
- SAR (Sentinel-1)
- Geological (Bhuvan)
- Infrastructure (OSM)

## Architecture

**Model**: XGBoost or LightGBM ensemble classifier
**Output**: Risk score (0-1), confidence (0-1), and 5-level classification

## Directory Structure

```
fusion_risk/
├── src/
│   ├── config.py           # Configuration
│   ├── data_loader.py      # Data loading
│   ├── feature_builder.py  # Feature matrix construction
│   ├── preprocessing.py    # Scaling and normalization
│   ├── model.py            # XGBoost/LightGBM model
│   ├── train.py            # Training pipeline
│   ├── evaluate.py         # Evaluation metrics
│   ├── predict.py          # Full-grid prediction
│   ├── explain.py          # SHAP explainability
│   ├── spatial_export.py   # GeoTIFF export
│   ├── validation.py       # Data quality validation
│   └── utils.py            # Helper functions
├── tests/
│   └── test_pipeline.py    # Integration tests
├── outputs/
│   ├── predictions/        # CSV predictions
│   ├── maps/               # GeoTIFF outputs
│   ├── plots/              # Evaluation plots
│   ├── explanations/       # SHAP outputs
│   ├── metrics/            # Metrics JSON
│   └── reports/            # Text reports
├── saved_models/           # Model artifacts
├── logs/                   # Training logs
├── requirements.txt        # Dependencies
├── run_pipeline.py         # Main execution script
└── README.md               # This file
```

## Usage

### Run Complete Pipeline

```bash
cd apps/ml-engine/models/fusion_risk
python fusion_risk.py
```

This runs:
1. Training (with train/val/test split)
2. Evaluation (metrics, plots)
3. Full-grid prediction
4. Spatial export (30m GeoTIFF)
5. SHAP explainability

### Run Tests

```bash
cd apps/ml-engine/models/fusion_risk
python tests/test_pipeline.py
```

## Outputs

### Primary Spatial Output
- **fusion_risk_score_30m.tif**: Continuous risk scores (0-1) at 30m resolution
- **fusion_risk_confidence_30m.tif**: Confidence scores (0-1)
- **fusion_risk_classification_30m.tif**: 5-level classification (1-5)

### Predictions
- **fusion_risk_predictions.csv**: All valid pixels with risk score, confidence, level
- **fusion_risk_summary.json**: Statistics and distribution

### Model Artifacts
- **fusion_risk_model.pkl**: Trained model
- **preprocessor.pkl**: Fitted scaler
- **feature_names.json**: Feature list
- **training_metadata.json**: Complete training metadata

### Evaluation
- **evaluation_metrics_test.json**: Test set metrics
- **roc_curve_test.png**: ROC curve
- **pr_curve_test.png**: Precision-Recall curve
- **confusion_matrix_test.png**: Confusion matrix
- **feature_importance.png**: Feature importance plot
- **evaluation_report.txt**: Human-readable report

### Explainability
- **shap_summary.png**: SHAP summary plot
- **shap_feature_importance.png**: SHAP feature importance
- **shap_values.npy**: Raw SHAP values

## Data Sources

All features use verified Indian government/institutional data:
- **CartoDEM** (ISRO/NRSC): Topography
- **IMD**: Rainfall (0.25° gridded, resampled to 30m)
- **Sentinel-1** (ESA): SAR
- **Sentinel-2** (ESA): NDVI
- **Bhuvan** (ISRO): Geology, LULC, lineaments
- **OSM**: Infrastructure
- **GSI/NRSC**: Landslide inventory

## Model Version

Version: 1.0.0
CRS: EPSG:32646 (WGS84 UTM Zone 46N)
Resolution: 30m
NoData: -9999.0
