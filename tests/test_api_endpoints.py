import unittest
from fastapi.testclient import TestClient
from backend.api.monitoring import router as monitoring_router
from backend.api.dashboard import router as dashboard_router
from backend.api.integrations import router as integrations_router
from fastapi import FastAPI

app = FastAPI()
app.include_router(monitoring_router)
app.include_router(dashboard_router)
app.include_router(integrations_router)
client = TestClient(app)

class TestAPIEndpoints(unittest.TestCase):
    def test_monitoring_metrics(self):
        response = client.get("/metrics")
        self.assertEqual(response.status_code, 200)
        self.assertIn("cpu_usage", response.json())

    def test_dashboard_privacy(self):
        response = client.get("/dashboard/privacy")
        self.assertEqual(response.status_code, 200)
        self.assertIn("privacy_policy", response.json())

    def test_threat_intel_recent(self):
        response = client.get("/threat-intel/recent")
        self.assertIn(response.status_code, [200, 403])  # 403 if no permission
        data = response.json()
        self.assertIn("status", data)
        self.assertIn("reports", data)

if __name__ == "__main__":
    unittest.main()
