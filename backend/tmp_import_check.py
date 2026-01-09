import importlib, traceback, os, sys

# Ensure the parent directory (workspace root) is on sys.path so 'backend' package
# can be imported when running this script from the 'backend' folder.
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if root not in sys.path:
    sys.path.insert(0, root)

modules = [
    'backend.api.packet_capture',
    'backend.api.marketplace_routes',
    'backend.api.alliance_routes',
    'backend.core.attack_simulation',
]

print('DISABLE_AUTHENTICATION=', __import__('os').environ.get('DISABLE_AUTHENTICATION'))
for m in modules:
    print('\n--- Importing', m, '---')
    try:
        importlib.invalidate_caches()
        importlib.import_module(m)
        print('OK:', m)
    except Exception as e:
        print('EXCEPTION while importing', m)
        traceback.print_exc()
print('\nDone')
