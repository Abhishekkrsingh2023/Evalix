<div align="center">

# ⚡ Evalix

**Next-Gen Hackathon Evaluation & Real-Time Judging Platform**

A secure, high-performance, and mobile-friendly judging system built for modern hackathons and competitive developer events.

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python%203.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<br/>

[Key Features](#-key-features) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Security & Immutability](#-score-immutability--security) • [License](#-license)

</div>

---

## 📖 Overview

**Evalix** eliminates paper rubrics, chaotic spreadsheets, and evaluation tampering during hackathons. Designed with a mobile-first judging interface and a real-time admin nerve-center, Evalix allows organizers to manage hundreds of participants, deploy judges with QR scanners, and calculate live, audit-proof leaderboards with zero friction.

---

## ✨ Key Features

- 📲 **QR Code Quick-Scan**: Judges scan team badges or table stands to instantly launch the team's scoring rubrics.
- 🔒 **Multi-Layer Score Immutability**: Write-once architecture guarantees scores cannot be modified or overwritten once finalized.
- 👥 **Role-Based Portals**:
  - **Judges**: Mobile-optimized workflow, live round progress, criteria scoring, and personal submission history.
  - **Super Admins**: Live participant rosters, judge credential lifecycle, round controls, and real-time aggregated leaderboards.
- 🎯 **Multi-Criteria & Multi-Round Scoring**: Standardized scoring across rounds with automated average aggregation across all judges.
- 🛡️ **Enterprise Security**: Argon2 password hashing, HttpOnly secure cookies, refresh token rotation, and strict API rate limiting.
- ⚡ **Blazing Fast**: Powered by Next.js 16 App Router, FastAPI asynchronous I/O, and Bun + uv package managers.

---

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Frontend (Next.js 16 + React 19)         │
│         Mobile-first UI • QR Scanner • Real-time State  │
└───────────────────────────┬────────────────────────────┘
                            │ REST API / HttpOnly Cookies
                            ▼
┌────────────────────────────────────────────────────────┐
│               Backend (FastAPI + Async Python)         │
│          RBAC • Score Validation • Pydantic v2         │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy 2.0 (asyncpg)
                            ▼
┌────────────────────────────────────────────────────────┐
│          PostgreSQL (Relational Persistence)           │
│         Strict DB Constraints (UNIQUE judge/team/round)│
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [TanStack Query](https://tanstack.com/query), [Zustand](https://zustand-demo.pmnd.rs/), [Lucide React](https://lucide.dev/) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/), [Python 3.11+](https://python.org), [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async), [Alembic](https://alembic.sqlalchemy.org/), [Pydantic v2](https://docs.pydantic.dev/) |
| **Database & Auth** | [PostgreSQL](https://www.postgresql.org/), [asyncpg](https://github.com/MagicStack/asyncpg), [Argon2](https://github.com/pwn-hash/argon2-cffi), [python-jose](https://github.com/mpdavis/python-jose) |
| **Tooling & Runtimes** | [Bun](https://bun.sh/) (Frontend runtime/package manager), [uv](https://github.com/astral-sh/uv) (Extremely fast Python package manager) |

---

## 🚀 Quick Start

### Prerequisites

- **Python** ≥ 3.11 & [uv](https://docs.astral.sh/uv/)
- **Node.js** ≥ 18 & [Bun](https://bun.sh/)
- **PostgreSQL** ≥ 14

### 1. Clone & Setup Environment

```bash
git clone https://github.com/Abhishekkrsingh2023/Evalix.git
cd Evalix

# Configure Backend environment
cp backend/.env.example backend/.env

# Configure Frontend environment
cp frontend/.env.example frontend/.env.local
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies with uv
uv sync

# Run database migrations
uv run alembic upgrade head

# Seed initial super admin user
uv run python seed.py

# Start development server
uv run uvicorn app.main:app --reload --port 8000
```

> **API Documentation**: Once running, visit [http://localhost:8000/docs](http://localhost:8000/docs) for the interactive OpenAPI/Swagger UI.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
bun install

# Start Next.js development server
bun dev
```

> **Web Application**: Access the web portal at [http://localhost:3000](http://localhost:3000).

---


## 🔒 Score Immutability & Security

Evalix ensures judging integrity through defense-in-depth:

| Layer | Immutability & Security Mechanism |
|---|---|
| **Database Level** | `UNIQUE(judge_id, team_id, round)` prevents duplicate entries at the engine level. `CHECK` constraints validate score bounds (0–10). |
| **API Level** | Strictly write-once (`POST /scores` only). No `PUT`, `PATCH`, or `DELETE` routes exist for scores. |
| **Service Logic** | Pre-flight duplicate check rejects re-submissions with `409 Conflict`. Total scores are calculated server-side. |
| **Client UI** | Dynamic lockouts immediately render submitted rounds read-only. |
| **Authentication** | JWT tokens delivered over secure `HttpOnly, SameSite=Lax` cookies with automatic refresh token rotation. |

---

## 📁 Repository Structure

```text
Evalix/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Versioned REST endpoints (auth, admin, judges, scores, teams)
│   │   ├── core/           # Security, Argon2 hashing, JWT, application config
│   │   ├── models/         # SQLAlchemy 2.0 async ORM models
│   │   ├── schemas/        # Pydantic validation & serialization schemas
│   │   └── services/       # Business logic & immutability validation
│   ├── migrations/         # Alembic database migration scripts
│   ├── pyproject.toml      # Python dependencies and build metadata
│   └── seed.py             # Initial database seeder
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/   # Authentication view
│   │   ├── admin/          # Admin dashboard, team & judge management, leaderboard
│   │   └── judge/          # Judge dashboard, QR scanner, scoring workflow
│   ├── package.json        # Frontend dependencies & scripts
│   └── tailwind.config.ts  # Tailwind CSS configuration
├── LICENSE                 # MIT License
└── README.md
```

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
