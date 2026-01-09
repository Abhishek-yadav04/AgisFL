from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import re
import logging

logger = logging.getLogger("compatibility_stubs")

# List of frontend-orphan paths discovered by the audit run (sanitized at registration time)
ORPHAN_PATHS = [
    "/api/advanced-fl/compare",
    "/api/advanced-fl/comparisons",
    "/api/advanced-fl/engine/algorithm/switch",
    "/api/advanced-fl/engine/early-stopping/config",
    "/api/advanced-fl/engine/heterogeneity",
    "/api/advanced-fl/experiments/start-advanced",
    "/api/advanced-fl/optimization/recommendations",
    "/api/advanced-fl/switch",
    "/api/cache/cleanup",
    "/api/cache/clear",
    "/api/cache/entry",
    "/api/cache/stats",
    "/api/core/health",
    "/api/core/login",
    "/api/core/status",
    "/api/dashboard/alerts/acknowledge",
    "/api/dashboard/charts",
    "/api/dashboard/health/enhanced",
    "/api/dashboard/metrics",
    "/api/dashboard/overview",
    "/api/dashboard/privacy",
    "/api/dashboard/realtime",
    "/api/dashboard/simple-status",
    "/api/datasets${queryString",
    "/api/datasets/stats/overview",
    "/api/enterprise/dashboard",
    "/api/fl/clients/register",
    "/api/fl/fl/clients",
    "/api/fl/fl/debug",
    "/api/fl/fl/enterprise/capabilities",
    "/api/fl/fl/enterprise/dashboard",
    "/api/fl/fl/evaluate",
    "/api/fl/fl/experiments",
    "/api/fl/fl/explainability/configure",
    "/api/fl/fl/explainability/global",
    "/api/fl/fl/fairness/analysis",
    "/api/fl/fl/fairness/configure",
    "/api/fl/fl/governance/compliance",
    "/api/fl/fl/governance/policy",
    "/api/fl/fl/history",
    "/api/fl/fl/metrics",
    "/api/fl/fl/mlops/experiment/track",
    "/api/fl/fl/mlops/experiments",
    "/api/fl/fl/mlops/pipeline/status",
    "/api/fl/fl/overview",
    "/api/fl/fl/pause",
    "/api/fl/fl/privacy/configure",
    "/api/fl/fl/privacy/status",
    "/api/fl/fl/start",
    "/api/fl/fl/status",
    "/api/fl/fl/stop",
    "/api/fl/fl/strategies",
    "/api/fl/history",
    "/api/fl/live",
    "/api/fl/pause",
    "/api/fl/strategies",
    "/api/fl/strategy",
    "/api/fl/train",
    "/api/health/database",
    "/api/health/dependencies",
    "/api/health/live",
    "/api/health/readyz",
    "/api/health/reset",
    "/api/health/security",
    "/api/healthz",
    "/api/ids/api/ids/model/performance",
    "/api/ids/api/ids/model/retrain",
    "/api/ids/api/ids/network/analysis",
    "/api/ids/api/ids/start-monitoring",
    "/api/ids/api/ids/status",
    "/api/ids/api/ids/stop-monitoring",
    "/api/ids/api/ids/threats/active",
    "/api/ids/api/ids/threats/history",
    "/api/integrations",
    "/api/integrations/data-processing",
    "/api/integrations/fl-engine/status",
    "/api/integrations/ids-engine/status",
    "/api/integrations/ml-frameworks",
    "/api/integrations/overview",
    "/api/integrations/security-tools",
    "/api/integrations/system/capabilities",
    "/api/integrations/test",
    "/api/models",
    "/api/models/versions",
    "/api/monitoring/alerts/acknowledge",
    "/api/monitoring/alerts/active",
    "/api/monitoring/alerts/create",
    "/api/monitoring/alerts/resolve",
    "/api/monitoring/dashboard",
    "/api/monitoring/health",
    "/api/monitoring/health/services",
    "/api/monitoring/logs/recent",
    "/api/monitoring/metrics/prometheus",
    "/api/monitoring/performance/analytics",
    "/api/monitoring/performance/realtime",
    "/api/monitoring/system/metrics",
    "/api/monitoring/system/restart-monitoring",
    "/api/network/connections/block",
    "/api/network/firewall/rules",
    "/api/network/interfaces",
    "/api/network/network/connections",
    "/api/network/network/monitoring/start",
    "/api/network/network/monitoring/status",
    "/api/network/network/monitoring/stop",
    "/api/network/network/stats",
    "/api/network/network/threats",
    "/api/network/network/threats/block",
    "/api/network/packets",
    "/api/network/status",
    "/api/network/traffic",
    "/api/network/traffic/analysis",
    "/api/packet-capture/data",
    "/api/packet-capture/malicious",
    "/api/packet-capture/rules",
    "/api/packet-capture/threats",
    "/api/privacy/privacy/algorithms",
    "/api/privacy/privacy/analysis",
    "/api/privacy/privacy/audit",
    "/api/privacy/privacy/budget",
    "/api/privacy/privacy/budget/allocate",
    "/api/privacy/privacy/configure",
    "/api/privacy/privacy/health",
    "/api/privacy/privacy/metrics",
    "/api/privacy/privacy/violations",
    "/api/privacy/settings",
    "/api/rate-limit/stats",
    "/api/realtime/data",
    "/api/realtime/metrics",
    "/api/rules/overview",
    "/api/rules/security",
    "/api/rules/threat-detection",
    "/api/security/alerts",
    "/api/security/alerts/resolve",
    "/api/security/compliance",
    "/api/security/dashboard",
    "/api/security/events",
    "/api/security/incidents",
    "/api/security/ip/analyze",
    "/api/security/ip/block",
    "/api/security/ip/unblock",
    "/api/security/metrics",
    "/api/security/start-monitoring",
    "/api/security/threats/analysis",
    "/api/startup",
    "/api/system-monitoring/alerts",
    "/api/system-monitoring/alerts/acknowledge",
    "/api/system-monitoring/logs/system",
    "/api/system-monitoring/metrics",
    "/api/system-monitoring/metrics/current",
    "/api/system-monitoring/metrics/history",
    "/api/system-monitoring/network/connections",
    "/api/system-monitoring/network/monitoring-status",
    "/api/system-monitoring/network/monitoring/start",
    "/api/system-monitoring/network/monitoring/stop",
    "/api/system-monitoring/network/stats",
    "/api/system-monitoring/network/threats",
    "/api/system-monitoring/network/threats/block",
    "/api/system-monitoring/overview",
    "/api/system-monitoring/performance/analysis",
    "/api/system-monitoring/services/status",
    "/api/system-monitoring/status",
    "/api/system/metrics",
    "/api/system/processes",
    "/api/threat-analysis/packet-threats",
    "/api/threat-analysis/threat-summary",
    "/api/threat-detection/analyze-packet",
    "/api/threat-detection/batch-analyze",
    "/api/threat-detection/recent-threats",
    "/api/threat-detection/simulate-threat",
    "/api/threat-detection/statistics",
    "/api/threat-detection/status",
    "/apiService",
]

from fastapi import FastAPI


def _sanitize_path(raw: str) -> str:
    """Turn frontend-orphan string into a FastAPI-compatible path template.

    - Removes any ${...} query placeholders
    - Ensures leading '/'
    - Collapses repeated slashes
    """
    if not raw:
        return raw
    path = raw
    # Remove ${...} query expressions inserted by frontend templating
    path = re.sub(r"\$\{[^}]*\}", "", path)
    # Replace spaces
    path = path.strip()
    # Ensure it starts with '/'
    if not path.startswith('/'):
        path = '/' + path
    # Collapse duplicate slashes
    path = re.sub(r'/{2,}', '/', path)
    return path


def _make_handler(raw_path: str):
    async def handler(request: Request):
        # Return a non-5xx compatibility fallback so frontends can operate
        # in demo / compatibility mode without treating this as a server error.
        return JSONResponse(
            status_code=200,
            content={
                "status": "compatibility_stub",
                "fallback": True,
                "message": "Compatibility stub - returning demo fallback. Implement real backend for production.",
                "requested_path": str(request.url.path),
                "method": request.method,
                "note": "This endpoint was added as a temporary compatibility stub. Implement proper backend logic or update frontend to the canonical API.",
                "frontend_path_raw": raw_path,
            },
        )

    return handler


# Register stubs for each orphan path. Use common HTTP methods to cover typical frontend calls.
COMMON_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]


def register_compatibility_stubs(app: FastAPI):
    """Register compatibility stub routes directly on the FastAPI `app`.

    This function checks existing `app.routes` and will not add a stub for a
    path that already has a registered handler. Use this from the central
    application (after other routers are included) so we don't shadow real
    endpoints.
    """
    _registered = 0
    _skipped = []

    # Build set of existing paths for quick lookup
    existing_paths = {getattr(r, 'path', '') for r in app.routes if hasattr(r, 'path')}

    for i, raw in enumerate(ORPHAN_PATHS):
        try:
            path = _sanitize_path(raw)
            if not path:
                _skipped.append((raw, "empty after sanitize"))
                continue
            # Avoid creating compatibility stubs under /api/fl since the
            # federated learning router provides canonical endpoints and
            # we don't want to accidentally shadow those handlers.
            if path.startswith('/api/fl'):
                _skipped.append((raw, 'skipped: FL endpoints handled by canonical router'))
                continue
            # Avoid creating a stub for a path that looks like a file or service name without a slash
            if path == '/apiService' or not path.startswith('/api'):
                _skipped.append((raw, 'non-api or reserved'))
                continue

            # If the application already has a route for this path, skip registering
            if path in existing_paths:
                _skipped.append((raw, 'already implemented'))
                continue

            endpoint = _make_handler(raw)
            # add_api_route will raise ValueError for invalid paths; catch and continue
            app.add_api_route(path, endpoint, methods=COMMON_METHODS, name=f"compat_stub_{i}")
            _registered += 1
        except Exception as exc:  # pragma: no cover - robust runtime
            logger.exception("Failed to register compatibility stub for %s", raw)
            _skipped.append((raw, str(exc)))

    logger.info("Compatibility stubs registered on app: %d, skipped: %d", _registered, len(_skipped))
    return {"registered": _registered, "skipped": len(_skipped), "skipped_details": _skipped}
