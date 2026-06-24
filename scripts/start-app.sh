#!/bin/bash
# Sets up docker/.env if needed, then asks whether to expose the app to the
# internet via a free Cloudflare Quick Tunnel before starting everything.
set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/setup-env.sh

echo ""
echo "Make this app accessible from other devices over the internet?"
echo "This uses a free Cloudflare Quick Tunnel - no account or domain needed."
echo "The link changes every time you start the app, and it's meant for"
echo "letting someone else try the app remotely, not permanent hosting."
echo ""
read -r -p "Enable remote access for this session? [y/N] " ENABLE_TUNNEL

cd docker

if [[ "$ENABLE_TUNNEL" =~ ^[Yy] ]]; then
  # Started detached (-d) so we can read the generated URL from its logs.
  # Trap ensures everything still stops when you close this window, since
  # detached containers would otherwise keep running in the background.
  trap 'echo ""; echo "Stopping the app..."; docker compose --profile tunnel down' EXIT
  docker compose --profile tunnel up --build -d

  echo ""
  echo "Waiting for your public link..."
  PUBLIC_URL=""
  for _ in $(seq 1 30); do
    PUBLIC_URL="$(docker compose logs cloudflared 2>/dev/null \
      | grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' | tail -1 || true)"
    if [ -n "$PUBLIC_URL" ]; then
      break
    fi
    sleep 1
  done

  echo ""
  echo "=================================================="
  if [ -n "$PUBLIC_URL" ]; then
    echo " Share this link so others can access the app:"
    echo "   $PUBLIC_URL"
    echo ""
    echo " This link stops working once you close this window."
  else
    echo " Couldn't detect the public link yet. Check it with:"
    echo "   cd docker && docker compose logs cloudflared"
  fi
  echo "=================================================="
  echo ""
  echo "Press Ctrl+C to stop the app."
  docker compose logs -f
else
  docker compose up --build
fi
