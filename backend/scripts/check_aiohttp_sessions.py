"""Scan the repository for aiohttp.ClientSession uses and flag potentially long-lived creations.

Heuristic rules:
- Report any line that contains 'aiohttp.ClientSession' excluding files under virtualenv directories.
- If the pattern appears inside an 'async with' statement (same line or preceding few characters), mark as context-managed (likely safe).
- If the pattern is assigned to a variable ("= aiohttp.ClientSession("), mark as potentially long-lived and recommend adding explicit close/stop.

Run from project root: python backend/scripts/check_aiohttp_sessions.py
"""
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
EXCLUDE_DIRS = {'agisfl_env', '.venv', 'venv', '__pycache__', 'node_modules', '.git'}
PATTERN = re.compile(r"aiohttp\.ClientSession\s*\(")
ASSIGN_PATTERN = re.compile(r"=\s*aiohttp\.ClientSession\s*\(")
ASYNC_WITH_PATTERN = re.compile(r"async\s+with\s+aiohttp\.ClientSession")

results = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    parts = set(dirpath.replace(ROOT, '').split(os.sep))
    if parts & EXCLUDE_DIRS:
        continue
    for fname in filenames:
        if not fname.endswith('.py'):
            continue
        fpath = os.path.join(dirpath, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except Exception:
            continue
        for i, line in enumerate(lines):
            if 'aiohttp.ClientSession' in line:
                context = ''.join(lines[max(0, i-3):i+3])
                is_async_with = bool(ASYNC_WITH_PATTERN.search(line) or ASYNC_WITH_PATTERN.search(context))
                is_assignment = bool(ASSIGN_PATTERN.search(line))
                results.append({
                    'file': os.path.relpath(fpath, ROOT),
                    'line_no': i+1,
                    'line': line.strip(),
                    'async_with': is_async_with,
                    'assignment': is_assignment,
                })

if not results:
    print('No aiohttp.ClientSession occurrences found in project python files (excluding venvs).')
else:
    print('Found aiohttp.ClientSession usages (heuristic):\n')
    for r in results:
        status = 'context-managed' if r['async_with'] else ('assigned (potentially long-lived)' if r['assignment'] else 'plain usage')
        print(f"{r['file']}:{r['line_no']}: {status}")
        print(f"    {r['line']}")
        print()

    print('Notes:')
    print('- "assigned (potentially long-lived)" indicates the code calls ClientSession() and assigns it to a variable. Ensure there is an explicit close() or stop lifecycle hook that awaits session.close().')
    print('- "context-managed" entries use "async with aiohttp.ClientSession() as session" which is usually safe.')
    print('- This is a heuristic scanner; manually inspect flagged files.')
