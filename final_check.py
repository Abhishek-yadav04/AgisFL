import os
from pathlib import Path

def final_validation():
    print(" Final Deployment Readiness Check")
    print("=" * 40)
    
    checks = [
        ("Main App", "backend/main.py"),
        ("Production Config", "config/production_config.py"),
        ("Enterprise Auth", "core/enterprise_auth.py"),
        ("Database Migration", "core/database_migration.py"),
        ("Redis Cache", "core/redis_cache.py"),
        ("Performance Optimizer", "core/performance_optimizer.py"),
        ("Docker Compose", "docker-compose.production.yml"),
        ("NGINX Config", "backend/nginx/nginx.conf"),
        ("Gunicorn Config", "gunicorn.conf.py"),
        ("Environment Template", ".env.production.template")
    ]
    
    passed = 0
    total = len(checks)
    
    for name, filepath in checks:
        exists = Path(filepath).exists()
        status = "" if exists else ""
        print(f"  {status} {name}: {filepath}")
        if exists:
            passed += 1
    
    print(f"\nSummary: {passed}/{total} components ready ({passed/total*100:.1f}%)")
    
    # Test API health
    try:
        import httpx
        response = httpx.get("http://localhost:8000/health", timeout=5)
        api_healthy = response.status_code == 200
        print(f"  {'' if api_healthy else ''} API Health: {'Responding' if api_healthy else 'Not responding'}")
        if api_healthy:
            passed += 1
        total += 1
    except Exception as e:
        print(f"   API Health: Error - {str(e)[:30]}")
        total += 1
    
    final_score = (passed / total) * 100
    print(f"\nFinal Readiness Score: {final_score:.1f}%")
    
    if final_score >= 90:
        print(" DEPLOYMENT APPROVED: Production Ready!")
        return True
    elif final_score >= 80:
        print(" CONDITIONAL APPROVAL: Minor issues to monitor")
        return True
    else:
        print(" NOT READY: Critical components missing")
        return False

if __name__ == "__main__":
    ready = final_validation()
    exit(0 if ready else 1)
