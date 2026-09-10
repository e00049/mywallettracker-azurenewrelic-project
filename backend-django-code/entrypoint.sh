#!/bin/sh
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

if [ -n "$NEW_RELIC_LICENSE_KEY" ]; then
    echo "New Relic license key found — starting with APM agent."
    exec newrelic-admin run-program "$@"
else
    echo "No New Relic license key — starting without APM."
    exec "$@"
fi
