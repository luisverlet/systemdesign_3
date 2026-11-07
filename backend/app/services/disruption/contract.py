"""Map the engine's decision to the team's shared ResolveResponse contract (dicts in, dict out)."""

from __future__ import annotations

from datetime import datetime, timedelta

from app.services.disruption.events import resolve_events
from app.services.disruption.facts import local_dt

BOARDING_BEFORE_DEPARTURE = 20  # D6b
LOUNGE_BEFORE_BOARDING = 60  # D6b


def _hhmm(dt: datetime) -> str:
    return dt.strftime("%H:%M")


def _flights(trip: dict, events_resp: dict, facts: dict) -> list:
    resolved, _ = resolve_events(events_resp)
    flights = []
    for seg in trip["segments"]:
        state = resolved.get(seg["segment_id"], {})
        status_event = state.get("status") or {}
        delay = (
            facts["delay_minutes"]
            if seg["segment_id"] == facts["disrupted_segment"]
            else 0
        )
        dep = local_dt(seg["date"], seg["scheduled_departure"]) + timedelta(
            minutes=delay
        )
        arr = local_dt(seg["date"], seg["scheduled_arrival"]) + timedelta(minutes=delay)
        boarding = dep - timedelta(minutes=BOARDING_BEFORE_DEPARTURE)
        if delay:
            flight_status = "DELAYED"
        elif status_event.get("status") in ("ON_TIME", "SCHEDULED", "CANCELLED"):
            flight_status = status_event["status"]
        else:
            flight_status = "SCHEDULED"
        flights.append(
            {
                **{
                    k: seg[k]
                    for k in (
                        "segment_id",
                        "flight_number",
                        "origin",
                        "destination",
                        "date",
                        "scheduled_departure",
                        "scheduled_arrival",
                    )
                },
                "estimated_departure": _hhmm(dep),
                "estimated_arrival": _hhmm(arr),
                "gate": state.get("gate") and state["gate"].get("gate"),
                "delay_minutes": delay,
                "status": flight_status,
                "boarding_time": _hhmm(boarding),
                "lounge_time": _hhmm(
                    boarding - timedelta(minutes=LOUNGE_BEFORE_BOARDING)
                ),
                "times_estimated": True,
            }
        )
    return flights


def _events(events_resp: dict, decision: dict) -> list:
    discarded = {d["event_id"] for d in decision["discarded_events"]}
    accepted = set()
    for seg in resolve_events(events_resp)[0].values():
        accepted |= {e["event_id"] for e in (seg["status"], seg["gate"]) if e}
    rows = []
    for e in events_resp["events"]:
        ok = e["event_id"] in accepted
        rows.append(
            {
                "event_id": e["event_id"],
                "segment_id": e["segment_id"],
                "type": e["type"],
                "source": e["source"],
                "recorded_at": e["recorded_at"],
                "accepted": ok,
                # Untrusted sources map to SOURCE_DEGRADED: the contract has no closer value.
                "discard_reason": None
                if ok
                else "SOURCE_DEGRADED"
                if e["event_id"] in discarded
                else "SUPERSEDED",
            }
        )
    return rows


def _impact(trip: dict, decision: dict) -> dict:
    f = decision["facts"]
    if not f["disrupted_segment"]:
        return {"relevance": "NOT_RELEVANT", "missed_connection": False, "reasons": []}
    segs = {s["segment_id"]: s for s in trip["segments"]}
    reasons = [
        f"{f['disrupted_segment']} retrasado {f['delay_minutes']} min: "
        f"llegada estimada {f['estimated_arrival'][-5:]}"
    ]
    if f["next_segment"]:
        nxt = segs[f["next_segment"]]
        verb = "no alcanza" if f["missed_connection"] else "alcanza"
        reasons.append(
            f"Conexión {f['next_segment']} sale {nxt['scheduled_departure']}: {verb} "
            "con 60 min de conexión mínima"
        )
    relevance = "ACTIONABLE" if decision["entitlements"] else "INFORMATIONAL"
    return {
        "relevance": relevance,
        "missed_connection": f["missed_connection"],
        "reasons": reasons,
    }


def _message(trip: dict, decision: dict) -> str:
    """Fixed templates only (D7): never free text about money or guarantees."""
    f = decision["facts"]
    if not f["disrupted_segment"]:
        return "Tu viaje no tiene cambios relevantes."
    segs = {s["segment_id"]: s for s in trip["segments"]}
    text = (
        f"Tu vuelo {segs[f['disrupted_segment']]['flight_number']} está retrasado "
        f"{f['delay_minutes']} minutos"
    )
    if f["missed_connection"]:
        text += (
            f" y no alcanzarás tu conexión {segs[f['next_segment']]['flight_number']}"
        )
    text += "."
    case = decision["human_case"]
    if case:
        text += (
            f" Un agente revisará tu caso de forma prioritaria (caso {case['case_id']},"
            f" respuesta en máx. {case['sla_minutes']} min)."
        )
    elif decision["recommended_option"]:
        opt = decision["recommended_option"]
        text += (
            f" Puedes cambiarte sin costo al vuelo {opt['flight_number']} del "
            f"{opt['date']} a las {opt['departure']}."
        )
    return text


def to_resolve_response(inputs: tuple, decision: dict, now: datetime) -> dict:
    trip, events_resp, _, policy = inputs
    rules = {r["rule_id"]: r for r in policy["rules"]}
    option = decision["recommended_option"]
    case = decision["human_case"]
    if decision["action"] == "HUMAN":
        decision_type = "HUMAN_REVIEW"
    elif option:
        decision_type = "AUTO_OFFER"
    else:
        decision_type = (
            "INFO_ONLY" if decision["facts"]["disrupted_segment"] else "NO_ACTION"
        )
    by_id = {p["passenger_id"]: p for p in trip["passengers"]}
    return {
        "booking_id": trip["booking_id"],
        # Name and loyalty tier are shown (D6); document_id is withheld on purpose.
        "passengers": [
            {
                "passenger_id": p["passenger_id"],
                "name": by_id[p["passenger_id"]]["name"],
                "type": p["type"],
                "document_id": None,
                "loyalty_tier": by_id[p["passenger_id"]].get("loyalty_tier"),
            }
            for p in decision["passengers"]
        ],
        "flights": _flights(trip, events_resp, decision["facts"]),
        "events": _events(events_resp, decision),
        "impact": _impact(trip, decision),
        "applied_rules": [
            {
                k: rules[r][k]
                for k in (
                    "rule_id",
                    "condition",
                    "entitlement",
                    "requires_human_approval",
                )
            }
            for r in decision["applied_rules"]
        ],
        # Only the option that passed every policy filter is offered, never a paid one.
        "options": [option] if option else [],
        "decision": {
            "type": decision_type,
            "reason": "; ".join(decision["human_reasons"])
            or "Opción elegible sin costo",
            "policy_version": decision["policy_ref"],
            "human_case_id": case and case["case_id"],
        },
        "message": _message(trip, decision),
        "data_completeness": trip.get("_meta", {}).get("completeness", "COMPLETE"),
        "missing_fields": decision["missing_fields"],
        "generated_at": now,
    }
