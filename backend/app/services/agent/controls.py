"""Human-in-the-Loop (HITL) Guardrails and High-Impact Action Controls.

Enforces strict autonomy boundaries for automated agent actions.
"""

from typing import Any
from dataclasses import dataclass


class HITLBlockedActionException(Exception):
    """Raised when an automated write action is prohibited by safety policy."""

    def __init__(self, action: str, reason: str, requires_escalation: bool = True):
        super().__init__(f"Action '{action}' blocked by HITL policy: {reason}")
        self.action = action
        self.reason = reason
        self.requires_escalation = requires_escalation


@dataclass
class ActionResult:
    status: str
    action_type: str
    details: dict[str, Any]
    human_case_id: str | None = None
    is_indeterminate: bool = False


class ActionGuardrail:
    """Evaluates whether an action proposed by the agent can be executed autonomously."""

    @staticmethod
    def check_rebooking_allowed(trip_context: dict[str, Any], applied_rules: list[dict[str, Any]]) -> bool:
        """Determines if automated rebooking is allowed or blocked by policy."""
        # 1. Check if passengers contain minors
        passengers = trip_context.get("passengers", [])
        has_minor = any(
            p.get("type") in ["CHILD", "INFANT"] or (isinstance(p.get("age"), int) and p["age"] < 18)
            for p in passengers
        )

        # 2. Check if rule R5 or requires_human_approval is flagged
        requires_human = any(
            rule.get("rule_id") == "R5" or rule.get("requires_human_approval") is True
            for rule in applied_rules
        )

        if has_minor or requires_human:
            raise HITLBlockedActionException(
                action="create_rebooking_request",
                reason="Group includes a minor (Rule R5). Mandatory human agent oversight required.",
                requires_escalation=True,
            )

        return True

    @staticmethod
    def handle_upstream_timeout(action_type: str, payload: dict[str, Any]) -> ActionResult:
        """Handles 503 UPSTREAM_TIMEOUT by marking status as INDETERMINATE without blind retries."""
        return ActionResult(
            status="INDETERMINATE",
            action_type=action_type,
            details={
                "error": "UPSTREAM_TIMEOUT",
                "message": "The upstream system timed out. The operation state is indeterminate.",
                "payload": payload,
            },
            is_indeterminate=True,
        )


action_guardrail = ActionGuardrail()
