from fastapi import APIRouter

from app.api.v1 import auth, teams, scores, admin

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(teams.router)
api_router.include_router(scores.router)
api_router.include_router(admin.router)
