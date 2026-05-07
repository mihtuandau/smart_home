# AI Phan Tich Tieu Thu Dien (ESP32 + Unsupervised Learning)

Du an nay phan tich du lieu tieu thu dien tu ESP32, hoc thoi quen su dung dien theo khung gio, phat hien bat thuong va dua ra canh bao/khuyen nghi tiet kiem dien.

## 1. Muc tieu he thong

- Doc du lieu cam bien ESP32: `temperature, humidity, pressure, voltage, current_mA, power_mW, rain, led1, led2` + thoi gian.
- Tien xu ly CSV va tao feature thoi gian (`hour`, `day_of_week`, `is_weekend`).
- Train 2 mo hinh unsupervised:
  - `K-Means`: hoc behavior pattern theo gio.
  - `Isolation Forest`: anomaly detection.
- Chay realtime qua MQTT:
  - Nhan ban tin moi.
  - Du doan `cluster_id`, `is_anomaly`, `anomaly_score`.
  - Ket hop rule-based de tao canh bao + khuyen nghi.
- Hien thi va theo doi canh bao qua Streamlit dashboard.

## 2. Trang thai hien tai (da ra soat)

### Da chay duoc

- Preprocess: OK
- Train K-Means: OK
- Train Isolation Forest: OK
- Predict 1 ban ghi: OK
- Python compile check cac module: OK
- Unit test (`pytest`): OK (`1 passed`)

### Luu y da xac nhan

- Canh bao/khuyen nghi da la tieng Viet co dau (UTF-8).
- Neu terminal Windows hien thi loi font/encoding, dashboard/web van hien thi dung.
- Realtime MQTT can broker dang chay (hien tai dang dung EMQX Cloud TLS port `8883` trong config).

## 3. Cau truc thu muc

```text
configs/                  # Cau hinh he thong (config.yaml)
data/raw/                 # Du lieu goc CSV
data/processed/           # Du lieu sau preprocess
models/                   # Model/scaler/metadata sau train
src/
  data/                   # Preprocess
  models/                 # Train + Predict
  realtime/               # MQTT consumer/publisher/subscriber
  rules/                  # Rule engine canh bao
  utils/                  # Logger helper
dashboard/                # Streamlit app
scripts/                  # Script chay nhanh
logs/                     # Nhat ky canh bao
tests/                    # Unit tests
```

## 4. Cai dat moi truong

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 5. Chay pipeline offline (preprocess + train)

### Cach 1: Chay script tong

```powershell
.\scripts\run_train.ps1
```

### Cach 2: Chay tung buoc

```powershell
.\.venv\Scripts\python.exe src\data\preprocess.py --config configs\config.yaml
.\.venv\Scripts\python.exe src\models\train_kmeans.py --config configs\config.yaml
.\.venv\Scripts\python.exe src\models\train_isolation_forest.py --config configs\config.yaml
```

Sau khi train xong, thu muc `models/` se co:

- `kmeans.pkl`
- `kmeans_scaler.pkl`
- `kmeans_metadata.pkl`
- `isolation_forest.pkl`
- `iforest_scaler.pkl`
- `iforest_metadata.pkl`

## 6. Thu predict nhanh

```powershell
.\.venv\Scripts\python.exe src\models\predict.py --config configs\config.yaml --input_csv data\processed\smart_home_processed.csv
```

## 7. Chay realtime MQTT

### 7.1. Kiem tra nhanh truoc khi chay

- Da train model it nhat 1 lan (`.\scripts\run_train.ps1`).
- Da cai thu vien day du:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

- Kiem tra cau hinh MQTT tai `configs/config.yaml`:
  - `broker: nfa1412a.ala.asia-southeast1.emqxsl.com`
  - `port: 8883`
  - `topic: TN/IOT/smarthome/tt`
  - `alert_topic: TN/IOT/smarthome/alerts`
  - `tls.enabled: true`
  - `tls.ca_cert: E:/class/Nam 4/Tot_nghiep_2026/emqxsl-ca.crt`

### 7.2. Chay chuong trinh (du lieu thuc tu MQTT)

Can 3 terminal, mo tai cung project `E:\class\AI_PhanTichDien`.

Moi terminal deu chay:

```powershell
cd e:\class\AI_PhanTichDien
.\.venv\Scripts\Activate.ps1
$env:PYTHONIOENCODING='utf-8'
```

Sau do chay lan luot:

### Terminal 1 - Consumer (phan tich realtime)

```powershell
python src\realtime\mqtt_consumer.py --config configs\config.yaml
```

### Terminal 2 - Alert subscriber (ghi log canh bao)

```powershell
python src\realtime\alert_subscriber.py --config configs\config.yaml --output_csv logs\alerts_history.csv
```

### Terminal 3 - Dashboard (xem canh bao truc quan)

```powershell
python -m streamlit run dashboard\streamlit_app.py
```

### 7.3. Neu ban muon test publisher gia lap (khong can ESP32)

```powershell
python src\realtime\mqtt_publisher_simulator.py --config configs\config.yaml --input_csv data\processed\smart_home_processed.csv --limit 20 --interval_sec 1
```

Topic hien tai:

- Input sensor: `TN/IOT/smarthome/tt`
- Alert output: `TN/IOT/smarthome/alerts`

## 8. Dashboard Streamlit

```powershell
.\scripts\run_dashboard.ps1
```

Hoac:

```powershell
.\.venv\Scripts\python.exe -m streamlit run dashboard\streamlit_app.py
```

Dashboard hien thi:

- Tong so canh bao, so bat thuong, canh bao gan nhat
- Bang lich su canh bao (`logs/alerts_history.csv`)
- Bieu do so canh bao theo thoi gian
- Baseline cong suat trung binh theo gio

Neu gap loi `No module named streamlit`, cai them:

```powershell
python -m pip install streamlit plotly
```

## 9. Rule canh bao thong minh

Rule hien tai gom:

- Bat den ban ngay.
- Cong suat vuot nguong co dinh (`high_power_mw_threshold`).
- Vuot baseline theo gio:
  - So sanh `power_mW hien tai` voi `trung binh lich su theo hour * abnormal_multiplier_vs_hourly_mean`.
- Bat thuong tu mo hinh Isolation Forest.

Tat ca rule nam trong `configs/config.yaml` phan `rules`.

## 10. Kiem thu

```powershell
.\.venv\Scripts\pytest -q
```

Ket qua hien tai: `1 passed`.

## 11. Luu y quan trong

- Dam bao file raw co du cot nhu config yeu cau. He thong co ho tro map `time -> timestamp`.
- Realtime MQTT se khong chay neu broker chua bat.
- Realtime MQTT TLS se khong ket noi duoc neu sai `ca_cert` hoac sai thoi gian he thong.
- Khi doi schema du lieu ESP32, can cap nhat:
  - `configs/config.yaml`
  - `src/data/preprocess.py`
  - feature list train/inference neu can
- Neu muon hien thi tieng Viet co dau dep tren terminal Windows, co the set:

```powershell
$env:PYTHONIOENCODING='utf-8'
```

## 12. Troubleshooting nhanh

### 1) Loi `ModuleNotFoundError: No module named 'src'`

Nguyen nhan:
- Chay sai thu muc goc project.

Cach xu ly ngay:
```powershell
cd e:\class\AI_PhanTichDien
.\.venv\Scripts\Activate.ps1
python src\realtime\mqtt_consumer.py --config configs\config.yaml
```

### 2) Loi `ConnectionRefusedError` hoac khong nhan duoc du lieu MQTT

Nguyen nhan:
- Sai `broker/port/topic`.
- Broker chua mo ket noi cho client.

Cach xu ly ngay:
- Kiem tra lai `realtime.mqtt.broker`, `port`, `topic` trong `configs/config.yaml`.
- Xac nhan ESP32 dang publish dung topic `TN/IOT/smarthome/tt`.
- Kiem tra tai khoan `username/password`.

### 3) Loi TLS/SSL (port 8883), vi du chung chi khong hop le

Nguyen nhan:
- Sai duong dan `ca_cert`.
- File CA khong dung cho broker.
- Gio he thong sai.

Cach xu ly ngay:
- Kiem tra `realtime.mqtt.tls.ca_cert` ton tai va dung file `.crt`.
- Dam bao `tls.enabled: true` va `port: 8883`.
- Dong bo lai ngay/gio he thong Windows.

### 4) Loi `No module named streamlit`

Nguyen nhan:
- Chua cai Streamlit trong `.venv`.

Cach xu ly ngay:
```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```
Neu can:
```powershell
python -m pip install streamlit plotly
```

### 5) Co du lieu MQTT nhung khong co canh bao

Nguyen nhan:
- Du lieu thuc te dang nam trong nguong binh thuong.
- Rule threshold dang dat qua cao.

Cach xu ly ngay:
- Giam nguong trong `configs/config.yaml`:
  - `rules.power.high_power_mw_threshold`
  - `rules.power.abnormal_multiplier_vs_hourly_mean`
- Chay test offline de kiem chung rule:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\test_alerts_offline.ps1 -Limit 50
```
