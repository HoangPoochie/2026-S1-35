#!/bin/bash
# Double-click this file in Finder to stop the app.
cd "$(dirname "$0")/docker"

echo "Stopping the app..."
docker compose --profile tunnel down
