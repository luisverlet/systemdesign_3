from typing import Any
from pydantic import BaseModel, Field


class AgentQueryRequest(BaseModel):
    booking_id: str = Field(
        ...,
        pattern=r"^[A-Z0-9]{6}$",
        description="6-character alphanumeric booking reference PNR",
        examples=["ABC123"],
    )
    message: str = Field(
        ...,
        min_length=1,
        description="Natural language question from the passenger",
        examples=[
            "Hola, soy Maria. Mi vuelo a Lima está retrasado y viajo con mi hijo de 7 años. ¿Alcanzamos la conexión a México? Si no, cámbiennos al vuelo de esta noche. También quiero saber cuánto me van a pagar de compensación."
        ],
    )


class AgentOption(BaseModel):
    option_id: str
    type: str  # e.g., 'REBOOK', 'REFUND'
    flight_number: str | None = None
    origin: str | None = None
    destination: str | None = None
    date: str | None = None
    departure: str | None = None
    fare_difference: float | None = 0.0
    currency: str | None = None
    seats_available: int | None = None
    policy_ref: str
    confidence: str = "HIGH"


class AgentResponse(BaseModel):
    booking_id: str
    what_happened: str = Field(
        ...,
        description="Factual summary of operational events and connection status",
    )
    entitlements: list[str] = Field(
        default_factory=list,
        description="List of entitlements granted strictly by airline policy",
    )
    options: list[AgentOption] = Field(
        default_factory=list,
        description="List of available resolution options",
    )
    next_step: str = Field(
        ...,
        description="Actionable next step for passenger or airport operations",
    )
    policy_refs: list[str] = Field(
        default_factory=list,
        description="Policy version references backing the entitlements",
    )
    human_required: bool = Field(
        ...,
        description="True if human review or airport specialist intervention is mandatory",
    )
    passenger_reply: str = Field(
        ...,
        description="Empathetic, clear conversational response directed to the passenger",
    )
    tools_invoked: list[str] = Field(
        default_factory=list,
        description="Ordered sequence of tools called during trajectory execution",
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Trace IDs, latency, or debugging attributes",
    )
