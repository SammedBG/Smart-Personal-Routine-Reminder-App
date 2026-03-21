from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import CurrentUser
from backend.app.db.session import get_db
from backend.app.schemas.device import DeviceRead, DeviceRegister
from backend.app.services.device_service import DeviceService


router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/register", response_model=DeviceRead)
async def register_device(
    data: DeviceRegister,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> DeviceRead:
    service = DeviceService(db)
    device = await service.register_or_update(current_user.id, data)
    return DeviceRead.model_validate(device)


@router.get("/", response_model=List[DeviceRead])
async def list_devices(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> List[DeviceRead]:
    service = DeviceService(db)
    devices = await service.list_devices(current_user.id)
    return [DeviceRead.model_validate(d) for d in devices]


@router.delete("/{device_id}")
async def remove_device(
    device_id: str,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    device = await service.get_device(current_user.id, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await service.deactivate(device)
    return {"detail": "Device removed"}
