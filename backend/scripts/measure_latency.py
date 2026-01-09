import requests
import time
import statistics

BASE_URL = "http://127.0.0.1:8000"
ENDPOINTS = ["/", "/health", "/api/health", "/api/fl/status"]

def measure(endpoint, runs=50):
    url = BASE_URL + endpoint
    times = []
    ok = 0
    for i in range(runs):
        try:
            start = time.perf_counter()
            r = requests.get(url, timeout=5)
            elapsed = (time.perf_counter() - start) * 1000.0
            times.append(elapsed)
            if r.status_code == 200:
                ok += 1
        except Exception as e:
            times.append(None)
    return times, ok

if __name__ == '__main__':
    report = {}
    for ep in ENDPOINTS:
        times, ok = measure(ep, runs=20)
        valid = [t for t in times if t is not None]
        if valid:
            report[ep] = {
                'p50_ms': statistics.median(valid),
                'p95_ms': statistics.quantiles(valid, n=100)[94],
                'p99_ms': statistics.quantiles(valid, n=100)[98] if len(valid) > 1 else valid[-1],
                'mean_ms': statistics.mean(valid),
                'success_rate': ok / len(times)
            }
        else:
            report[ep] = {'error': 'no successful requests', 'success_rate': ok / len(times)}

    import json
    print(json.dumps(report, indent=2))
