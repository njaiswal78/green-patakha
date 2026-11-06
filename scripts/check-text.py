#!/usr/bin/env python3
"""Fail if any source file is not valid UTF-8 or holds stray control characters."""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXTS = {".ts", ".js", ".css", ".html", ".svg", ".md", ".json", ".jsonc", ".sql", ".txt", ".yml", ".py"}
SKIP = {"node_modules", ".wrangler", ".git", "sound-src", "data"}

bad = 0
for p in ROOT.rglob("*"):
    if p.is_dir() or p.suffix not in EXTS or any(s in p.parts for s in SKIP):
        continue
    raw = p.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as e:
        print(f"{p.relative_to(ROOT)}: not UTF-8 ({e})")
        bad += 1
        continue
    for n, line in enumerate(text.splitlines(), 1):
        if any(ord(c) < 32 and c not in "\t\r" for c in line):
            print(f"{p.relative_to(ROOT)}:{n}: control character")
            bad += 1
            break
print("ok" if not bad else f"{bad} file(s) need fixing")
sys.exit(1 if bad else 0)
