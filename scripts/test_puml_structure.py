import glob, re, os

def test_file(p):
    with open(p, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    print(f"File: {os.path.basename(p)} ({len(lines)} lines)")

for f in sorted(glob.glob('docs/sequence-diagrams/01-guest/**/*.puml', recursive=True)):
    test_file(f)
