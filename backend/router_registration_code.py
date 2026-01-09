
# Comprehensive Router Registration
print("Registering all API routers...")

# Optionally apply a router-scoped dependency that bypasses authentication
# when DISABLE_AUTHENTICATION is set. This uses the helper from the
# security module; the helper returns a dependency callable suitable for
# FastAPI's `dependencies` parameter on include_router.
try:
    from api.security import optional_auth_dependency
    from fastapi import Depends
    import os
    # Always use the optional dependency helper — it returns a no-op when
    # DISABLE_AUTHENTICATION is enabled, or returns a permissive wrapper that
    # allows anonymous access in demo mode. Attaching it here ensures router-
    # level inclusion won't block anonymous access in dev/demo modes.
    _global_dev_dependencies = [Depends(optional_auth_dependency())]
except Exception:
    _global_dev_dependencies = []

router_registration_results = []


# Dashboard Router
try:
    from api.dashboard import router as dashboard_router
    app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Dashboard", "SUCCESS"))
    print(f"[SUCCESS] Dashboard router registered at /api/dashboard")
except ImportError as e:
    router_registration_results.append(("Dashboard", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Dashboard router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Dashboard", f"ERROR: {e}"))
    print(f"[ERROR] Dashboard router - Error: {e}")

# Monitoring Router
try:
    from api.monitoring import router as monitoring_router
    app.include_router(monitoring_router, prefix="/api/monitoring", tags=["Monitoring"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Monitoring", "SUCCESS"))
    print(f"[SUCCESS] Monitoring router registered at /api/monitoring")
except ImportError as e:
    router_registration_results.append(("Monitoring", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Monitoring router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Monitoring", f"ERROR: {e}"))
    print(f"[ERROR] Monitoring router - Error: {e}")

# Integrations Router
try:
    from api.integrations import router as integrations_router
    app.include_router(integrations_router, prefix="/api/integrations", tags=["Integrations"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Integrations", "SUCCESS"))
    print(f"[SUCCESS] Integrations router registered at /api/integrations")
except ImportError as e:
    router_registration_results.append(("Integrations", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Integrations router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Integrations", f"ERROR: {e}"))
    print(f"[ERROR] Integrations router - Error: {e}")

# Security Router
try:
    from api.security import router as security_router
    app.include_router(security_router, prefix="/api/security", tags=["Security"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Security", "SUCCESS"))
    print(f"[SUCCESS] Security router registered at /api/security")
except ImportError as e:
    router_registration_results.append(("Security", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Security router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Security", f"ERROR: {e}"))
    print(f"[ERROR] Security router - Error: {e}")

# Real-time Router
try:
    from api.realtime import router as realtime_router
    app.include_router(realtime_router, prefix="/api/realtime", tags=["Real-time"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Real-time", "SUCCESS"))
    print(f"[SUCCESS] Real-time router registered at /api/realtime")
except ImportError as e:
    router_registration_results.append(("Real-time", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Real-time router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Real-time", f"ERROR: {e}"))
    print(f"[ERROR] Real-time router - Error: {e}")

# Privacy Router
try:
    from api.privacy import router as privacy_router
    app.include_router(privacy_router, prefix="/api/privacy", tags=["Privacy"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Privacy", "SUCCESS"))
    print(f"[SUCCESS] Privacy router registered at /api/privacy")
except ImportError as e:
    router_registration_results.append(("Privacy", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Privacy router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Privacy", f"ERROR: {e}"))
    print(f"[ERROR] Privacy router - Error: {e}")

# System Router
try:
    from api.system import router as system_router
    app.include_router(system_router, prefix="/api/system", tags=["System"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("System", "SUCCESS"))
    print(f"[SUCCESS] System router registered at /api/system")
except ImportError as e:
    router_registration_results.append(("System", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] System router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("System", f"ERROR: {e}"))
    print(f"[ERROR] System router - Error: {e}")

# Authentication Router
try:
    from api.auth import router as auth_router
    app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Authentication", "SUCCESS"))
    print(f"[SUCCESS] Authentication router registered at /api/auth")
except ImportError as e:
    router_registration_results.append(("Authentication", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Authentication router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Authentication", f"ERROR: {e}"))
    print(f"[ERROR] Authentication router - Error: {e}")

# Health Router
try:
    from api.health import router as health_router
    app.include_router(health_router, prefix="/api/health", tags=["Health"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Health", "SUCCESS"))
    print(f"[SUCCESS] Health router registered at /api/health")
except ImportError as e:
    router_registration_results.append(("Health", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Health router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Health", f"ERROR: {e}"))
    print(f"[ERROR] Health router - Error: {e}")

# Metrics Router
try:
    from api.metrics import router as metrics_router
    app.include_router(metrics_router, prefix="/api/metrics", tags=["Metrics"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Metrics", "SUCCESS"))
    print(f"[SUCCESS] Metrics router registered at /api/metrics")
except ImportError as e:
    router_registration_results.append(("Metrics", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Metrics router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Metrics", f"ERROR: {e}"))
    print(f"[ERROR] Metrics router - Error: {e}")

# Datasets Router
try:
    from api.datasets import router as datasets_router
    app.include_router(datasets_router, prefix="/api/datasets", tags=["Datasets"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Datasets", "SUCCESS"))
    print(f"[SUCCESS] Datasets router registered at /api/datasets")
except ImportError as e:
    router_registration_results.append(("Datasets", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Datasets router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Datasets", f"ERROR: {e}"))
    print(f"[ERROR] Datasets router - Error: {e}")

# Federated Learning Router
try:
    from api.federated_learning import router as federated_learning_router
    app.include_router(federated_learning_router, prefix="/api/fl", tags=["Federated Learning"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Federated Learning", "SUCCESS"))
    print(f"[SUCCESS] Federated Learning router registered at /api/fl")
except ImportError as e:
    router_registration_results.append(("Federated Learning", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Federated Learning router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Federated Learning", f"ERROR: {e}"))
    print(f"[ERROR] Federated Learning router - Error: {e}")

# Threat Detection Router
try:
    from api.threat_detection import router as threat_detection_router
    app.include_router(threat_detection_router, prefix="/api/threat-detection", tags=["Threat Detection"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Threat Detection", "SUCCESS"))
    print(f"[SUCCESS] Threat Detection router registered at /api/threat-detection")
except ImportError as e:
    router_registration_results.append(("Threat Detection", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Threat Detection router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Threat Detection", f"ERROR: {e}"))
    print(f"[ERROR] Threat Detection router - Error: {e}")

# Threat Analysis Router
try:
    from api.threat_analysis import router as threat_analysis_router
    app.include_router(threat_analysis_router, prefix="/api/threat-analysis", tags=["Threat Analysis"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Threat Analysis", "SUCCESS"))
    print(f"[SUCCESS] Threat Analysis router registered at /api/threat-analysis")
except ImportError as e:
    router_registration_results.append(("Threat Analysis", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Threat Analysis router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Threat Analysis", f"ERROR: {e}"))
    print(f"[ERROR] Threat Analysis router - Error: {e}")

# Packet Capture Router
try:
    from api.packet_capture import router as packet_capture_router
    app.include_router(packet_capture_router, prefix="/api/packet-capture", tags=["Packet Capture"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Packet Capture", "SUCCESS"))
    print(f"[SUCCESS] Packet Capture router registered at /api/packet-capture")
except ImportError as e:
    router_registration_results.append(("Packet Capture", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Packet Capture router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Packet Capture", f"ERROR: {e}"))
    print(f"[ERROR] Packet Capture router - Error: {e}")

# Advanced FL Router
try:
    from api.advanced_fl import router as advanced_fl_router
    app.include_router(advanced_fl_router, prefix="/api/advanced-fl", tags=["Advanced FL"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Advanced FL", "SUCCESS"))
    print(f"[SUCCESS] Advanced FL router registered at /api/advanced-fl")
except ImportError as e:
    router_registration_results.append(("Advanced FL", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Advanced FL router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Advanced FL", f"ERROR: {e}"))
    print(f"[ERROR] Advanced FL router - Error: {e}")

# AutoFL Router
try:
    from api.autofl_routes import router as autofl_routes_router
    app.include_router(autofl_routes_router, prefix="/api/autofl", tags=["AutoFL"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("AutoFL", "SUCCESS"))
    print(f"[SUCCESS] AutoFL router registered at /api/autofl")
except ImportError as e:
    router_registration_results.append(("AutoFL", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] AutoFL router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("AutoFL", f"ERROR: {e}"))
    print(f"[ERROR] AutoFL router - Error: {e}")

# Alliance Router
try:
    from api.alliance_routes import router as alliance_routes_router
    app.include_router(alliance_routes_router, prefix="/api/alliance", tags=["Alliance"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Alliance", "SUCCESS"))
    print(f"[SUCCESS] Alliance router registered at /api/alliance")
except ImportError as e:
    router_registration_results.append(("Alliance", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Alliance router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Alliance", f"ERROR: {e}"))
    print(f"[ERROR] Alliance router - Error: {e}")

# Marketplace Router
try:
    from api.marketplace_routes import router as marketplace_routes_router
    app.include_router(marketplace_routes_router, prefix="/api/marketplace", tags=["Marketplace"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Marketplace", "SUCCESS"))
    print(f"[SUCCESS] Marketplace router registered at /api/marketplace")
except ImportError as e:
    router_registration_results.append(("Marketplace", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Marketplace router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Marketplace", f"ERROR: {e}"))
    print(f"[ERROR] Marketplace router - Error: {e}")

# Audit Router
try:
    from api.audit import router as audit_router
    app.include_router(audit_router, prefix="/api/audit", tags=["Audit"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Audit", "SUCCESS"))
    print(f"[SUCCESS] Audit router registered at /api/audit")
except ImportError as e:
    router_registration_results.append(("Audit", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Audit router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Audit", f"ERROR: {e}"))
    print(f"[ERROR] Audit router - Error: {e}")

# Cache Router
try:
    from api.cache import router as cache_router
    app.include_router(cache_router, prefix="/api/cache", tags=["Cache"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Cache", "SUCCESS"))
    print(f"[SUCCESS] Cache router registered at /api/cache")
except ImportError as e:
    router_registration_results.append(("Cache", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Cache router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Cache", f"ERROR: {e}"))
    print(f"[ERROR] Cache router - Error: {e}")

# Frontend Router
try:
    from api.frontend import router as frontend_router
    app.include_router(frontend_router, prefix="/api/frontend", tags=["Frontend"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Frontend", "SUCCESS"))
    print(f"[SUCCESS] Frontend router registered at /api/frontend")
except ImportError as e:
    router_registration_results.append(("Frontend", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Frontend router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Frontend", f"ERROR: {e}"))
    print(f"[ERROR] Frontend router - Error: {e}")

# IDS Router
try:
    from api.ids import router as ids_router
    app.include_router(ids_router, prefix="/api/ids", tags=["IDS"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("IDS", "SUCCESS"))
    print(f"[SUCCESS] IDS router registered at /api/ids")
except ImportError as e:
    router_registration_results.append(("IDS", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] IDS router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("IDS", f"ERROR: {e}"))
    print(f"[ERROR] IDS router - Error: {e}")

# Validation Router
try:
    from api.input_validation import router as input_validation_router
    app.include_router(input_validation_router, prefix="/api/validation", tags=["Validation"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Validation", "SUCCESS"))
    print(f"[SUCCESS] Validation router registered at /api/validation")
except ImportError as e:
    router_registration_results.append(("Validation", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Validation router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Validation", f"ERROR: {e}"))
    print(f"[ERROR] Validation router - Error: {e}")

# MFA Router
try:
    from api.mfa import router as mfa_router
    app.include_router(mfa_router, prefix="/api/mfa", tags=["MFA"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("MFA", "SUCCESS"))
    print(f"[SUCCESS] MFA router registered at /api/mfa")
except ImportError as e:
    router_registration_results.append(("MFA", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] MFA router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("MFA", f"ERROR: {e}"))
    print(f"[ERROR] MFA router - Error: {e}")

# Model Versions Router
try:
    from api.model_versions import router as model_versions_router
    app.include_router(model_versions_router, prefix="/api/models", tags=["Model Versions"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Model Versions", "SUCCESS"))
    print(f"[SUCCESS] Model Versions router registered at /api/models")
except ImportError as e:
    router_registration_results.append(("Model Versions", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Model Versions router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Model Versions", f"ERROR: {e}"))
    print(f"[ERROR] Model Versions router - Error: {e}")

# Network Router
try:
    from api.network import router as network_router
    app.include_router(network_router, prefix="/api/network", tags=["Network"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Network", "SUCCESS"))
    print(f"[SUCCESS] Network router registered at /api/network")
except ImportError as e:
    router_registration_results.append(("Network", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Network router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Network", f"ERROR: {e}"))
    print(f"[ERROR] Network router - Error: {e}")

# Network Monitoring Router
try:
    from api.network_monitoring import router as network_monitoring_router
    app.include_router(network_monitoring_router, prefix="/api/network-monitoring", tags=["Network Monitoring"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Network Monitoring", "SUCCESS"))
    print(f"[SUCCESS] Network Monitoring router registered at /api/network-monitoring")
except ImportError as e:
    router_registration_results.append(("Network Monitoring", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Network Monitoring router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Network Monitoring", f"ERROR: {e}"))
    print(f"[ERROR] Network Monitoring router - Error: {e}")

# Packet Capture Router
try:
    from api.packet_capture import router as packet_capture_router
    app.include_router(packet_capture_router, prefix="/api/packet-capture", tags=["Packet Capture"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Packet Capture", "SUCCESS"))
    print(f"[SUCCESS] Packet Capture router registered at /api/packet-capture")
except ImportError as e:
    router_registration_results.append(("Packet Capture", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Packet Capture router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Packet Capture", f"ERROR: {e}"))
    print(f"[ERROR] Packet Capture router - Error: {e}")

# Protected Router
try:
    from api.protected import router as protected_router
    app.include_router(protected_router, prefix="/api/protected", tags=["Protected"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Protected", "SUCCESS"))
    print(f"[SUCCESS] Protected router registered at /api/protected")
except ImportError as e:
    router_registration_results.append(("Protected", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Protected router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Protected", f"ERROR: {e}"))
    print(f"[ERROR] Protected router - Error: {e}")

# Rate Limiting Router
try:
    from api.rate_limiting import router as rate_limiting_router
    app.include_router(rate_limiting_router, prefix="/api/rate-limiting", tags=["Rate Limiting"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Rate Limiting", "SUCCESS"))
    print(f"[SUCCESS] Rate Limiting router registered at /api/rate-limiting")
except ImportError as e:
    router_registration_results.append(("Rate Limiting", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Rate Limiting router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Rate Limiting", f"ERROR: {e}"))
    print(f"[ERROR] Rate Limiting router - Error: {e}")

# Rules Management Router
try:
    from api.rules_management import router as rules_management_router
    app.include_router(rules_management_router, prefix="/api/rules", tags=["Rules Management"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Rules Management", "SUCCESS"))
    print(f"[SUCCESS] Rules Management router registered at /api/rules")
except ImportError as e:
    router_registration_results.append(("Rules Management", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Rules Management router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Rules Management", f"ERROR: {e}"))
    print(f"[ERROR] Rules Management router - Error: {e}")

# Security Simulation Router
try:
    from api.security_simulation import router as security_simulation_router
    app.include_router(security_simulation_router, prefix="/api/security-simulation", tags=["Security Simulation"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Security Simulation", "SUCCESS"))
    print(f"[SUCCESS] Security Simulation router registered at /api/security-simulation")
except ImportError as e:
    router_registration_results.append(("Security Simulation", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Security Simulation router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Security Simulation", f"ERROR: {e}"))
    print(f"[ERROR] Security Simulation router - Error: {e}")

# Security Status Router
try:
    from api.security_status import router as security_status_router
    app.include_router(security_status_router, prefix="/api/security-status", tags=["Security Status"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Security Status", "SUCCESS"))
    print(f"[SUCCESS] Security Status router registered at /api/security-status")
except ImportError as e:
    router_registration_results.append(("Security Status", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Security Status router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Security Status", f"ERROR: {e}"))
    print(f"[ERROR] Security Status router - Error: {e}")

# System Monitoring Router
try:
    from api.system_monitoring import router as system_monitoring_router
    app.include_router(system_monitoring_router, prefix="/api/system-monitoring", tags=["System Monitoring"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("System Monitoring", "SUCCESS"))
    print(f"[SUCCESS] System Monitoring router registered at /api/system-monitoring")
except ImportError as e:
    router_registration_results.append(("System Monitoring", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] System Monitoring router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("System Monitoring", f"ERROR: {e}"))
    print(f"[ERROR] System Monitoring router - Error: {e}")

# Versioning Router
try:
    from api.versioning import router as versioning_router
    app.include_router(versioning_router, prefix="/api/versioning", tags=["Versioning"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("Versioning", "SUCCESS"))
    print(f"[SUCCESS] Versioning router registered at /api/versioning")
except ImportError as e:
    router_registration_results.append(("Versioning", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] Versioning router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("Versioning", f"ERROR: {e}"))
    print(f"[ERROR] Versioning router - Error: {e}")

# WebSocket Router
try:
    from api.websocket import router as websocket_router
    app.include_router(websocket_router, prefix="/api/websocket", tags=["WebSocket"], dependencies=_global_dev_dependencies)
    router_registration_results.append(("WebSocket", "SUCCESS"))
    print(f"[SUCCESS] WebSocket router registered at /api/websocket")
except ImportError as e:
    router_registration_results.append(("WebSocket", f"IMPORT_ERROR: {e}"))
    print(f"[SKIP] WebSocket router - Import error: {e}")
except Exception as e:
    router_registration_results.append(("WebSocket", f"ERROR: {e}"))
    print(f"[ERROR] WebSocket router - Error: {e}")

# Registration Summary
successful_routers = [r for r in router_registration_results if r[1] == "SUCCESS"]
failed_routers = [r for r in router_registration_results if r[1] != "SUCCESS"]

print(f"\nRouter Registration Summary:")
print(f"  Successful: {len(successful_routers)}")
print(f"  Failed: {len(failed_routers)}")

if failed_routers:
    print("\nFailed Routers:")
    for name, error in failed_routers:
        print(f"  - {name}: {error}")

print("Router registration completed.")
