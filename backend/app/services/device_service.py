from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.device import Device, Platform
from backend.app.repositories.device_repository import DeviceRepository
from backend.app.schemas.device import DeviceRegister


class DeviceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DeviceRepository(db)

    async def register_or_update(
        self, user_id: UUID, data: DeviceRegister
    ) -> Device:
        device = await self.repo.get_by_user_and_device_id(user_id, data.device_id)
        platform = Platform.ANDROID if data.platform == "android" else Platform.IOS

        if device is None:
            device = Device(
                user_id=user_id,
                device_id=data.device_id,
                fcm_token=data.fcm_token,
                platform=platform.value,
                app_version=data.app_version,
                last_seen_at=datetime.utcnow(),
                is_active=True,
            )
            await self.repo.create(device)
        else:
            device.fcm_token = data.fcm_token
            device.platform = platform.value
            device.app_version = data.app_version
            device.last_seen_at = datetime.utcnow()
            device.is_active = True
            await self.repo.save(device)

        return device

    async def deactivate(self, device: Device) -> Device:
        device.is_active = False
        await self.repo.save(device)
        return device

