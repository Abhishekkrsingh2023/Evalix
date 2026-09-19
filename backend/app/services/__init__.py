from app.services.auth_service import login, refresh_tokens, logout
from app.services.team_service import create_team, get_team_by_team_id, list_teams
from app.services.score_service import (
    submit_score,
    get_my_scores,
    get_team_scores,
    get_team_score_status,
    get_team_detail_with_scores,
)
from app.services.admin_service import (
    create_judge,
    list_judges,
    get_judge_stats,
    update_judge_status,
    reset_judge_password,
    get_dashboard_stats,
    get_leaderboard,
)

__all__ = [
    "login", "refresh_tokens", "logout",
    "create_team", "get_team_by_team_id", "list_teams",
    "submit_score", "get_my_scores", "get_team_scores",
    "get_team_score_status", "get_team_detail_with_scores",
    "create_judge", "list_judges", "get_judge_stats",
    "update_judge_status", "reset_judge_password",
    "get_dashboard_stats", "get_leaderboard",
]
