from fastapi.testclient import TestClient

from app.main import app
from app.schemas.agent import AgentResponse

client = TestClient(app)
ENDPOINT = "/api/v1/agent/chat"


def test_agent_chat_target_conversation_success():
    payload = {
        "booking_id": "ABC123",
        "message": (
            "Hola, soy Maria. Mi vuelo a Lima está retrasado y viajo con mi hijo de 7 años. "
            "¿Alcanzamos la conexión a México? Si no, cámbiennos al vuelo de esta noche. "
            "También quiero saber cuánto me van a pagar de compensación."
        ),
    }
    response = client.post(ENDPOINT, json=payload)
    assert response.status_code == 200

    data = response.json()
    validated = AgentResponse.model_validate(data)

    assert validated.booking_id == "ABC123"
    assert validated.human_required is True
    assert "REBOOK_NO_FEE" in validated.entitlements
    assert "CASH_COMPENSATION" not in validated.entitlements
    assert "get_trip_context" in validated.tools_invoked
    assert "get_operational_events" in validated.tools_invoked
    assert "get_policy_rules" in validated.tools_invoked
    assert "get_eligible_options" in validated.tools_invoked
    assert "create_human_case" in validated.tools_invoked
    assert "Tomás" in validated.passenger_reply or "hijo" in validated.passenger_reply
    assert "HC-4471" in validated.passenger_reply or "HC-4471" in validated.next_step


def test_agent_chat_invalid_booking_id_422():
    payload = {
        "booking_id": "INVALID_PNR",
        "message": "Hola, ¿cómo está mi vuelo?",
    }
    response = client.post(ENDPOINT, json=payload)
    assert response.status_code == 422


def test_agent_chat_empty_message_422():
    payload = {
        "booking_id": "ABC123",
        "message": "",
    }
    response = client.post(ENDPOINT, json=payload)
    assert response.status_code == 422

