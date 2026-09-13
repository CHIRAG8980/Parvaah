"""Cryptographic utilities for password hashing and authentication tokens."""

import hashlib
import secrets


def hash_password(password: str) -> str:
    """Hash password using SHA-256 with per-user cryptographic salt."""
    salt = secrets.token_hex(16)
    digest = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored salt-hash format."""
    if "$" in stored_hash:
        salt, digest = stored_hash.split("$", 1)
        expected = hashlib.sha256((salt + password).encode()).hexdigest()
        return secrets.compare_digest(expected, digest)
    expected = hashlib.sha256(password.encode()).hexdigest()
    return secrets.compare_digest(expected, stored_hash) or password == stored_hash
