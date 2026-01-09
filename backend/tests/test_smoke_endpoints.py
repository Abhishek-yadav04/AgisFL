import os
from fastapi.testclient import TestClient
from main import app

# Force demo mode for this smoke test
os.environ['AUTH_MODE'] = 'demo'

client = TestClient(app)


def is_safe_route(route):
    # Skip websockets and routes with path params
    if "websocket" in route.methods or "WS" in route.name.upper():
        return False
    if "{" in route.path:
        return False
    # Only test GET endpoints
    return "GET" in route.methods


def test_smoke_no_403_on_get_endpoints():
    failures = []
    for route in app.routes:
        try:
            if not hasattr(route, "path"):
                continue
            if not is_safe_route(route):
                continue
            # Skip docs/openapi to avoid large processing
            if route.path.startswith("/docs") or route.path.startswith("/openapi") or route.path.startswith("/redoc"):
                continue
            # perform GET
            resp = client.get(route.path)
            if resp.status_code == 403:
                failures.append((route.path, resp.status_code, resp.text))
            if 500 <= resp.status_code < 600:
                failures.append((route.path, resp.status_code, resp.text))
        except Exception as e:
            failures.append((getattr(route, 'path', '<unknown>'), 'exception', str(e)))
    assert not failures, f"Found endpoints returning 403/5xx/exception in demo mode: {failures}"
