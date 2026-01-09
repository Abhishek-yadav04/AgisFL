# AgisFL Full-Stack Test Suite

## Directory Structure

- `backend/unit/` - Unit tests for backend utility functions and services
- `backend/integration/` - Integration tests for backend API endpoints and database
- `frontend/component/` - Component tests for frontend UI
- `e2e/` - End-to-end tests simulating user journeys
- `performance/` - Load and performance tests (Locust)

## How to Run All Tests

1. **Install dependencies:**
   ```powershell
   pip install -r tests/requirements.txt
   ```
2. **Run backend unit/integration tests:**
   ```powershell
   pytest tests/backend
   ```
3. **Run performance tests:**
   ```powershell
   locust -f tests/performance/locustfile.py --host=http://localhost:8000
   ```

## Adding More Tests
- Place new backend unit tests in `backend/unit/`
- Place new backend integration tests in `backend/integration/`
- Add frontend/component and e2e tests using Vitest/Jest/Playwright in their respective folders

## CI/CD Integration
- All tests are atomic and independent
- Use the above commands in your CI pipeline for automated validation
