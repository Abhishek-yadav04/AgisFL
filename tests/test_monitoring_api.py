import unittest
from fastapi.testclient import TestClient
from backend.api.monitoring import router
from fastapi import FastAPI

app = FastAPI()
app.include_router(router)
client = TestClient(app)

class TestMonitoringAPI(unittest.TestCase):
    def test_get_metrics(self):
        response = client.get("/metrics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("cpu_usage", data)
        self.assertIn("memory_usage", data)
        self.assertIn("disk_usage", data)
        self.assertIn("network_io", data)
        self.assertIn("response_time_ms", data)
        self.assertIn("requests_per_second", data)
        self.assertIn("error_rate", data)
        self.assertIn("uptime_seconds", data)

    def test_get_monitoring_system_status(self):
        response = client.get("/system/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("services", data)
        self.assertIn("last_check", data)

if __name__ == "__main__":
    unittest.main()
