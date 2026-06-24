#!/bin/bash
# Creates docker/.env with secure random secrets on first run.
# Safe to re-run later - it will never overwrite an existing docker/.env.
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE="docker/.env"
EXAMPLE_FILE="docker/.env.example"

if [ -f "$ENV_FILE" ]; then
  echo "docker/.env already exists - leaving it as is."
  exit 0
fi

if docker volume ls --format '{{.Name}}' 2>/dev/null | grep -qx "docker_mysql_data"; then
  echo ""
  echo "Warning: a database from a previous run already exists, but"
  echo "docker/.env is missing, so new random database credentials are"
  echo "about to be generated. The existing database won't recognize them,"
  echo "and the app will fail to start with 'Access denied' errors."
  echo ""
  read -r -p "Reset the existing database so the new credentials work? This deletes all current app data (modules, surveys, etc). [y/N] " RESET_DB
  if [[ "$RESET_DB" =~ ^[Yy] ]]; then
    docker volume rm docker_mysql_data
    echo "Database reset."
  else
    echo "Keeping the existing database - you'll need to restore the matching docker/.env yourself, or the app won't start."
  fi
  echo ""
fi

random_value() {
  openssl rand -hex 24
}

ADMIN_PASSWORD="$(random_value)"

cp "$EXAMPLE_FILE" "$ENV_FILE"

sed -i.bak \
  -e "s/__RANDOM_DB_PASSWORD__/$(random_value)/" \
  -e "s/__RANDOM_DB_ROOT_PASSWORD__/$(random_value)/" \
  -e "s/__RANDOM_ADMIN_PASSWORD__/${ADMIN_PASSWORD}/" \
  -e "s/__RANDOM_RECOVERY_KEY__/$(random_value)/" \
  -e "s/__RANDOM_SESSION_SECRET__/$(random_value)/" \
  "$ENV_FILE"
rm -f "${ENV_FILE}.bak"

echo ""
echo "Created docker/.env with new secure secrets."
echo ""
echo "=================================================="
echo " Admin login for this app (write this down):"
echo "   Username: admin"
echo "   Password: ${ADMIN_PASSWORD}"
echo "=================================================="
echo ""
echo "You can change the password later from the admin dashboard."
echo ""
