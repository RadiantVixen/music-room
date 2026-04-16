#!/bin/sh

python wait_for_db.py
echo "Applying database migrations..."
python manage.py makemigrations
python manage.py makemigrations api
python manage.py makemigrations events
python manage.py makemigrations delegation
python manage.py migrate

echo "Creating default admin..."
python manage.py create_default_admin

echo "Starting server..."
exec "$@"
