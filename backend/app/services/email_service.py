from __future__ import annotations

import logging
from functools import lru_cache

from fastapi_mail import FastMail, MessageSchema, MessageType, ConnectionConfig

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@lru_cache()
def _get_mail_config() -> ConnectionConfig:
    s = get_settings()
    return ConnectionConfig(
        MAIL_USERNAME=s.MAIL_USERNAME,
        MAIL_PASSWORD=s.MAIL_PASSWORD,
        MAIL_FROM=s.MAIL_FROM or s.MAIL_USERNAME,
        MAIL_SERVER=s.MAIL_SERVER,
        MAIL_PORT=s.MAIL_PORT,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )


class EmailService:
    """Async SMTP sender (fastapi-mail) with HTML templates."""

    def __init__(self) -> None:
        self._settings = get_settings()

    # ── Low-level send ─────────────────────────────────────────────────────

    async def _send(self, to: str, subject: str, html: str) -> None:
        if not self._settings.MAIL_USERNAME:
            logger.warning("MAIL_USERNAME not set — skipping email to %s", to)
            return

        msg = MessageSchema(
            subject=subject,
            recipients=[to],
            body=html,
            subtype=MessageType.html,
        )
        fm = FastMail(_get_mail_config())
        try:
            await fm.send_message(msg)
            logger.info("Email sent to=%s subject=%s", to, subject)
        except Exception as exc:
            logger.error("Email failed to=%s: %s", to, exc)
            raise

    # ── Templates ──────────────────────────────────────────────────────────

    async def send_verification_email(self, to: str, username: str, token: str) -> None:
        url = f"{self._settings.FRONTEND_URL}/verify-email?token={token}"
        html = _VERIFY_TEMPLATE.format(username=username, url=url, app=self._settings.APP_NAME)
        await self._send(to, f"Verify your {self._settings.APP_NAME} account", html)

    async def send_password_reset_email(self, to: str, username: str, token: str) -> None:
        url = f"{self._settings.FRONTEND_URL}/reset-password?token={token}"
        html = _RESET_TEMPLATE.format(username=username, url=url, app=self._settings.APP_NAME)
        await self._send(to, f"Reset your {self._settings.APP_NAME} password", html)


# ── HTML templates ─────────────────────────────────────────────────────────────

_BASE = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{{margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',system-ui,sans-serif;}}
    .wrap{{max-width:520px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,.5);}}
    .header{{background:linear-gradient(135deg,#7c3aed,#2563eb);padding:36px 40px;text-align:center;}}
    .logo{{font-size:22px;font-weight:700;color:#fff;letter-spacing:.5px;}}
    .body{{padding:40px;}}
    h1{{color:#f1f5f9;font-size:22px;margin:0 0 12px;}}
    p{{color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px;}}
    .btn{{display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;
          text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;}}
    .note{{font-size:13px;color:#64748b;margin-top:28px;padding-top:20px;border-top:1px solid #334155;}}
    .footer{{padding:20px 40px;text-align:center;}}
    .footer p{{color:#475569;font-size:13px;margin:0;}}
  </style>
</head>
<body>
<div class="wrap">
  <div class="header"><div class="logo">🎙️ {{app}}</div></div>
  <div class="body">{{content}}</div>
  <div class="footer"><p>© 2026 {{app}}. All rights reserved.</p></div>
</div>
</body>
</html>"""

_VERIFY_TEMPLATE = (
    _BASE
    .replace("{{content}}", (
        "<h1>Verify your email</h1>"
        "<p>Hi <strong style='color:#e2e8f0'>{username}</strong>, welcome to {app}!</p>"
        "<p>Click the button below to verify your email address and activate your account.</p>"
        "<a href='{url}' class='btn'>Verify Email Address</a>"
        "<p class='note'>This link expires in <strong>24 hours</strong>. "
        "If you didn't create an account, ignore this email.</p>"
    ))
    .replace("{{app}}", "{app}")
)

_RESET_TEMPLATE = (
    _BASE
    .replace("{{content}}", (
        "<h1>Reset your password</h1>"
        "<p>Hi <strong style='color:#e2e8f0'>{username}</strong>,</p>"
        "<p>We received a request to reset your password. "
        "Click the button below to choose a new one.</p>"
        "<a href='{url}' class='btn'>Reset Password</a>"
        "<p class='note'>This link expires in <strong>1 hour</strong>. "
        "If you didn't request a reset, ignore this email — your account is safe.</p>"
    ))
    .replace("{{app}}", "{app}")
)
