# AgisFL Enterprise API Security Guide

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "secure_password",
  "mfa_token": "123456"
}
```

### Response
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "user_id",
    "username": "admin",
    "role": "admin"
  }
}
```

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| API Calls | 100 requests | 1 minute |
| File Upload | 5 requests | 5 minutes |

## Security Headers

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

## Input Validation

All inputs are validated for:
- SQL injection patterns
- XSS attempts
- File type validation
- Size limits
- Character encoding

## Error Handling

Errors return standardized format:
```json
{
  "error": "error_type",
  "message": "User-friendly message",
  "request_id": "unique_id"
}
```

## Health Checks

- `/health` - Comprehensive health check
- `/healthz` - Kubernetes liveness probe
- `/readyz` - Kubernetes readiness probe

## Monitoring

- `/metrics` - Prometheus metrics (if enabled)
- Real-time WebSocket at `/ws`