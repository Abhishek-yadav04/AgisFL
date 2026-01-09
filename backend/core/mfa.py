"""
Multi-Factor Authentication (MFA) Implementation
"""

import pyotp
import qrcode
from io import BytesIO
import base64
from typing import Optional, Dict, Any
from pydantic import BaseModel

class MFASetupResponse(BaseModel):
    secret: str
    qr_code: str
    backup_codes: list[str]

class MFAManager:
    def __init__(self):
        self.issuer_name = "AgisFL Enterprise"
    
    def generate_secret(self) -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()
    
    def generate_qr_code(self, user_email: str, secret: str) -> str:
        """Generate QR code for TOTP setup"""
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=self.issuer_name
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buf = BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        
        # Convert to base64 for frontend
        img_base64 = base64.b64encode(buf.getvalue()).decode()
        return f"data:image/png;base64,{img_base64}"
    
    def verify_token(self, secret: str, token: str) -> bool:
        """Verify TOTP token"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
    
    def generate_backup_codes(self, count: int = 8) -> list[str]:
        """Generate backup codes"""
        return [pyotp.random_base32()[:8] for _ in range(count)]
    
    def setup_mfa(self, user_email: str) -> MFASetupResponse:
        """Complete MFA setup"""
        secret = self.generate_secret()
        qr_code = self.generate_qr_code(user_email, secret)
        backup_codes = self.generate_backup_codes()
        
        return MFASetupResponse(
            secret=secret,
            qr_code=qr_code,
            backup_codes=backup_codes
        )


# Lazy-init singleton factory for MFAManager
_mfa_manager_instance = None
def get_mfa_manager():
    global _mfa_manager_instance
    if _mfa_manager_instance is None:
        _mfa_manager_instance = MFAManager()
    return _mfa_manager_instance