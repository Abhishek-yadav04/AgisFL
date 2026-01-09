import urllib.request, json, sys
urls = [
 'http://127.0.0.1:8000/api/packet-capture/status',
 'http://127.0.0.1:8000/api/packet-capture/interfaces',
 'http://127.0.0.1:8000/api/marketplace/status',
 'http://127.0.0.1:8000/api/alliance/status',
 'http://127.0.0.1:8000/api/security/overview'
]
for u in urls:
    print('\n---', u, '---')
    try:
        with urllib.request.urlopen(u, timeout=5) as resp:
            code = resp.getcode()
            data = resp.read().decode('utf-8')
            print('HTTP', code)
            try:
                obj = json.loads(data)
                print(json.dumps(obj, indent=2)[:2000])
            except Exception as e:
                print('Non-JSON response or parse error:', e)
                print(data[:2000])
    except Exception as e:
        print('ERROR:', repr(e))
