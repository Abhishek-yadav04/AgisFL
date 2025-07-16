import psutil
import requests
import time
import socket

BACKEND_URL = "http://localhost:5001/api/fl-ids/stream-data"  # Change if needed

def get_system_metrics():
    return {
        "hostname": socket.gethostname(),
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent,
        "bytes_sent": psutil.net_io_counters().bytes_sent,
        "bytes_recv": psutil.net_io_counters().bytes_recv,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S")
    }

while True:
    data = get_system_metrics()
    try:
        resp = requests.post(BACKEND_URL, json=data, timeout=5)
        print(f"Sent: {data} | Response: {resp.status_code}")
    except Exception as e:
        print(f"Error sending data: {e}")
    time.sleep(5)