import sys, traceback, os
# Ensure project root is on path so 'backend' package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from backend.main import app
from fastapi.testclient import TestClient

def main():
    try:
        # Use TestClient as a context manager so FastAPI startup/shutdown events run
        with TestClient(app) as client:
            r = client.get('/api/health')
            print('GET /api/health', r.status_code)
            print(r.json())

            r2 = client.get('/api/alliance/status')
            print('GET /api/alliance/status', r2.status_code)
            try:
                print(r2.json())
            except Exception:
                print('Alliance response not JSON')
    except Exception:
        traceback.print_exc()


if __name__ == '__main__':
    main()
