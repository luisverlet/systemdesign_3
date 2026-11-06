import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.schemas.disruption import DecisionType, ResolveRequest, ResolveResponse

BACKEND = Path(__file__).resolve().parents[1]
FIXTURES = BACKEND / "app" / "integrations" / "fixtures"
FRONT_MOCK = BACKEND.parent / "frontend" / "src" / "mocks" / "resolve-ABC123.json"


@pytest.mark.parametrize("name", sorted(p.name for p in FIXTURES.glob("*.json")))
def test_fixtures_are_valid_json(name: str) -> None:
    json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def test_booking_id_format() -> None:
    assert ResolveRequest(booking_id="ABC123").booking_id == "ABC123"
    with pytest.raises(ValidationError):
        ResolveRequest(booking_id="abc")


@pytest.mark.skipif(not FRONT_MOCK.exists(), reason="frontend mock not mounted")
def test_frontend_mock_matches_contract() -> None:
    resp = ResolveResponse.model_validate_json(FRONT_MOCK.read_text(encoding="utf-8"))
    assert resp.decision.type is DecisionType.HUMAN_REVIEW
    assert resp.impact.missed_connection is True
    assert {r.rule_id for r in resp.applied_rules} == {"R3", "R5"}
    dumped = resp.model_dump_json()
    assert "email" not in dumped and "phone" not in dumped
