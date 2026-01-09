# Add router registration to main.py
router_code = '''
# Router Registration
print("Registering API routers...")

try:
    from api.dashboard import router as dashboard_router
    app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
    print("[SUCCESS] Dashboard router registered")
except Exception as e:
    print(f"[SKIP] Dashboard router: {e}")

try:
    from api.monitoring import router as monitoring_router
    app.include_router(monitoring_router, prefix="/api/monitoring", tags=["Monitoring"])
    print("[SUCCESS] Monitoring router registered")
except Exception as e:
    print(f"[SKIP] Monitoring router: {e}")

try:
    from api.integrations import router as integrations_router
    app.include_router(integrations_router, prefix="/api/integrations", tags=["Integrations"])
    print("[SUCCESS] Integrations router registered")
except Exception as e:
    print(f"[SKIP] Integrations router: {e}")

try:
    from api.security import router as security_router
    app.include_router(security_router, prefix="/api/security", tags=["Security"])
    print("[SUCCESS] Security router registered")
except Exception as e:
    print(f"[SKIP] Security router: {e}")

try:
    from api.realtime import router as realtime_router
    app.include_router(realtime_router, prefix="/api/realtime", tags=["Real-time"])
    print("[SUCCESS] Real-time router registered")
except Exception as e:
    print(f"[SKIP] Real-time router: {e}")

try:
    from api.privacy import router as privacy_router
    app.include_router(privacy_router, prefix="/api/privacy", tags=["Privacy"])
    print("[SUCCESS] Privacy router registered")
except Exception as e:
    print(f"[SKIP] Privacy router: {e}")

try:
    from api.system import router as system_router
    app.include_router(system_router, prefix="/api/system", tags=["System"])
    print("[SUCCESS] System router registered")
except Exception as e:
    print(f"[SKIP] System router: {e}")

print("Router registration completed.")
'''

# Append to main.py
with open("main.py", "a", encoding="utf-8") as f:
    f.write(router_code)

print("Router registration code added to main.py")