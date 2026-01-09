"""
Inspect registered FastAPI app routes and print their path, methods, and name.
"""
import sys
import os
# make sure repo root is importable
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

try:
    from backend.main import app
except Exception as e:
    print(f"ERROR importing backend.main.app: {e}")
    sys.exit(1)

routes = []
for r in app.routes:
    p = getattr(r, 'path', None)
    if not p:
        continue
    methods = getattr(r, 'methods', None)
    name = getattr(r, 'name', '')
    routes.append((p, methods, name))

routes.sort()
for p, methods, name in routes:
    print(p, methods, name)

# quick check
target = '/api/dashboard/datasets'
print('\n--- Quick check for target path ---')
found = any(p == target for p, _, _ in routes)
print(f"{target} registered? {found}")

if not found:
    # also check with and without trailing slash
    found2 = any(p.rstrip('/') == target.rstrip('/') for p, _, _ in routes)
    print(f"match ignoring trailing slash? {found2}")

sys.exit(0)
