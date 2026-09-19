# INNOV8 3.0 — Hackathon Judging System

A production-ready, secure, and responsive judging platform for the INNOV8 3.0 hackathon.

---

## 🏗️ Architecture

```
Frontend (Next.js 16 + TypeScript + Tailwind CSS)
        |  REST API (HttpOnly cookies, CORS)
        ▼
Backend (FastAPI + Python + asyncpg)
        |  SQLAlchemy 2.x ORM
        ▼
PostgreSQL (with DB-level constraints)
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Tool | Required Version |
|------|-----------------|
| Python | ≥ 3.11 |
| uv | latest |
| Node.js | ≥ 18 |
| bun | latest |
| PostgreSQL | ≥ 14 |

### 1. Clone & Configure

```bash
git clone <repo>
cd Evalix

# Backend config
cp backend/.env.example backend/.env
# Edit backend/.env and set:
# - DATABASE_URL (your Postgres connection string)
# - JWT_SECRET_KEY (long random secret)
# - ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME

# Frontend config
cp frontend/.env.example frontend/.env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
uv sync

# Create database (replace credentials as needed)
createdb innov8_judging

# Run migrations
uv run alembic upgrade head

# Seed initial admin
uv run python seed.py

# Start backend
uv run uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
bun install

# Start frontend
bun dev
```

Open: http://localhost:3000

---

## 🐳 Docker (Optional)

```bash
# From project root
docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Postgres: localhost:5432

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@innov8.local | changeme |

⚠️ **Change these before production via the `.env` file!**

---

## 📋 Feature Overview

### Authentication
- JWT access token (15 min) + refresh token (7 days)
- Stored in **HttpOnly cookies** (not localStorage)
- Automatic token rotation on refresh
- Argon2 password hashing

### Score Immutability (Multi-Layer)

| Layer | Mechanism |
|-------|-----------|
| Database | `UNIQUE(judge_id, team_id, round)` + `CHECK` constraints |
| API | No `PUT/PATCH/DELETE` endpoints for scores |
| Service | Pre-submission duplicate check → `409 Conflict` |
| Frontend | Read-only view after submission, no edit controls |

### Scoring Criteria

Each round (1 and 2) has 3 criteria, each scored 0–10:
- **Q&A**
- **Innovation & Originality**
- **Execution & MVP**

Maximum per round: **30 points**
Maximum per judge: **60 points**

### Score Aggregation

Team scores are aggregated as:
- **Round 1 Average** = mean of all judges' Round 1 totals
- **Round 2 Average** = mean of all judges' Round 2 totals  
- **Overall Average** = mean of all submitted scores across both rounds and all judges

---

## 📡 API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/refresh` | Authenticated |
| POST | `/api/v1/auth/logout` | Authenticated |
| GET  | `/api/v1/auth/me` | Authenticated |
| GET  | `/api/v1/teams` | Any authenticated |
| GET  | `/api/v1/teams/{team_id}` | Any authenticated |
| POST | `/api/v1/scores` | JUDGE only |
| GET  | `/api/v1/scores/my` | JUDGE only |
| GET  | `/api/v1/scores/team/{id}/status` | JUDGE only |
| GET  | `/api/v1/scores/team/{id}/round/{n}` | JUDGE only |
| GET  | `/api/v1/admin/dashboard` | SUPER_ADMIN only |
| GET  | `/api/v1/admin/leaderboard` | SUPER_ADMIN only |
| POST | `/api/v1/admin/teams` | SUPER_ADMIN only |
| GET  | `/api/v1/admin/teams` | SUPER_ADMIN only |
| GET  | `/api/v1/admin/teams/{id}` | SUPER_ADMIN only |
| GET  | `/api/v1/admin/judges` | SUPER_ADMIN only |
| POST | `/api/v1/admin/judges` | SUPER_ADMIN only |
| PATCH | `/api/v1/admin/judges/{id}/status` | SUPER_ADMIN only |
| POST | `/api/v1/admin/judges/{id}/reset-password` | SUPER_ADMIN only |

Interactive docs: http://localhost:8000/docs

---

## 🗄️ Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR(255) | |
| email | VARCHAR(255) | UNIQUE |
| password_hash | VARCHAR(1024) | Argon2 |
| role | ENUM | SUPER_ADMIN / JUDGE |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

### `teams`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| team_id | VARCHAR(50) | UNIQUE, e.g. INNOV8-001 |
| team_name | VARCHAR(255) | |
| leader_name | VARCHAR(255) | |
| created_at / updated_at | TIMESTAMPTZ | |

### `scores`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| judge_id | UUID FK | → users.id |
| team_id | UUID FK | → teams.id |
| round | INTEGER | CHECK: IN (1, 2) |
| qa_score | INTEGER | CHECK: 0-10 |
| innovation_score | INTEGER | CHECK: 0-10 |
| execution_score | INTEGER | CHECK: 0-10 |
| total_score | INTEGER | CHECK: = sum of above |
| submitted_at | TIMESTAMPTZ | |

**Key Constraint**: `UNIQUE(judge_id, team_id, round)` — enforces immutability at DB level

### `refresh_tokens`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | CASCADE DELETE |
| token_hash | VARCHAR(1024) | SHA-256 hash |
| is_revoked | BOOLEAN | |
| created_at / expires_at | TIMESTAMPTZ | |

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests
uv run pytest tests/ -v

# With coverage
uv run pytest tests/ --cov=app --cov-report=term-missing
```

Test coverage includes:
- Authentication (login, refresh, logout, inactive user)
- Team CRUD and duplicate rejection
- Score submission and immutability
- Score validation (range checks)
- No PUT/PATCH/DELETE endpoints for scores
- RBAC (judge cannot access admin, admin cannot submit scores)
- Judge isolation (two judges can score same team)
- Admin operations (judge management, dashboard)

---

## 🔒 Security Notes

- Passwords hashed with **Argon2** (memory-hard)
- JWT tokens stored in **HttpOnly, Secure, SameSite=Lax cookies**
- **Refresh token rotation** — old tokens revoked on use
- CORS configured to allow only specified origins
- Role checks enforced server-side for every request
- `judge_id` always derived from the authenticated JWT — never trusted from request body
- Total scores computed server-side — frontend totals are ignored
- Input validation at Pydantic schema level + DB constraint level

---

## 📱 Frontend Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/login` | Login page | Public |
| `/judge` | Judge dashboard | JUDGE |
| `/judge/scan` | QR scanner + manual entry | JUDGE |
| `/judge/team/[teamId]` | Team detail + round status | JUDGE |
| `/judge/team/[teamId]/round/[round]` | Scoring form | JUDGE |
| `/judge/history` | All submitted scores | JUDGE |
| `/admin` | Admin dashboard | SUPER_ADMIN |
| `/admin/teams` | Team management | SUPER_ADMIN |
| `/admin/teams/[teamId]` | Team detail + all scores | SUPER_ADMIN |
| `/admin/judges` | Judge management | SUPER_ADMIN |
| `/admin/scores` | Final leaderboard | SUPER_ADMIN |

---

## 🏁 Verified Workflow

✅ Admin logs in → creates judges → registers teams  
✅ Judge logs in → scans QR → team identified  
✅ Judge selects Round 1 → enters scores → confirms → permanently submitted  
✅ Judge revisits same team → Round 1 shows read-only submitted score  
✅ Judge submits Round 1 again → **409 Conflict**  
✅ Judge submits Round 2 → succeeds  
✅ Admin views team → sees all judge scores + calculated totals  
✅ Admin attempts score modification → **no edit controls exist**  
✅ Judge accesses admin routes → **403 Forbidden**  
✅ Admin tries to submit judge score → **403 Forbidden**
