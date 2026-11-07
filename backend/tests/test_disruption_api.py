import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.schemas.disruption import ResolveResponse
from app.services.disruption import mocks, service

URL = "/api/v1/disruptions/resolve"


class _FakeDb:
    """Audit writes are Dev 2's concern; these tests only check the decision."""

    def __init__(self):
        self.added = []

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        pass


@pytest.fixture
def client():
    db = _FakeDb()
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app), db
    app.dependency_overrides.clear()


def test_service_escalates_base_case_without_rebooking():
    d = service.resolve("ABC123", mocks.now())
    assert d["human_case"]["case_id"] == "HC-4471"
    assert mocks.calls == ["create_human_case"]


def test_api_base_case(client):
    http, db = client
    r = http.post(URL, json={"booking_id": "ABC123"})
    assert r.status_code == 200
    d = ResolveResponse.model_validate(r.json())
    assert d.impact.missed_connection is True
    assert [x.rule_id for x in d.applied_rules] == ["R3", "R5"]
    assert [o.option_id for o in d.options] == ["O1"]
    assert d.decision.type.value == "HUMAN_REVIEW"
    assert d.decision.policy_version == "POL-DELAY-2026-03"
    assert d.decision.human_case_id == "HC-4471"
    s1 = d.flights[0]
    assert (s1.status.value, s1.estimated_arrival, s1.gate) == (
        "DELAYED",
        "20:35",
        "24",
    )
    legacy = next(e for e in d.events if e.event_id == "E-1012")
    assert legacy.accepted is False and legacy.discard_reason.value == "SOURCE_DEGRADED"
    assert len(db.added) == 1  # one audit row
    assert mocks.calls == ["create_human_case"]
    for secret in ("maria.silva@example.com", "+56 9 8765 4321", "12.345.678-9"):
        assert secret not in r.text


def test_api_unknown_booking_404(client):
    assert client[0].post(URL, json={"booking_id": "ZZZ999"}).status_code == 404


def test_api_events_down_503_and_no_writes(client):
    http, db = client
    mocks.FAILING.add("get_operational_events")
    assert http.post(URL, json={"booking_id": "ABC123"}).status_code == 503
    assert mocks.calls == [] and db.added == []
