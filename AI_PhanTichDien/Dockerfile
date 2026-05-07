FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

# Lệnh mặc định chạy script phân tích điện
CMD ["python", "src/realtime/mqtt_consumer.py", "--config", "configs/config.yaml"]
