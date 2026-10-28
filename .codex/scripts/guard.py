#!/usr/bin/env python3
"""Conservative changed-file allowlist and classification.
This script is copied from the trusted checkout before Codex runs.
"""
import os, re, subprocess, sys

def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()

files = [x for x in git("diff", "--name-only", "-z", "HEAD").split("\0") if x]
files += [x for x in git("ls-files", "--others", "--exclude-standard", "-z").split("\0") if x]
files = sorted(set(files))
if not files:
    print("No changes"); sys.exit(3)
if len(files) > 12:
    sys.exit("Too many changed files")
approved_prefixes = ("astro-src/", "astro-static/", "source/", "docs/")
approved_exact = {".codex/PROGRESS.md"}
blocked_ext = (".pem", ".key", ".p12", ".env", ".exe", ".sh")
for name in files:
    if name.startswith("/") or ".." in name.split("/") or not (name.startswith(approved_prefixes) or name in approved_exact):
        sys.exit(f"Disallowed path: {name}")
    if name.endswith(blocked_ext) or os.path.islink(name):
        sys.exit(f"Disallowed file type: {name}")
    if not os.path.isfile(name) or os.path.getsize(name) > 250_000:
        sys.exit(f"Deletion or oversized file: {name}")
status = git("diff", "--name-status", "HEAD")
if re.search(r"(?m)^D\s", status):
    sys.exit("Deletions are not allowed")
diffstat = git("diff", "--numstat", "HEAD")
for ln in diffstat.splitlines():
    cols = ln.split("\t")
    if len(cols) >= 2 and (not cols[0].isdigit() or not cols[1].isdigit()):
        sys.exit("Binary change rejected")
    if len(cols) >= 2 and int(cols[0])+int(cols[1]) > 350:
        sys.exit("Change too large")
low_risk = all(name.startswith("docs/") or name == ".codex/PROGRESS.md" for name in files) and any(name.startswith("docs/") for name in files)
with open(os.environ["GITHUB_OUTPUT"], "a") as out:
    out.write(f"low_risk={'true' if low_risk else 'false'}\n")
print("Validated changed files:", ", ".join(files), "; low risk:", low_risk)
