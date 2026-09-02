🎵 Music Room — Real-Time Collaborative Music Platform
--Image of: --License: MIT --Image of: --Django --Image of: --React Native --Image of: --Docker --Image of: --WebSockets

Music Room is a production-grade, real-time collaborative music ecosystem designed for live group voting, shared playlist curation, and seamless device playback control. Built with a dual-service architecture featuring a robust Django REST Framework backend and a reactive React Native / Expo mobile frontend, the platform scales efficiently to thousands of concurrent users utilizing low-overhead atomic state mutation strategies.

🌟 Visual Feature Spotlights
1. Dynamic Live Event Track Voting
Designed for real-time environments (like parties or festivals), users suggest songs and vote on them in real-time. The server dynamically ranks track queues utilizing SQL database Window functions without heavy table-locking overhead.

--Image of: --Dynamic Track Voting and Real-time RowNumber Ranking

Concurrency Gated: Avoids standard row locks via Django F() atomic database-level increments.
Dynamic Order Calculation: Uses SQL RowNumber() window computations on query execution to dynamically rank tracks with deterministic tie-breaking.
2. Multi-User Playlist Reordering (Sentinel Pattern)
Collaborative playlists allow multiple authorized editors to drag and drop tracks simultaneously. Traditional indexing causes cascade write collisions; Music Room resolves this using an optimized Sentinel Position Pattern coupled with optimistic client rendering.

--Image of: --Sentinel Position Playlist Sync and Version Consistency

Sentinel Reordering: Calculates position indices as floats ((Position_Above + Position_Below) / 2). Eliminates indices cascades, preserving a single database-row update.
Version Coherence: Tracked via a synchronized PlaylistVersion counter that acts as an optimistic lock, alerting connected users of real-time bulk shifts.
3. Secure Device Playback Delegation
Grants owners the ability to delegate playback actions (Play, Pause, Skip) of registered physical devices to friends securely. Action updates propagate instantly through WebSockets utilizing Redis as a fast in-memory message broker.

--Image of: --Secure Device Delegation and Idempotent Playback Controls

Idempotency Keys: Network-resilient commands use action_id validations to prevent duplicated skip/pause actions in flaky mobile environments.
Token-Verified Channels: WebSockets are gated by custom JWTAuthMiddleware passing JWTs in URL query strings.
🛠 System Architecture & Data Flow
Music Room divides responsibilities between structured, rate-limited RESTful API endpoints and real-time WebSocket channels managed via ASGI Daphne servers.

flowchart TD
    %% Clients
    subgraph MobileClient [Expo Mobile Client]
        UI[React Native View]
        Zustand[Zustand Store]
        Audio[Expo-AV Player]
        Cache[Local FS Cache]
    end

    %% Web Gateways
    subgraph Gateways [Inbound Traffic]
        Nginx[Nginx Reverse Proxy]
    end

    %% Django Services
    subgraph DjangoWS [ASGI Daphne Server]
        Channels[Django Channels]
        JWTAuth[JWTAuthMiddleware]
    end

    subgraph DjangoREST [WSGI Gunicorn Server]
        DRF[Django REST Framework]
        Throttles[DRF Throttles]
        GeoCheck[Geo-fence Engine]
    end

    %% Databases
    subgraph Database [Storage & Messaging]
        PostgreSQL[(PostgreSQL 15)]
        Redis[(Redis Channel Layer)]
    end

    %% Connections
    UI -->|1. REST Request| Nginx
    UI -->|2. Persistent WS Connect| DjangoWS

    Nginx -->|Route HTTP| DjangoREST
    DjangoREST -->|Throttle & Auth Checks| DRF
    DRF -->|Read/Write State| PostgreSQL

    DjangoWS -->|Validate Token| JWTAuth
    JWTAuth -->|Register Socket| Channels
    Channels -->|Join Room Group| Redis

    %% Real-time updates
    PostgreSQL -->|Signal Trigger| DjangoREST
    DjangoREST -->|3. Publish Event| Redis
    Redis -->|4. Push Broadcast| Channels
    Channels -->|5. Push Frame| UI

    %% State sync
    Zustand --> UI
    Audio --> UI
    Cache --> Zustand
💎 Premium Features Showcase
Implementing a native SDK and customized API hooks, Music Room offers high-end performance upgrades for premium tier users:

Global Background Playback (expo-av & Zustand)
A persistent, interactive MiniPlayer floating overlay stays active across all screens.
Unified playback queues are controlled from a single custom React hook (useAudioPlayer.ts) synced directly to a central Zustand storage store.
Robust Offline Mode (expo-file-system)
Playlists are cached locally using AsyncStorage and synced immediately on network re-entry.
High-fidelity tracks are downloaded into phone local storage in the background, allowing offline listening with custom play paths.
Advanced Geofenced Licenses
Location-based rooms verify proximity utilizing Haversine formulas. Mutation REST requests (adding, voting) require coordinate inputs to verify users are inside the live boundary, while WebSocket reading connections remain open-ended.
⚙️ Quick Start (Dockerized Development)
Launch the entire containerized architecture in less than two minutes.

1. Prerequisites
Install Docker and Docker Compose.

2. Environment Configurations
Create a .env file in the root directory:

POSTGRES_PASSWORD=your_secure_db_pass
DJANGO_SECRET_KEY=your_django_secret_key
EMAIL_HOST_USER=resets@musicroom.com
EMAIL_HOST_PASSWORD=smtp_password
REDIS_HOST=redis
REDIS_PORT=6379
3. Boot Up Services
docker compose up -d --build
This launches:

auth-service: The Django ASGI application running via Daphne (http://localhost:8000)
auth-postgres: Postgres 15 database instance with persistent volumes
redis: High-speed message broker for Django Channels & global rate limiting
4. Interactive Documentation
Access the auto-generated interactive Swagger specifications:

Swagger UI: http://localhost:8000/api/schema/swagger-ui/
Redoc: http://localhost:8000/api/schema/redoc/
🧪 Testing Suite
The repository includes a comprehensive testing block featuring 57+ tests validating race conditions, license calculations, and concurrency anomalies under stress.

# Execute the suite inside the active container
docker compose exec auth-service python manage.py test
Key Test Matrix
Multi-Threaded Concurrency Testing: Spawns multiple parallel test threads simulating users voting and reordering playlists simultaneously to guarantee no deadlocks or index duplicates.
Coordinate Haversine Testing: Mocks geographic coordinate distances to verify correct behavior of location-based gating on REST API endpoints.
Idempotency Assertions: Verifies action_id reuse triggers correct rejection with no double-state execution.
📚 REST API Reference Quick-View
The complete specification is detailed in API_SCHEMAS.md. Below are the primary interaction endpoints:

Endpoint	Method	Auth	Description	Key Payload / Headers
/api/signup/	POST	Public	Register user & auto-generate profiles.	{email, full_name, password}
/api/token/	POST	Public	Authenticate user & get JWT tokens (RS256).	{email, password}
/api/rooms/	POST	Bearer	Create room (vote or delegation).	{name, room_type, license_type}
/api/events/<id>/tracks/	POST	Bearer	Suggest a track to a live voting queue.	{deezerId, title, artist}
/api/events/<id>/tracks/<tid>/vote/	POST	Bearer	Cast vote for a track (atomically increments).	Optional {lat, lon}
/api/delegation/<id>/devices/	POST	Bearer	Register playback speaker device.	{device_identifier, device_name}
/api/delegation/<id>/devices/<did>/delegate/	POST	Bearer	Delegate device control to a verified friend.	{friend_id}
📜 License
Distributed under the MIT License. See LICENSE for more information.
