from __future__ import annotations

from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st


st.set_page_config(page_title="AI Phân Tích Điện", layout="wide")
st.title("Dashboard Cảnh Báo Tiêu Thụ Điện")

alerts_path = Path("logs/alerts_history.csv")
processed_path = Path("data/processed/smart_home_processed.csv")

refresh_sec = st.sidebar.slider("Tự làm mới (giây)", min_value=2, max_value=30, value=5)
st.sidebar.caption("Nhấn Rerun nếu cần cập nhật ngay.")
st.sidebar.write(f"Tệp cảnh báo: `{alerts_path}`")

if alerts_path.exists():
    alerts_df = pd.read_csv(alerts_path)
else:
    alerts_df = pd.DataFrame(
        columns=[
            "logged_at",
            "topic",
            "cluster_id",
            "is_anomaly",
            "anomaly_score",
            "alerts",
            "recommendations",
        ]
    )

if not alerts_df.empty:
    alerts_df["logged_at"] = pd.to_datetime(alerts_df["logged_at"], errors="coerce")
    alerts_df = alerts_df.sort_values("logged_at", ascending=False)

col1, col2, col3 = st.columns(3)
col1.metric("Tổng cảnh báo", int(len(alerts_df)))
if not alerts_df.empty and "is_anomaly" in alerts_df.columns:
    col2.metric("Số bản ghi bất thường", int(alerts_df["is_anomaly"].astype(str).str.lower().eq("true").sum()))
else:
    col2.metric("Số bản ghi bất thường", 0)
if not alerts_df.empty and "logged_at" in alerts_df.columns:
    last_time = alerts_df["logged_at"].dropna().max()
    col3.metric("Cảnh báo gần nhất", str(last_time) if pd.notna(last_time) else "N/A")
else:
    col3.metric("Cảnh báo gần nhất", "N/A")

st.subheader("Lịch sử cảnh báo")
st.dataframe(alerts_df, use_container_width=True, height=320)

if not alerts_df.empty and "logged_at" in alerts_df.columns:
    ts_df = alerts_df.dropna(subset=["logged_at"]).copy()
    if not ts_df.empty:
        ts_df["minute"] = ts_df["logged_at"].dt.floor("min")
        count_df = ts_df.groupby("minute").size().reset_index(name="count")
        fig_alerts = px.line(count_df, x="minute", y="count", title="Số cảnh báo theo thời gian")
        st.plotly_chart(fig_alerts, use_container_width=True)

st.subheader("Baseline tiêu thụ theo giờ (từ dữ liệu processed)")
if processed_path.exists():
    p_df = pd.read_csv(processed_path)
    if "hour" not in p_df.columns and "timestamp" in p_df.columns:
        p_df["hour"] = pd.to_datetime(p_df["timestamp"], errors="coerce").dt.hour
    if "hour" in p_df.columns and "power_mW" in p_df.columns:
        baseline_df = p_df.groupby("hour", as_index=False)["power_mW"].mean()
        baseline_df = baseline_df.sort_values("hour")
        fig_base = px.bar(
            baseline_df,
            x="hour",
            y="power_mW",
            title="Công suất trung bình theo giờ (mW)",
            labels={"hour": "Giờ", "power_mW": "Công suất trung bình (mW)"},
        )
        st.plotly_chart(fig_base, use_container_width=True)
    else:
        st.info("Dữ liệu processed chưa có đủ cột `hour` và `power_mW`.")
else:
    st.info("Chưa có tệp dữ liệu processed.")

st.caption(f"Tự làm mới mỗi {refresh_sec} giây (dùng nút Rerun để cập nhật ngay).")
