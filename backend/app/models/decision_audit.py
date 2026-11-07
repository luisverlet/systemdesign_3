import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class DecisionAudit(Base):
    """Audit trail for every disruption resolution, rebooking, escalation or notification decision."""

    __tablename__ = "decision_audits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    booking_id: Mapped[str] = mapped_column(String(6), index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(20), nullable=False)  # RESOLVE, REBOOK, ESCALATE
    decision_type: Mapped[str] = mapped_column(String(20), nullable=False)  # AUTO_OFFER, HUMAN_REVIEW, etc.
    relevance: Mapped[str] = mapped_column(String(20), nullable=False)  # ACTIONABLE, INFORMATIONAL, NOT_RELEVANT
    policy_version: Mapped[str | None] = mapped_column(String(40), nullable=True)
    applied_rules: Mapped[dict | list] = mapped_column(JSON, default=list, nullable=False)
    evidence: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)  # Non-PII operational event logs
    outcome: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)  # Resulting case_id, request_id, etc.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
