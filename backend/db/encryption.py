import os
import base64
from typing import Optional, Union
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

def _get_fernet_instance() -> Fernet:
    secret = os.getenv("APP_ENCRYPTION_KEY", "compound_field_encryption_secret_2026")
    salt = b"compound_salt_val"
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
    return Fernet(key)

_fernet = _get_fernet_instance()

def encrypt_field(value: Optional[Union[float, int, str]]) -> Optional[str]:
    """Encrypt a numeric or string financial value into an encrypted string payload."""
    if value is None:
        return None
    val_str = str(value)
    encrypted_bytes = _fernet.encrypt(val_str.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")

def decrypt_field(encrypted_value: Optional[str], as_float: bool = True) -> Optional[Union[float, str]]:
    """Decrypt an encrypted string payload back to float or raw string."""
    if not encrypted_value:
        return None
    try:
        decrypted_bytes = _fernet.decrypt(encrypted_value.encode("utf-8"))
        decrypted_str = decrypted_bytes.decode("utf-8")
        if as_float:
            return float(decrypted_str)
        return decrypted_str
    except Exception:
        return None
