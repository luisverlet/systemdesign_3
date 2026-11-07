from fastapi import APIRouter

from app.api.disruptions import router as disruptions_router

api_router = APIRouter()


@api_router.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(disruptions_router)
