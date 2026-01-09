"""
Audit backend FastAPI routes vs frontend API usages.
Outputs JSON to stdout and prints a human summary.
"""
import re
import os
import json
import sys

# ensure repo root is on sys.path so `backend` package can be imported when running this script
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

# load app routes
try:
    from backend.main import app
except Exception as e:
    print(json.dumps({"error": f"Failed importing backend.main.app: {e}"}))
    sys.exit(1)

routes = set()
for r in app.routes:
    # r.path may be like '/api/datasets/{dataset_id}'
    p = getattr(r, 'path', None)
    if not p:
        continue
    # normalize: remove duplicate slashes
    p = re.sub(r'//+', '/', p)
    # remove trailing slash except root
    if len(p) > 1 and p.endswith('/'):
        p = p[:-1]
    routes.add(p)

# scan frontend files
frontend_dirs = [
    os.path.join(os.getcwd(), 'frontend', 'src'),
]
api_usage = set()
# Match only likely path characters to avoid grabbing trailing punctuation from generated JS
pattern = re.compile(r"(?:https?://[\w\-\.:0-9]+)?(/api[0-9A-Za-z_\-\/.\{\}\:\$]*)")
for base in frontend_dirs:
    if not os.path.isdir(base):
        continue
    for root, _, files in os.walk(base):
        for fn in files:
            if not fn.endswith(('.ts', '.tsx', '.js', '.jsx', '.map')):
                continue
            path = os.path.join(root, fn)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    txt = f.read()
            except Exception:
                continue
            for m in pattern.findall(txt):
                s = m.split('?')[0]
                # remove any template interpolation remnants like ${var} or ${queryString
                s = re.sub(r"\$\{[^}]*\}", "", s)
                # remove any trailing punctuation left by minified code (backticks, commas, braces)
                s = re.sub(r"[\"'`,;\)\]\}]+$", "", s)
                # replace multiple slashes
                s = re.sub(r'//+', '/', s)
                # normalize trailing slash
                if len(s) > 1 and s.endswith('/'):
                    s = s[:-1]
                api_usage.add(s)

# helper to convert registered route to regex
def route_to_regex(r):
    # escape slashes and dots
    esc = re.escape(r)
    # replace escaped {var} with regex
    esc = re.sub(r'\\\{[^}]+\\\}', r'[^/]+', esc)
    # allow optional trailing slash
    return r'^' + esc + r'$'

route_regexes = [(r, re.compile(route_to_regex(r))) for r in routes]

matched = set()
frontend_orphans = []
for u in sorted(api_usage):
    found = False
    for r, rx in route_regexes:
        if rx.match(u):
            matched.add(u)
            found = True
            break
    if not found:
        # also try matching by prefix (for endpoints like /api/metrics/custom vs /api/metrics/custom)
        frontend_orphans.append(u)

backend_unreferenced = sorted([r for r in routes if not any(re.compile(route_to_regex(r)).match(u) for u in api_usage)])

report = {
    'backend_routes_count': len(routes),
    'frontend_api_usages_count': len(api_usage),
    'matched_usages_count': len(matched),
    'frontend_orphans_count': len(frontend_orphans),
    'frontend_orphans': frontend_orphans[:200],
    'backend_unreferenced_count': len(backend_unreferenced),
    'backend_unreferenced_sample': backend_unreferenced[:200],
}

print(json.dumps(report, indent=2))

# human summary
print('\n=== Summary ===')
print(f"Backend routes discovered: {len(routes)}")
print(f"Frontend API usages discovered: {len(api_usage)}")
print(f"Matched usages: {len(matched)}")
print(f"Frontend calls without a matching backend route: {len(frontend_orphans)}")
if frontend_orphans:
    print('\nFirst 25 frontend orphan endpoints:')
    for e in frontend_orphans[:25]:
        print(' -', e)
print('\nSample backend routes not referenced by frontend (first 25):')
for e in backend_unreferenced[:25]:
    print(' -', e)

# exit code: non-zero if orphans exist
if len(frontend_orphans) > 0:
    sys.exit(2)
else:
    sys.exit(0)
