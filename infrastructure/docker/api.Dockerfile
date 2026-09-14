FROM python:3.11-slim

WORKDIR /app

COPY apps/backend/requirements.txt ./backend-requirements.txt
COPY apps/ml-engine/requirements.txt ./ml-requirements.txt
RUN pip install --no-cache-dir -r backend-requirements.txt -r ml-requirements.txt

COPY apps/backend/ ./apps/backend/
# apps/backend/app/services/ml_service.py imports the inference pipeline directly
# from apps/ml-engine/src, and the pipeline reads trained artifacts from
# apps/ml-engine/models and raw/processed rasters from apps/ml-engine/data.
COPY apps/ml-engine/src/ ./apps/ml-engine/src/
COPY apps/ml-engine/models/ ./apps/ml-engine/models/
COPY apps/ml-engine/data/ ./apps/ml-engine/data/

WORKDIR /app/apps/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
