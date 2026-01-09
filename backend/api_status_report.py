#!/usr/bin/env python3
"""
API Status Report
Comprehensive report on all backend APIs and their functionality
"""

import os
import sys
from pathlib import Path

def analyze_api_files():
    """Analyze all API files and their endpoints"""
    
    print("=== AgisFL Backend API Status Report ===")
    print()
    
    api_dir = Path("api")
    if not api_dir.exists():
        print("ERROR: api directory not found")
        return
    
    api_files = list(api_dir.glob("*.py"))
    print(f"Found {len(api_files)} API files:")
    
    for api_file in sorted(api_files):
        if api_file.name == "__init__.py":
            continue
            
        print(f"\n--- {api_file.name} ---")
        
        try:
            with open(api_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Count endpoints
            get_endpoints = content.count("@router.get(")
            post_endpoints = content.count("@router.post(")
            put_endpoints = content.count("@router.put(")
            delete_endpoints = content.count("@router.delete(")
            
            total_endpoints = get_endpoints + post_endpoints + put_endpoints + delete_endpoints
            
            print(f"  Endpoints: {total_endpoints} total")
            print(f"    GET: {get_endpoints}")
            print(f"    POST: {post_endpoints}")
            print(f"    PUT: {put_endpoints}")
            print(f"    DELETE: {delete_endpoints}")
            
            # Check for router definition
            has_router = "router = APIRouter" in content
            print(f"  Router defined: {'Yes' if has_router else 'No'}")
            
            # Check for imports
            has_fastapi = "from fastapi import" in content
            print(f"  FastAPI imports: {'Yes' if has_fastapi else 'No'}")
            
            # File size
            file_size = api_file.stat().st_size
            print(f"  File size: {file_size:,} bytes")
            
        except Exception as e:
            print(f"  ERROR reading file: {e}")
    
    print("\n=== Missing API Files ===")
    
    expected_apis = [
        "realtime.py",
        "privacy.py", 
        "system.py",
        "datasets.py",
        "dashboard.py",
        "monitoring.py",
        "integrations.py",
        "security.py",
        "auth.py",
        "health.py"
    ]
    
    existing_files = [f.name for f in api_files]
    missing_files = [f for f in expected_apis if f not in existing_files]
    
    if missing_files:
        print("Missing files:")
        for missing in missing_files:
            print(f"  - {missing}")
    else:
        print("All expected API files are present!")
    
    print("\n=== Recommendations ===")
    print("1. Ensure all API files have proper router definitions")
    print("2. Register all routers in main.py")
    print("3. Test all endpoints for functionality")
    print("4. Add proper error handling and validation")
    print("5. Implement authentication where needed")

def check_main_py():
    """Check main.py for router registrations"""
    
    print("\n=== Main.py Router Registration Analysis ===")
    
    main_file = Path("main.py")
    if not main_file.exists():
        print("ERROR: main.py not found")
        return
    
    try:
        with open(main_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count router registrations
        include_router_count = content.count("app.include_router")
        print(f"Router registrations found: {include_router_count}")
        
        # Check for specific routers
        routers_to_check = [
            "dashboard_router",
            "monitoring_router", 
            "integrations_router",
            "security_router",
            "realtime_router",
            "privacy_router",
            "system_router"
        ]
        
        print("\nRouter registration status:")
        for router in routers_to_check:
            is_registered = router in content
            status = "Registered" if is_registered else "Missing"
            print(f"  {router}: {status}")
            
    except Exception as e:
        print(f"ERROR reading main.py: {e}")

def generate_fix_recommendations():
    """Generate specific fix recommendations"""
    
    print("\n=== Fix Recommendations ===")
    
    fixes = [
        "1. Create missing API files (realtime.py, privacy.py, system.py)",
        "2. Add missing endpoints to existing API files",
        "3. Register all routers in main.py with proper prefixes",
        "4. Fix Unicode encoding issues in print statements",
        "5. Add proper error handling to all endpoints",
        "6. Implement request/response validation",
        "7. Add authentication middleware where needed",
        "8. Test all endpoints with proper test cases",
        "9. Add API documentation and examples",
        "10. Implement rate limiting and security measures"
    ]
    
    for fix in fixes:
        print(f"  {fix}")

def main():
    """Main function"""
    analyze_api_files()
    check_main_py()
    generate_fix_recommendations()
    
    print("\n=== Summary ===")
    print("Your backend has a comprehensive API structure but needs:")
    print("- Missing API files created")
    print("- Router registration fixes")
    print("- Unicode encoding fixes")
    print("- Comprehensive testing")
    print("\nAll these issues can be resolved to make your APIs fully functional.")

if __name__ == "__main__":
    main()