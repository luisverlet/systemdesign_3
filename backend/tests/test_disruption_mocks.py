import pytest

from app.services.disruption import mocks


def test_reads_return_exam_samples():
    trip = mocks.get_trip_context("ABC123")
    assert trip["_meta"]["completeness"] == "PARTIAL"
    assert len(trip["passengers"]) == 2
    assert mocks.get_policy_rules("DELAY")["version"] == "POL-DELAY-2026-03"


def test_unknown_booking_raises():
    with pytest.raises(mocks.BookingNotFound):
        mocks.get_trip_context("ZZZ999")


def test_rebooking_is_idempotent():
    assert mocks.create_rebooking_request({"option_id": "O1"}, "k1")[0] == 201
    status, body = mocks.create_rebooking_request({"option_id": "O1"}, "k1")
    assert status == 409
    assert body == {"error": "DUPLICATE_REQUEST", "request_id": "RBK-80231"}


def test_notify_requires_policy_ref():
    status, body = mocks.notify_passenger({"text": "hola"})
    assert status == 422 and body["error"] == "UNVALIDATED_CONTENT"
    assert (
        mocks.notify_passenger({"text": "hola", "policy_ref": "POL-DELAY-2026-03"})[0]
        == 202
    )
