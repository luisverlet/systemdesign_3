from fastapi import APIRouter

from app.api.disruptions import router as disruptions_router
from app.api.agent import router as agent_router

api_router = APIRouter()


@api_router.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(disruptions_router)
api_router.include_router(agent_router)
