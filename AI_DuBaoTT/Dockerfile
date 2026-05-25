FROM python:3.10-slim

WORKDIR /app

ENV TZ="Asia/Ho_Chi_Minh"

RUN apt-get update && \
    apt-get install -y tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

CMD ["python", "src/realtime_forecast.py", "--use-mqtt", "--watch", "--interval", "60"]