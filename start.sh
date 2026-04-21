#!/usr/bin/env bash
set -e

# Usage: ./start.sh backend   # starts Django backend
#        ./start.sh frontend # starts Expo frontend (web)

case "$1" in
  backend)
    # Prefer Docker Compose (Makefile) if Docker is available for a smoother run.
    if command -v docker >/dev/null 2>&1; then
      echo "Docker found; starting backend with Makefile (docker-compose)..."
      cd backend
      make up
    else
      echo "Docker not found; falling back to local virtualenv run"
      if [ ! -d ".venv" ]; then
        python3 -m venv .venv
        . .venv/bin/activate
        pip install --upgrade pip
        pip install -r backend/requirements.txt
      else
        . .venv/bin/activate
      fi
      cd backend
      python manage.py migrate
      python manage.py runserver 0.0.0.0:8000
    fi
    ;;
  frontend)
    cd frontend
    npm install
      # If adb is available, try to run on the Android emulator.
      if command -v adb >/dev/null 2>&1; then
        echo "adb found; attempting to run on Android emulator..."
        npm run android
      else
        # Check for common SDK locations; if present but adb missing, inform the user.
        if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ] || [ -d "$HOME/Android/Sdk" ]; then
          echo "Android SDK detected but 'adb' is not in PATH."
          echo "Make sure platform-tools are installed and that \$ANDROID_HOME/platform-tools is in your PATH."
          echo "Falling back to Expo web."
          npm run web
        else
          echo "Android SDK not found. Falling back to Expo web."
          echo "To enable emulator support, install Android Studio or Android SDK platform-tools and set environment variables like:"
          echo "  export ANDROID_HOME=\$HOME/Android/Sdk"
          echo "  export ANDROID_SDK_ROOT=\$HOME/Android/Sdk"
          echo "  export PATH=\$PATH:\$ANDROID_HOME/emulator:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/tools/bin"
          echo "Then re-open your terminal and run this script again."
          npm run web
        fi
      fi
    ;;
  *)
    echo "Usage: $0 {backend|frontend}"
    exit 1
    ;;
esac
