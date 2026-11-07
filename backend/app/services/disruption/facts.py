"""Turn the trip and the resolved events into the facts the policy rules check."""

from __future__ import annotations

from datetime import datetime, timedelta

MIN_CONNECTION_MINUTES = 60
# shortcut: only the airports in the exam case, replace with a real airport table.
AIRPORT_COUNTRY = {"SCL": "CL", "LIM": "PE", "MEX": "MX"}
MINOR_TYPES = {"CHILD", "INFANT"}


def local_dt(date: str, hhmm: str) -> datetime:
    return datetime.strptime(f"{date} {hhmm}", "%Y-%m-%d %H:%M")


def derive_facts(
    trip: dict, resolved: dict, compensation_requested: bool = False
) -> dict:
    """Facts for the first delayed segment; None marks a fact that cannot be known."""
    segments = trip["segments"]
    facts = {
        "delay_minutes": 0,
        "international": None,
        "missed_connection": False,
        "group_includes_minor": any(
            p.get("type") in MINOR_TYPES for p in trip["passengers"]
        ),
        "compensation_requested": compensation_requested,
        "disrupted_segment": None,
        "estimated_arrival": None,
        "next_segment": None,
    }
    for i, seg in enumerate(segments):
        status = resolved.get(seg["segment_id"], {}).get("status")
        if not status or status["type"] != "DELAY":
            continue
        delay = status["delay_minutes"]
        # Arrival time is local to the destination, as is the next departure from it.
        arrival = local_dt(seg["date"], seg["scheduled_arrival"])
        if arrival < local_dt(seg["date"], seg["scheduled_departure"]):
            arrival += timedelta(days=1)
        arrival += timedelta(minutes=delay)
        origin, dest = (
            AIRPORT_COUNTRY.get(seg["origin"]),
            AIRPORT_COUNTRY.get(seg["destination"]),
        )
        facts.update(
            delay_minutes=delay,
            international=None if not (origin and dest) else origin != dest,
            disrupted_segment=seg["segment_id"],
            estimated_arrival=arrival,
        )
        if i + 1 < len(segments):
            nxt = segments[i + 1]
            next_dep = local_dt(nxt["date"], nxt["scheduled_departure"])
            facts["next_segment"] = nxt["segment_id"]
            facts["missed_connection"] = (
                arrival + timedelta(minutes=MIN_CONNECTION_MINUTES) > next_dep
            )
        break
    return facts
