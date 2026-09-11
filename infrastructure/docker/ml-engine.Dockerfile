FROM python:3.11-slim

WORKDIR /app

COPY services/ml-engine/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY services/ml-engine/ ./

CMD ["python", "app/main.py"]
