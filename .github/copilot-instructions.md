# AgisFL Copilot Instructions

## Architecture Overview

AgisFL is an autonomous federated learning platform with a **FastAPI backend**, **React frontend**, and **enterprise-grade security**. Key components:

- **Backend**: FastAPI with async endpoints, WebSocket real-time updates, SQLite/PostgreSQL databases
- **Frontend**: React with TypeScript, Vite build system, real-time dashboards
- **SDK**: Three-line integration (`agisfl.init()`, `agisfl.load_data()`, `agisfl.run_training()`)
- **CLI**: `agis-cli` for enterprise administration
- **Security**: JWT authentication, RBAC, differential privacy, audit logging
- **Infrastructure**: Redis caching, Prometheus metrics, structured logging with structlog

## Critical Developer Workflows

### Three-Line SDK Integration
```python
import agisfl

agisfl.init(api_key="your_key", use_differential_privacy=True)  # Line 1
data_loader = agisfl.load_data("./patient_data.csv")           # Line 2
results = agisfl.run_training(HeartDiseaseModel(), data_loader) # Line 3
```

### Starting the Platform
```bash
# One-command start (Windows)
.\start_production.bat

# Manual setup
cd backend && python main.py              # Backend on :8000
cd frontend && npm run dev               # Frontend on :5173
```

### Testing Patterns
```bash
# Run all tests
cd backend && python -m pytest tests/ -v

# API endpoint testing
python test_api.py

# Integration tests
python FINAL_VERIFICATION.py
```

### CLI Administration
```bash
agis-cli experiment create "healthcare_ai" --participants 5
agis-cli monitor dashboard --experiment exp_123
agis-cli governance audit exp_123 --output report.json
```

## Project-Specific Conventions

### Anonymous Access Mode
Set `DISABLE_AUTHENTICATION=true` for zero-friction deployment - all endpoints work without authentication, user automatically becomes "anonymous" admin.

### Async/Await Everywhere
All backend code uses async patterns:
```python
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
```

### Security-First Approach
- **No hardcoded credentials** - all secrets auto-generated or environment-based
- **JWT authentication** when enabled, with RBAC
- **Input validation** with Pydantic models
- **Audit logging** for all operations
- **Differential privacy** configurable per experiment

### Real Implementations Only
- FL engines use actual PyTorch models (not mocks)
- All business logic implemented with real algorithms
- Production-ready error handling and monitoring

### Structured Logging
```python
import structlog
logger = structlog.get_logger()
logger.info("FL training started", experiment_id=exp_id, client_count=5)
```

### Database Patterns
- **SQLite** for development (`agisfl.db`)
- **PostgreSQL** for production with asyncpg
- **Alembic** migrations in `alembic/` directory
- **Redis** for caching and session management

## Integration Points

### API Communication
- **Backend API**: `http://localhost:8000` with OpenAPI docs at `/docs`
- **SDK-Backend**: HTTP calls with API keys for authentication
- **CLI-Backend**: Direct HTTP client calls to API endpoints
- **Frontend-Backend**: REST API calls with JWT tokens

### WebSocket Real-Time Updates
```python
# Backend WebSocket manager
from backend.core.websocket import ws_manager
await ws_manager.broadcast({"type": "fl_progress", "round": 5})
```

### External Dependencies
- **MongoDB Atlas** for enterprise deployments
- **Redis** for caching and pub/sub
- **Prometheus** for metrics collection
- **GeoIP2** for location-based features

### Cross-Component Communication
- **SDK → Backend**: Federated learning job submission and monitoring
- **CLI → Backend**: Administrative operations and monitoring
- **Frontend → Backend**: Dashboard data and control operations
- **Backend → Frontend**: Real-time WebSocket updates for live dashboards

## Key Files and Directories

### Core Architecture
- `backend/main.py` - Main FastAPI application
- `backend/core/fl_engine.py` - Real federated learning engine
- `sdk/agisfl_client.py` - Three-line integration SDK
- `cli/agis-cli.py` - Enterprise CLI tools

### Configuration
- `requirements.txt` - Python dependencies
- `package.json` - Frontend dependencies
- `pytest.ini` - Test configuration
- `.env` - Environment variables

### Data and Models
- `datasets/` - Sample datasets (CICIDS2017, etc.)
- `backend/models/` - Database models
- `alembic/` - Database migrations

### APIs and Routes
- `backend/api/` - All API endpoints
- `backend/api/autofl.py` - Autonomous FL API
- `backend/api/protected/` - Authenticated endpoints

### Testing
- `backend/tests/` - Unit and integration tests
- `test_api.py` - API endpoint testing
- `FINAL_VERIFICATION.py` - Comprehensive verification

## Development Best Practices

### Error Handling
```python
try:
    result = await fl_engine.train_model(model, data)
except Exception as e:
    logger.error("Training failed", error=str(e), experiment_id=exp_id)
    raise HTTPException(status_code=500, detail="Training failed")
```

### Authentication Checks
```python
@app.get("/api/protected/resource")
async def protected_resource(current_user: User = Depends(get_current_user)):
    # User automatically validated via JWT
    return {"data": "protected"}
```

### WebSocket Broadcasting
```python
# Broadcast FL progress to all connected clients
await ws_manager.broadcast({
    "type": "fl_update",
    "experiment_id": exp_id,
    "round": current_round,
    "accuracy": accuracy
})
```

### Database Operations
```python
# Async database operations
async with database.transaction():
    await Experiment.create(name=exp_name, participants=count)
```

## Common Patterns

### FL Experiment Lifecycle
1. Create experiment via CLI or API
2. Upload/configure datasets
3. Start FL training with SDK
4. Monitor progress via WebSocket/dashboard
5. Retrieve results and audit logs

### Security Implementation
- All sensitive endpoints require authentication unless `DISABLE_AUTHENTICATION=true`
- API keys for SDK authentication
- JWT tokens with expiration for web sessions
- Role-based permissions (admin, user, anonymous)

### Deployment Configurations
- **Development**: SQLite + local Redis
- **Staging**: Docker Compose with PostgreSQL
- **Production**: Kubernetes with MongoDB Atlas

## Troubleshooting

### Common Issues
- **Port conflicts**: Check if ports 8000/5173 are available
- **Database errors**: Ensure SQLite file permissions or PostgreSQL connection
- **WebSocket issues**: Verify Redis is running for pub/sub
- **Authentication failures**: Check JWT secrets or enable anonymous mode

### Debug Commands
```bash
# Check backend health
curl http://localhost:8000/health

# Test API endpoints
python test_api.py

# View logs
tail -f backend/logs/agisfl_production.log

# Check database
python -c "import sqlite3; print(sqlite3.connect('agisfl.db').execute('SELECT name FROM experiments').fetchall())"
```</content>
<parameter name="filePath">c:\Users\admin\OneDrive\Desktop\AgisFL-testing\.github\copilot-instructions.md