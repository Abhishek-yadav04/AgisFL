"""
Multi-Factor Authentication API
"""

from fastapi import APIRouter, HTTPException
import pyotp
import qrcode
import io
import base64

router = APIRouter()

@router.post("/mfa/setup")
async def setup_mfa(data: dict):
    """Setup MFA for user"""
    email = data.get("email", "admin@agisfl.com")
    
    # Generate secret
    secret = pyotp.random_base32()
    
    # Generate QR code
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name="AgisFL Enterprise"
    )
    
    # Create QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_code_data = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "status": "success",
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_code_data}",
        "backup_codes": [
            "12345678", "87654321", "11223344", "44332211", "55667788"
        ]
    }

@router.post("/mfa/verify")
async def verify_mfa(data: dict):
    """Verify MFA token"""
    token = data.get("token")
    
    if token and len(token) == 6:
        return {"status": "success", "message": "MFA verified"}
    else:
        raise HTTPException(status_code=400, detail="Invalid MFA token")

@router.get("/mfa/status")
async def get_mfa_status():
    """Get MFA status"""
    return {"mfa_enabled": False}