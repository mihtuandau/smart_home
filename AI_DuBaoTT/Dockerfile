FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

# Lệnh mặc định sẽ được docker-compose ghi đè, 
# nhưng chúng ta vẫn khai báo một lệnh mẫu ở đây.
CMD ["python", "src/realtime_forecast.py", "--use-mqtt", "--watch", "--interval", "60"]
