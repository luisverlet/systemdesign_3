from fastapi.testclient import TestClient

from app.main import app
from app.services.disruption import mocks, service

client = TestClient(app)
URL = "/api/v1/disruptions/{}/resolve"


def test_service_escalates_base_case_without_rebooking():
    d = service.resolve("ABC123", mocks.now())
    assert d["human_case"]["case_id"] == "HC-4471"
    assert mocks.calls == ["create_human_case"]


def test_api_base_case():
    r = client.post(URL.format("ABC123"))
    assert r.status_code == 200
    d = r.json()
    assert d["facts"]["missed_connection"] is True
    assert d["applied_rules"] == ["R3", "R5"]
    assert d["recommended_option"]["option_id"] == "O1"
    assert d["action"] == "HUMAN"
    assert d["policy_ref"] == "POL-DELAY-2026-03"
    assert d["human_case"]["case_id"] == "HC-4471"
    for secret in ("maria.silva@example.com", "+56 9 8765 4321", "12.345.678-9"):
        assert secret not in r.text


def test_api_unknown_booking_404():
    assert client.post(URL.format("ZZZ999")).status_code == 404


def test_api_events_down_503_and_no_writes():
    mocks.FAILING.add("get_operational_events")
    assert client.post(URL.format("ABC123")).status_code == 503
    assert mocks.calls == []
