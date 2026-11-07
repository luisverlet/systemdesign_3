from datetime import datetime, timezone
from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class IdempotencyRecord(Base):
    """Stores execution state and response for rebooking requests to guarantee idempotency."""

    __tablename__ = "idempotency_records"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    booking_id: Mapped[str] = mapped_column(String(6), index=True, nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # IN_PROGRESS, SUCCEEDED, INDETERMINATE, FAILED
    response: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
