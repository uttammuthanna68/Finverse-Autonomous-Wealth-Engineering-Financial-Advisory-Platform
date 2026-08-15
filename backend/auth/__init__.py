"""
Auth Module Entrypoint for Compound Application

ARCHITECTURE & AUTHENTICATION CHOICE DOCUMENTATION:
===================================================
Authentication Strategy: JSON Web Tokens (JWT) using HMAC-SHA256 (HS256).

Why JWT was chosen:
1. Stateless Session Management: Allows scalable API verification without requiring session state Lookups on every request.
2. Decoupled Architecture: Fits the clean boundary between the Engine Agent (/backend/engine) and Interface Agent (/frontend).
3. Client Mobility: Tokens are issued upon successful authentication and passed via standard 'Authorization: Bearer <token>' HTTP headers.
4. Security: Tokens are signed with a server-side secret key and carry a configurable expiration time (exp claim).

Note: This technical decision is documented strictly in code comments and is never exposed on any user-facing UI screen.
"""

from .security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

__all__ = [
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
]
