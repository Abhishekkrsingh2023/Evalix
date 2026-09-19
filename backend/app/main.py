from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.v1.router import api_router
from app.core.config import settings


# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: startup and shutdown events."""
    # Startup
    yield
    # Shutdown — close DB connections
    from app.db.session import engine
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="""
## INNOV8 3.0 Hackathon Judging API

A production-ready judging system for managing teams, judges, and immutable score submissions.

### Key Features
- JWT-based authentication with HttpOnly cookies
- Role-based access control (SUPER_ADMIN / JUDGE)
- Immutable score submission (no edit/delete)
- QR code team lookup
- Real-time scoring aggregation

### Score Immutability
Scores are enforced immutable at multiple layers:
1. **DB layer**: `UNIQUE(judge_id, team_id, round)` constraint
2. **API layer**: No PUT/PATCH/DELETE endpoints for scores
3. **Service layer**: Pre-submission duplicate check → 409 Conflict
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes — sub-routers define their own path prefixes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Health"], summary="Health check")
async def root() -> dict:
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"], summary="Detailed health check")
async def health() -> dict:
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
