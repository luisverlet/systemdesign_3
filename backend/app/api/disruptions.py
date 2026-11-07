from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.disruption import (
    EscalateRequest,
    EscalateResponse,
    RebookingRequest,
    RebookingResponse,
    ResolveRequest,
    ResolveResponse,
)
from app.services.disruption_service import disruption_service

router = APIRouter(prefix="/disruptions", tags=["disruptions"])


@router.post(
    "/resolve",
    response_model=ResolveResponse,
    status_code=status.HTTP_200_OK,
    summary="Resolve disruption impact, eligible options, and automated policies for a booking",
)
def resolve_disruption(
    payload: ResolveRequest, db: Session = Depends(get_db)
) -> ResolveResponse:
    return disruption_service.resolve(payload, db)


@router.post(
    "/rebooking",
    response_model=RebookingResponse,
    status_code=status.HTTP_200_OK,
    summary="Request automated rebooking for an option with built-in idempotency",
)
def request_rebooking(
    payload: RebookingRequest, db: Session = Depends(get_db)
) -> RebookingResponse:
    return disruption_service.rebook(payload, db)


@router.post(
    "/escalate",
    response_model=EscalateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Escalate complex case to human operations desk",
)
def escalate_disruption(
    payload: EscalateRequest, db: Session = Depends(get_db)
) -> EscalateResponse:
    return disruption_service.escalate(payload, db)
