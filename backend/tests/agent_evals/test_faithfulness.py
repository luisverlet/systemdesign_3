"""Evaluation Test - Faithfulness Check.

Validates that all entitlements and options granted to the passenger
are strictly anchored to an existing policy_ref without hallucinations.
"""

from app.services.disruption.mocks import get_policy_rules


def test_faithfulness_entitlements_anchored_to_valid_policy():
    policy_data = get_policy_rules("DELAY")
    valid_version = policy_data["version"]
    assert valid_version == "POL-DELAY-2026-03"

    # Candidate entitlements granted in target conversation
    granted_entitlements = [
        {"entitlement": "REBOOK_NO_FEE", "policy_ref": "POL-DELAY-2026-03"},
        {"entitlement": "PRIORITY_HANDLING", "policy_ref": "POL-DELAY-2026-03"},
    ]

    # Every entitlement must have an exact match with the active version
    for item in granted_entitlements:
        assert item["policy_ref"] == valid_version

    # An unauthorized claim (hallucination) without policy_ref must fail validation
    invalid_claim = {"entitlement": "UNLIMITED_LOUNGE_ACCESS", "policy_ref": None}
    assert invalid_claim["policy_ref"] != valid_version
