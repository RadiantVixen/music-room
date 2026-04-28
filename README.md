# 🎵 Music Room - Backend Services

Welcome to the **Music Room** backend. This is a high-performance, real-time Django-based system designed to power collaborative music experiences. It leverages **PostgreSQL** for strict data integrity, **Redis** for real-time messaging, and **Django Channels** for persistent WebSocket connections.

---

## 🚀 Quick Start (Dockerized)

The entire environment is containerized for consistent development and deployment.

### 1. Environment Setup
Ensure you have a `.env` file in the root directory with the following variables:
- `POSTGRES_PASSWORD`
- `DJANGO_SECRET_KEY`
- `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` (for password resets)
Optional but recommended for shared rate limiting:
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`

### 2. Launch Services
```bash
docker compose up -d --build
```
This will start:
- **`auth-service`**: Django application (Daphne/ASGI)
- **`auth-postgres`**: PostgreSQL 15 database
- **`redis`**: Real-time channel layer

### 3. Application Access
- **REST API**: `http://localhost:8000/api/`
- **WebSockets**: `ws://localhost:8000/ws/`
- **Interactive Documentation**: `http://localhost:8000/api/schema/swagger-ui/`

---

## 🛠 Core Services Architecture

The backend is split into specialized modules, each handling a distinct collaborative feature.

### 1. Events (Track Voting)
Designed for live events where users suggest and vote on music.
- **Concurrency**: Uses atomic `F()` increments to handle thousands of concurrent votes without row-locking bottlenecks.
- **Ranking**: Real-time deterministic ranking using database Window functions (SQL `RowNumber()`).
- **Idempotency**: Prevents double-voting via database-level unique constraints.
- **Premium**: Creating tracks and voting are premium-only (read access remains available).

### 2. Playlists (Collaborative Editing)
A real-time shared playlist editor with strict ordering.
- **Consistency**: Implements a `PlaylistVersion` counter to handle race conditions during bulk shifts or moves.
- **Move Logic**: Uses a sophisticated sentinel-position pattern to prevent unique constraint collisions during track reordering.

### 3. Delegation (Device Control)
Allows users to securely "delegate" control of their physical music devices to friends.
- **Security**: Strict checking ensures only owners can delegate or revoke control.
- **Idempotency**: Uses `action_id` keys to ensure playback actions (like Skip/Pause) are never executed twice due to network retries.

### 4. WebSocket Layer
Provides high-speed updates for all services.
- **Auth**: Custom `JWTAuthMiddleware` validates access tokens passed in the query string (`?token=...`).
- **Geo-fencing**: Enforced at the REST layer for mutations, ensuring long-lived WebSocket read sessions remain efficient.

### 5. Rate Limiting
All REST endpoints are protected by DRF throttles (per-user and per-IP). Auth endpoints (login/register/password reset) have tighter limits. For consistent throttling across multiple workers, configure Redis caching via `REDIS_HOST` / `REDIS_PORT`.

---

## 🧪 Testing Guide

We maintain a suite of **57+ tests** covering happy paths, edge cases, and high-concurrency race conditions.

### Run All Tests (Inside Docker)
```bash
docker compose exec auth-service python manage.py test
```

### Key Test Categories:
- **Concurrency Tests**: Simulation of multiple users voting/moving tracks simultaneously via threading to ensure no data corruption.
- **License/Geo Tests**: Validation of coordinate-based access control.
- **Integrity Tests**: Ensures unique constraints and foreign keys behave correctly under load.

---

## 📚 Technical Documentation

- **API Reference**: Detailed endpoint-by-endpoint schema is available in `API_SCHEMAS.md`.
- **Architecture Logs**: Admin logs can be monitored at `/api/admin/logs/` (Staff only).

---

> [!IMPORTANT]
> **Production Note**: Always ensure `DEBUG=False` in production and use a proper WSGI/ASGI server setup (Daphne is provided in the Dockerfile). Connection pooling (like PgBouncer) is recommended for extreme high-load scenarios targeting the Voting service.
