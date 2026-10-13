import pytest
from app.auth import hash_password, verify_password, create_access_token, decode_token

def test_password_hashing_and_verification():
    raw_pass = "SecurePass@2026"
    hashed = hash_password(raw_pass)
    assert hashed != raw_pass
    assert ":" in hashed
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation_and_decoding():
    payload = {"sub": "user-12345", "role": "faculty", "email": "test@campus.edu"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-12345"
    assert decoded["role"] == "faculty"

def test_invalid_token():
    assert decode_token("invalid.token.structure") is None
