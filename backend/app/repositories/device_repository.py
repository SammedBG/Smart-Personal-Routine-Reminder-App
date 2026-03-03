from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.device import Device


class DeviceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_and_device_id(
        self, user_id: UUID, device_id: str
    ) -> Optional[Device]:
        result = await self.db.execute(
            select(Device).where(
                Device.user_id == user_id,
                Device.device_id == device_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: UUID) -> List[Device]:
        result = await self.db.execute(
            select(Device).where(Device.user_id == user_id, Device.is_active.is_(True))
        )
        return list(result.scalars().all())

    async def create(self, device: Device) -> Device:
        self.db.add(device)
        await self.db.flush()
        return device

    async def save(self, device: Device) -> Device:
        self.db.add(device)
        await self.db.flush()
        return device
