FROM python:3.10-slim

WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết cho psycopg2 và build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy và cài đặt python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code
COPY . .

# Chạy lệnh AI forecast
CMD ["python", "src/realtime_forecast.py", "--use-mqtt", "--watch", "--interval", "60"]
