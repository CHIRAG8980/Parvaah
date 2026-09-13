"""Cryptographic utilities for password hashing, JWTs, CSRF, and secure cookies."""

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any
from fastapi import Response
from app.config import settings


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with per-user cryptographic salt (100,000 iterations)."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2:sha256:100000${salt}${dk.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored salt-hash format (PBKDF2 or legacy salt-hash)."""
    if stored_hash.startswith("pbkdf2:sha256:"):
        parts = stored_hash.split("$")
        if len(parts) == 3:
            salt = parts[1]
            expected_hex = parts[2]
            dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
            return secrets.compare_digest(expected_hex, dk.hex())

    if "$" in stored_hash:
        salt, digest = stored_hash.split("$", 1)
        expected = hashlib.sha256((salt + password).encode()).hexdigest()
        return secrets.compare_digest(expected, digest)

    expected = hashlib.sha256(password.encode()).hexdigest()
    return secrets.compare_digest(expected, stored_hash) or password == stored_hash


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (4 - (len(data) % 4)) if len(data) % 4 else ""
    return base64.urlsafe_b64decode(data + padding)


def create_jwt_token(data: dict[str, Any], expires_delta_seconds: int) -> str:
    """Generate RFC 7519 standard HMAC-SHA256 JSON Web Token."""
    header = {"alg": settings.JWT_ALGORITHM, "typ": "JWT"}
    now_ts = int(time.time())
    exp_ts = now_ts + expires_delta_seconds

    payload = {
        **data,
        "iat": now_ts,
        "nbf": now_ts,
        "exp": exp_ts,
        "iss": "parvaah-ner-disaster-control",
    }

    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def create_access_token(data: dict[str, Any], expires_delta_seconds: int | None = None) -> str:
    """Generate short-lived access JWT (default 15 minutes)."""
    seconds = expires_delta_seconds if expires_delta_seconds is not None else (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    return create_jwt_token({**data, "token_type": "access"}, seconds)


def create_refresh_token(user_id: str, family_id: str) -> tuple[str, str]:
    """Generate rotating refresh token and SHA-256 hash for database storage.

    Returns (raw_token, token_hash).
    """
    raw_token = f"rf_{secrets.token_urlsafe(48)}"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    return raw_token, token_hash


def decode_jwt_token(token: str) -> dict[str, Any] | None:
    """Decode and cryptographically verify standard HMAC-SHA256 JWT."""
    parts = token.split(".")
    if len(parts) != 3:
        return None

    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    expected_sig = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    expected_sig_b64 = _base64url_encode(expected_sig)

    if not secrets.compare_digest(sig_b64, expected_sig_b64):
        return None

    try:
        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return None

    now_ts = int(time.time())
    if "exp" in payload and payload["exp"] < now_ts:
        return None

    return payload


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode and verify access token."""
    payload = decode_jwt_token(token)
    if not payload:
        return None
    # If token_type is defined, require it to be 'access'
    if payload.get("token_type") and payload.get("token_type") != "access":
        return None
    return payload


def generate_csrf_token(user_id: str) -> str:
    """Generate signed CSRF token tied to user and current timestamp."""
    random_part = secrets.token_hex(16)
    timestamp = str(int(time.time()))
    payload = f"{user_id}:{timestamp}:{random_part}"
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}:{signature}"


def verify_csrf_token(csrf_token: str, user_id: str, max_age_seconds: int = 86400 * 7) -> bool:
    """Cryptographically verify signed CSRF token against user ID and expiration."""
    if not csrf_token or ":" not in csrf_token:
        return False

    parts = csrf_token.split(":")
    if len(parts) != 4:
        return False

    token_user, timestamp_str, random_part, signature = parts
    if token_user != user_id:
        return False

    try:
        ts = int(timestamp_str)
        if time.time() - ts > max_age_seconds:
            return False
    except ValueError:
        return False

    payload = f"{token_user}:{timestamp_str}:{random_part}"
    expected_sig = hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return secrets.compare_digest(signature, expected_sig)


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    csrf_token: str,
) -> None:
    """Set secure authentication and CSRF cookies on HTTP response."""
    access_max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    refresh_max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400

    # 1. HttpOnly Access Token Cookie
    response.set_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        value=access_token,
        max_age=access_max_age,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )

    # 2. HttpOnly Refresh Token Cookie
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        max_age=refresh_max_age,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )

    # 3. Double-Submit CSRF Cookie (readable by JS to include in X-CSRF-Token header)
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        max_age=refresh_max_age,
        httponly=False,  # Intentionally false for double-submit cookie pattern
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear all authentication and CSRF cookies on logout or session invalidation."""
    for cookie_name in (
        settings.ACCESS_TOKEN_COOKIE_NAME,
        settings.REFRESH_TOKEN_COOKIE_NAME,
        settings.CSRF_COOKIE_NAME,
    ):
        response.delete_cookie(
            key=cookie_name,
            domain=settings.COOKIE_DOMAIN,
            path="/",
            httponly=True if cookie_name != settings.CSRF_COOKIE_NAME else False,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
        )
