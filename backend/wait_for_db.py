import os
import time
import psycopg2

while True:
    try:
        psycopg2.connect(
            dbname=os.getenv("POSTGRES_DB", "postgres"),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host=os.getenv("POSTGRES_HOST", "auth-postgres"),
            port=os.getenv("POSTGRES_PORT", "5432"),
        )
        print("✅ Database ready")
        break
    except psycopg2.OperationalError:
        print("⏳ Waiting for database...")
        time.sleep(2)

