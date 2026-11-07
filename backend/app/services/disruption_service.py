import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.decision_audit import DecisionAudit
from app.models.idempotency_record import IdempotencyRecord
from app.schemas.disruption import (
    DecisionType,
    EscalateRequest,
    EscalateResponse,
    RebookingRequest,
    RebookingResponse,
    RebookingStatus,
    ResolveRequest,
    ResolveResponse,
)

FIXTURES_PATH = Path(__file__).resolve().parents[1] / "integrations" / "fixtures"
FRONTEND_MOCK_PATH = (
    Path(__file__).resolve().parents[3]
    / "frontend"
    / "src"
    / "mocks"
    / "resolve-ABC123.json"
)


class DisruptionService:
    """Orchestrates flight disruption evaluation, idempotency control, and audit logging."""

    @staticmethod
    def _sanitize_evidence(evidence: dict[str, Any]) -> dict[str, Any]:
        """Strip sensitive passenger PII (phone, email, document_id) before persistence."""
        sanitized = dict(evidence)
        for key in ["email", "phone", "document_id", "credit_card"]:
            sanitized.pop(key, None)
        return sanitized

    def resolve(self, payload: ResolveRequest, db: Session) -> ResolveResponse:
        """Resolve trip disruption context, evaluate policy, and record decision audit."""
        booking_id = payload.booking_id.upper()

        # Until Dev 1 merges the core engine, use baseline fixture for ABC123 or standard fallback
        if FRONTEND_MOCK_PATH.exists() and booking_id == "ABC123":
            raw_data = json.loads(FRONTEND_MOCK_PATH.read_text(encoding="utf-8"))
            response = ResolveResponse.model_validate(raw_data)
        else:
            # Generic stub for any other booking ID
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Booking {booking_id} not found in operational feeds",
            )

        # Audit decision in PostgreSQL
        audit_entry = DecisionAudit(
            booking_id=booking_id,
            action="RESOLVE",
            decision_type=response.decision.type.value,
            relevance=response.impact.relevance.value,
            policy_version=response.decision.policy_version,
            applied_rules=[rule.model_dump() for rule in response.applied_rules],
            evidence={
                "events_count": len(response.events),
                "missed_connection": response.impact.missed_connection,
                "reasons": response.impact.reasons,
            },
            outcome={
                "decision": response.decision.type.value,
                "human_case_id": response.decision.human_case_id,
            },
        )
        db.add(audit_entry)
        db.commit()

        return response

    def rebook(self, payload: RebookingRequest, db: Session) -> RebookingResponse:
        """Execute rebooking with derived idempotency check and high-impact policy guard."""
        booking_id = payload.booking_id.upper()
        option_id = payload.option_id.upper()

        # Verify whether the latest decision required human review (Base case rule R5 guard)
        last_decision = (
            db.query(DecisionAudit)
            .filter(DecisionAudit.booking_id == booking_id)
            .order_by(DecisionAudit.created_at.desc())
            .first()
        )

        if last_decision and last_decision.decision_type == DecisionType.HUMAN_REVIEW.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Automated rebooking blocked: this case involves a minor and requires human agent approval.",
            )

        # Derived idempotency key (Decision A2: booking_id + option_id)
        idempotency_key = f"{booking_id}:{option_id}"
        payload_hash = hashlib.sha256(
            f"{booking_id}:{option_id}".encode("utf-8")
        ).hexdigest()

        # Check existing idempotency record
        record = (
            db.query(IdempotencyRecord)
            .filter(IdempotencyRecord.key == idempotency_key)
            .first()
        )

        if record:
            if record.status == "SUCCEEDED" and record.response:
                return RebookingResponse.model_validate(record.response)
            if record.status == "IN_PROGRESS":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A rebooking operation for this option is currently in progress.",
                )
            if record.status == "INDETERMINATE":
                return RebookingResponse(
                    request_id=record.response.get("request_id", "UNKNOWN"),
                    status=RebookingStatus.INDETERMINATE,
                    booking_id=booking_id,
                    option_id=option_id,
                    message="Previous request timed out in upstream system. Status is indeterminate.",
                )

        # Register execution state as IN_PROGRESS
        new_record = IdempotencyRecord(
            key=idempotency_key,
            booking_id=booking_id,
            request_hash=payload_hash,
            status="IN_PROGRESS",
        )
        db.add(new_record)
        db.commit()

        # Simulated external call to create_rebooking_request
        response_data = {
            "request_id": f"RBK-{booking_id}-80231",
            "status": RebookingStatus.PENDING_CONFIRMATION.value,
            "booking_id": booking_id,
            "option_id": option_id,
            "expires_at": datetime.now(timezone.utc).isoformat(),
            "message": "Rebooking requested successfully. Awaiting confirmation.",
        }

        # Update idempotency record to SUCCEEDED
        new_record.status = "SUCCEEDED"
        new_record.response = response_data
        new_record.updated_at = datetime.now(timezone.utc)

        audit_entry = DecisionAudit(
            booking_id=booking_id,
            action="REBOOK",
            decision_type=DecisionType.AUTO_OFFER.value,
            relevance="ACTIONABLE",
            policy_version="POL-DELAY-2026-03",
            applied_rules=["REBOOK_REQUESTED"],
            evidence={"option_id": option_id, "idempotency_key": idempotency_key},
            outcome=response_data,
        )
        db.add(audit_entry)
        db.commit()

        return RebookingResponse.model_validate(response_data)

    def escalate(self, payload: EscalateRequest, db: Session) -> EscalateResponse:
        """Create a human agent assistance ticket in customer operations."""
        booking_id = payload.booking_id.upper()
        clean_evidence = self._sanitize_evidence(payload.evidence)

        # Mock SLA and queue based on criteria
        case_id = f"HC-{booking_id[:3]}-4471"
        response_data = {
            "case_id": case_id,
            "queue": "DISRUPTION_L2",
            "sla_minutes": 45,
            "booking_id": booking_id,
            "created_at": datetime.now(timezone.utc),
        }

        audit_entry = DecisionAudit(
            booking_id=booking_id,
            action="ESCALATE",
            decision_type=DecisionType.HUMAN_REVIEW.value,
            relevance="ACTIONABLE",
            policy_version="POL-DELAY-2026-03",
            applied_rules=["MANUAL_ESCALATION"],
            evidence=clean_evidence,
            outcome=response_data,
        )
        db.add(audit_entry)
        db.commit()

        return EscalateResponse.model_validate(response_data)


disruption_service = DisruptionService()
