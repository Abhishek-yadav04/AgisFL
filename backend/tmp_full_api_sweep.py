import urllib.request, urllib.error, json, sys, re, time

BASE = 'http://127.0.0.1:8000'

def safe_path(path):
    # replace path params {id} with sample values
    def repl(m):
        name = m.group(1)
        # choose sample value heuristically
        if 'id' in name or 'number' in name or 'count' in name or 'round' in name:
            return '1'
        if 'path' in name:
            return 'sample/path'
        return 'test'
    return re.sub(r"\{([^}]+)\}", repl, path)

results = []

print('Fetching OpenAPI from', BASE + '/openapi.json')
try:
    with urllib.request.urlopen(BASE + '/openapi.json', timeout=5) as resp:
        spec = json.loads(resp.read().decode('utf-8'))
except Exception as e:
    print('Failed to fetch openapi.json:', e)
    sys.exit(1)

paths = spec.get('paths', {})
print('Found', len(paths), 'paths in OpenAPI spec')

for path, methods in paths.items():
    url_path = safe_path(path)
    full = BASE + url_path
    for method in methods.keys():
        if method.lower() not in ('get','post','put','delete','patch','options','head'):
            continue
        attempt_method = method.upper()
        print('\n--', attempt_method, full)
        try:
            req = urllib.request.Request(full, method=attempt_method)
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.getcode()
                # attempt to parse JSON (silently)
                body = resp.read().decode('utf-8', errors='ignore')
                ct = resp.headers.get('Content-Type','')
                is_json = 'application/json' in ct or body.strip().startswith('{') or body.strip().startswith('[')
                if is_json:
                    try:
                        parsed = json.loads(body)
                        snippet = json.dumps(parsed)[:1000]
                    except Exception:
                        snippet = body[:1000]
                else:
                    snippet = body[:1000]
                print('HTTP', status, 'len', len(body))
                results.append((attempt_method, path, full, status, snippet))
        except urllib.error.HTTPError as e:
            print('HTTPError', e.code, hasattr(e, 'reason') and e.reason)
            try:
                body = e.read().decode('utf-8', errors='ignore')
            except Exception:
                body = ''
            results.append((attempt_method, path, full, e.code, body[:1000]))
        except Exception as e:
            print('Request failed:', repr(e))
            results.append((attempt_method, path, full, 'ERR', repr(e)))
        time.sleep(0.05)

# Summarize
summary = {}
for r in results:
    code = r[3]
    summary.setdefault(str(code), 0)
    summary[str(code)] += 1

print('\nSummary:')
for k in sorted(summary.keys()):
    print(k, summary[k])

# Save detailed results
with open('api_sweep_results.json','w', encoding='utf-8') as f:
    json.dump([{
        'method': r[0], 'path': r[1], 'url': r[2], 'status': r[3], 'snippet': r[4]
    } for r in results], f, indent=2)

print('\nDetailed results written to api_sweep_results.json')
