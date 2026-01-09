import os
import sys
from pathlib import Path

# Ensure project root and backend package are importable during tests
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

# Hardened test environment: make sure anonymous access is disabled
os.environ.setdefault("DISABLE_AUTHENTICATION", "false")

import pytest

@pytest.fixture(autouse=True)
def enforce_non_anonymous_env(monkeypatch):
    # Tests should run against hardened behavior: authentication required
    monkeypatch.setenv("DISABLE_AUTHENTICATION", "false")
    yield
