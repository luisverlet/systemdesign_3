"""Decide which operational events are true when sources are degraded or disagree."""

from __future__ import annotations

TRUSTED_SOURCES = {"OPS_CORE", "AIRPORT_FEED"}
ASPECT = {"DELAY": "status", "STATUS": "status", "GATE_CHANGE": "gate"}


def _value(event: dict):
    if event["type"] == "DELAY":
        return ("DELAY", event.get("delay_minutes"))
    if event["type"] == "STATUS":
        return (event.get("status"),)
    return (event.get("gate"),)


def resolve_events(response: dict):
    """Return ({segment_id: {"status", "gate", "conflicts"}}, discarded)."""
    degraded = set(response.get("_meta", {}).get("sources_degraded", []))
    discarded = []
    by_key: dict = {}
    for e in response.get("events", []):
        if e["source"] in degraded:
            discarded.append({"event_id": e["event_id"], "reason": "source degraded"})
        elif e["source"] not in TRUSTED_SOURCES:
            discarded.append({"event_id": e["event_id"], "reason": "untrusted source"})
        elif e["type"] not in ASPECT:
            discarded.append(
                {"event_id": e["event_id"], "reason": "unknown event type"}
            )
        else:
            by_key.setdefault((e["segment_id"], ASPECT[e["type"]]), []).append(e)

    resolved: dict = {}
    for (segment_id, aspect), events in by_key.items():
        seg = resolved.setdefault(
            segment_id, {"status": None, "gate": None, "conflicts": []}
        )
        # ISO-8601 UTC strings sort chronologically.
        events.sort(key=lambda e: e["recorded_at"])
        latest = events[-1]
        disagreeing = [
            e
            for e in events
            if e["source"] != latest["source"] and _value(e) != _value(latest)
        ]
        if disagreeing:
            seg["conflicts"] += [e["event_id"] for e in disagreeing] + [
                latest["event_id"]
            ]
        seg[aspect] = latest
    return resolved, discarded
