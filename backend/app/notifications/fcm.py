from typing import Any, Dict, List

import firebase_admin
from firebase_admin import credentials, messaging
from loguru import logger

from backend.app.config import get_settings
from backend.app.models.device import Device

_initialized = False


def init_firebase() -> None:
    global _initialized
    if _initialized:
        return
    settings = get_settings()
    if not settings.firebase_credentials_path:
        logger.warning("FIREBASE_CREDENTIALS_PATH is not set; FCM disabled")
        return
    cred = credentials.Certificate(settings.firebase_credentials_path)
    firebase_admin.initialize_app(cred)
    _initialized = True
    logger.info("Firebase Admin initialized")


def send_notification_to_devices(
    devices: List[Device], title: str, body: str, data: Dict[str, Any] | None = None
) -> None:
    if not devices:
        return

    init_firebase()
    if not _initialized:
        logger.warning("Firebase not initialized; skipping FCM send")
        return

    # Use multicast send
    tokens = [d.fcm_token for d in devices if d.is_active]
    if not tokens:
        return

    message = messaging.MulticastMessage(
        tokens=tokens,
        notification=messaging.Notification(title=title, body=body),
        data={k: str(v) for k, v in (data or {}).items()},
    )

    try:
        response = messaging.send_multicast(message)
        logger.info(
            "Sent FCM notifications",
            extra={
                "success": response.success_count,
                "failure": response.failure_count,
            },
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception(f"Error sending FCM notifications: {exc}")
