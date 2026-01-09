from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

# call resume
resp = client.post('/api/fl/fl/resume', json={"rounds": 2})
print('resume status', resp.status_code)
try:
    print(resp.json())
except Exception as e:
    print('resume json error', e)

# get status
resp2 = client.get('/api/fl/status')
print('status', resp2.status_code)
try:
    print(resp2.json())
except Exception as e:
    print('status json error', e)
