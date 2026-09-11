# Landslide Risk Prediction & ML Engine (NER)

Python-based prediction engine for the AI-Based Early Warning and Landslide Risk Monitoring System in the North Eastern Region of India.

## Architecture

- **`app/models`**: Susceptibility models (Spatial baseline probability using geological, topographical, and hydrological features).
- **`app/features`**: Dynamic feature extractors:
  - IMD Rainfall triggers (antecedent rainfall index, intensity-duration thresholds)
  - Sentinel-1 InSAR surface deformation rates (mm/yr line-of-sight velocity)
  - Sentinel-2 NDVI vegetative cover loss
- **`app/fusion`**: Multi-modal Bayesian / Weighted Fusion combining static susceptibility and dynamic triggers into an integrated risk score.
- **`app/explainability`**: Explainability layer outputting factor attributions for disaster responders.

## Getting Started

### 1. Environment Setup

```bash
cd services/ml-engine
python -m venv .venv

# On Windows:
.venv\Scripts\Activate.ps1

# On Linux/macOS:
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Pipeline Check

```bash
python app/main.py
```

### 4. Run Tests

```bash
pytest
```
