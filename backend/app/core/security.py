import re
from typing import Any


def mask_email(email: str | None) -> str | None:
    """Mask email address (e.g. maria.silva@example.com -> m***a@example.com)."""
    if not email or "@" not in email:
        return email
    local_part, domain = email.split("@", 1)
    if len(local_part) <= 2:
        masked_local = f"{local_part[0]}***"
    else:
        masked_local = f"{local_part[0]}***{local_part[-1]}"
    return f"{masked_local}@{domain}"


def mask_phone(phone: str | None) -> str | None:
    """Mask phone number keeping only last 4 digits (e.g. +56 9 8765 4321 -> ***-4321)."""
    if not phone:
        return phone
    digits = re.sub(r"\D", "", phone)
    if len(digits) < 4:
        return "***"
    return f"***-{digits[-4:]}"


def mask_document_id(doc_id: str | None) -> str | None:
    """Mask document ID keeping only first and last 2 characters."""
    if not doc_id:
        return doc_id
    clean = doc_id.strip()
    if len(clean) <= 4:
        return "****"
    return f"{clean[:2]}***{clean[-2:]}"


def sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Recursively mask sensitive PII fields in dictionaries for safe logging and audit."""
    sanitized: dict[str, Any] = {}
    for key, value in payload.items():
        lower_key = key.lower()
        if isinstance(value, dict):
            sanitized[key] = sanitize_payload(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_payload(item) if isinstance(item, dict) else item
                for item in value
            ]
        elif "email" in lower_key and isinstance(value, str):
            sanitized[key] = mask_email(value)
        elif "phone" in lower_key and isinstance(value, str):
            sanitized[key] = mask_phone(value)
        elif any(k in lower_key for k in ["document", "doc_id", "passport"]) and isinstance(
            value, str
        ):
            sanitized[key] = mask_document_id(value)
        elif any(k in lower_key for k in ["credit_card", "cvv", "password", "token"]):
            sanitized[key] = "[REDACTED]"
        else:
            sanitized[key] = value
    return sanitized
