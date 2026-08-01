#!/bin/sh
# Sandbox revive hook: bring the dev server back after hibernate. Irrelevant on
# a dev laptop.
set -eu
cd /workspace
# The port is resolved and remembered by scripts/dev-port.mjs, so probe the one
# we actually used rather than a hardcoded 8080.
URL=$(node scripts/dev-port.mjs --peek --url)
if curl -sf -o /dev/null --max-time 2 "$URL"; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
