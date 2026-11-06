"""Contrato compartido de Disruption Companion (Fase 0).

Cambios a este archivo requieren PR propio y aviso al equipo.
"""

from datetime import date as Date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class ResolveRequest(BaseModel):
    booking_id: str = Field(pattern=r"^[A-Z0-9]{6}$", examples=["ABC123"])


class PassengerLabel(BaseModel):
    """Datos visibles del pasajero (D6). Nunca email, teléfono ni dirección."""

    passenger_id: str
    name: str
    type: str  # ADULT | CHILD | INFANT
    document_id: str | None = None
    loyalty_tier: str | None = None


class FlightStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    ON_TIME = "ON_TIME"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"


class FlightView(BaseModel):
    segment_id: str
    flight_number: str
    origin: str
    destination: str
    date: Date
    scheduled_departure: str  # HH:MM
    scheduled_arrival: str
    estimated_departure: str
    estimated_arrival: str
    gate: str | None = None  # None => "no disponible"
    delay_minutes: int = 0
    status: FlightStatus
    boarding_time: str  # salida vigente - 20 min (D6b)
    lounge_time: str  # embarque - 60 min (D6b)
    times_estimated: bool = True


class DiscardReason(str, Enum):
    SOURCE_DEGRADED = "SOURCE_DEGRADED"
    SUPERSEDED = "SUPERSEDED"  # existe un evento más reciente del mismo tipo/segmento


class ReconciledEvent(BaseModel):
    event_id: str
    segment_id: str
    type: str  # DELAY | GATE_CHANGE | STATUS | CANCELLATION
    source: str
    recorded_at: datetime
    accepted: bool
    discard_reason: DiscardReason | None = None


class Relevance(str, Enum):
    ACTIONABLE = "ACTIONABLE"
    INFORMATIONAL = "INFORMATIONAL"
    NOT_RELEVANT = "NOT_RELEVANT"


class Impact(BaseModel):
    relevance: Relevance
    missed_connection: bool
    reasons: list[str]


class AppliedRule(BaseModel):
    rule_id: str
    condition: str
    entitlement: str
    requires_human_approval: bool


class Option(BaseModel):
    option_id: str
    type: str  # REBOOK | REFUND
    flight_number: str | None = None
    origin: str | None = None
    destination: str | None = None
    date: Date | None = None
    departure: str | None = None
    fare_difference: int | None = None
    currency: str | None = None
    seats_available: int | None = None
    policy_ref: str
    confidence: str  # HIGH | MEDIUM | LOW


class DecisionType(str, Enum):
    AUTO_OFFER = "AUTO_OFFER"  # se ofrecen opciones al pasajero
    HUMAN_REVIEW = "HUMAN_REVIEW"  # se crea caso humano, sin acción automática
    INFO_ONLY = "INFO_ONLY"  # solo notificar
    NO_ACTION = "NO_ACTION"


class Decision(BaseModel):
    type: DecisionType
    reason: str
    policy_version: str | None = None
    human_case_id: str | None = None


class ResolveResponse(BaseModel):
    booking_id: str
    passengers: list[PassengerLabel]
    flights: list[FlightView]
    events: list[ReconciledEvent]
    impact: Impact
    applied_rules: list[AppliedRule]
    options: list[Option]
    decision: Decision
    message: str  # texto para el pasajero, generado por plantilla (D7)
    data_completeness: str  # COMPLETE | PARTIAL
    missing_fields: list[str] = []
    generated_at: datetime
