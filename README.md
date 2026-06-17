# DnD BattleBoard

A virtual tabletop for playing D&D online with friends. Real-time canvas-based battleboard with fog of war, token management, dice rolling, and a map editor.

**Live:** http://46.62.202.122

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3, Java 21, Spring Security (JWT), Spring WebSocket (STOMP/SockJS) |
| Database | PostgreSQL |
| Frontend | React + TypeScript + Vite |
| Deployment | Hetzner VPS, Nginx reverse proxy, systemd service |

The frontend is bundled into the Spring Boot JAR as static resources — a single deployable artifact.

---

## Features

### Game Session
- Create sessions with an 8-character invite code for players to join
- DM vs Player role system — DM is the session host, players have restricted controls
- Session active/inactive toggle — DM can lock a session to prevent new joins

### Battleboard (Canvas)
- Drag and drop tokens on a grid-based map
- DM can move all tokens; players can only move their own PC tokens
- Real-time sync for all token movements and events via WebSocket
- Fog of war with manual Save — changes only broadcast when DM presses Save

### Token Management
- Token library per user: PC, NPC, and Enemy categories
- Custom images with file upload, or colored circle fallback
- HP tracking, AC, initiative
- Status effects (Blinded, Charmed, Frightened, Grappled, Incapacitated, Paralyzed, Poisoned, Prone, Restrained, Stunned, Unconscious)
- Enemy stats hidden from players unless DM marks them public

### Map Editor
- Tile-based map editor with 7 procedural draw layers
- Biome selection, configurable cell width/height/size
- Maps persist to DB as JSON; DM can assign an active map per session
- Active map auto-loads when players rejoin a session

### Dice Roller
- Flexible formula input (e.g. `2d6+4`)
- Roll log per session with individual die results
- Synced across all session participants

---

## Project Structure

```
dnd-battleboard-spring/
├── battleboard/               # Spring Boot backend (Maven)
│   └── src/main/
│       ├── java/...           # Controllers, Services, Entities, Security, WebSocket
│       └── resources/
│           ├── static/        # Built frontend (do not edit manually)
│           └── application.properties
└── battleboard-frontend/      # React + Vite frontend
    └── src/
        ├── pages/             # LoginPage, LobbyPage, GamePage, MapEditorPage
        ├── services/          # api.ts, authService, sessionService, tokenService, ...
        └── components/        # ToastContainer, etc.
```

---

## Local Development

### Prerequisites
- Java 21
- Node.js 18+
- PostgreSQL running locally with a database named `dndboard`

### Backend

```bash
cd battleboard
# Set DB credentials in src/main/resources/application.properties
mvn spring-boot:run
# Runs on http://localhost:8080
```

### Frontend

```bash
cd battleboard-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Build & Deploy

The frontend is compiled into the backend JAR for deployment.

```bash
# 1. Build frontend
cd battleboard-frontend && npm run build

# 2. Copy build output into Spring Boot static resources
rm -rf ../battleboard/src/main/resources/static/*
cp -r dist/* ../battleboard/src/main/resources/static/

# 3. Package as fat JAR
cd ../battleboard && mvn package -DskipTests

# 4. Copy to server
scp target/battlebord-0.0.1-SNAPSHOT.jar root@<server-ip>:/opt/battleboard/

# 5. Restart service on server
# ssh root@<server-ip> systemctl restart battleboard
```

### Server Setup (Hetzner VPS, Ubuntu 24.04)
- **Runtime:** Java 21, PostgreSQL, Nginx
- **Service:** systemd unit running the JAR at `/opt/battleboard/`
- **Nginx:** reverse proxy port 80 → 8080, with WebSocket upgrade headers
- **Config:** `application-prod.properties` at `/opt/battleboard/` (not committed)

---

## WebSocket Events

All events publish to `/topic/session/{id}` and are subscribed to by all session participants.

| Destination | Event |
|-------------|-------|
| `/app/token/move` | Token position changed |
| `/app/token/hp` | Token HP changed |
| `/app/token/stats-visibility` | Enemy stats public toggled |
| `/app/token/session-add` | Token added to session |
| `/app/token/session-remove` | Token removed from session |
| `/app/fog` | Fog of war state updated |

---

## Image Uploads

- `POST /api/upload` saves files to `uploads/` on disk, returns a relative URL
- `GET /uploads/**` is served as a static resource (no auth required)
- The `uploads/` directory must exist at the JAR's working directory on the server
