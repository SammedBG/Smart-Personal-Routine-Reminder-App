from typing import List

from backend.app.core.dependencies import CurrentUser, DeviceServiceDep
from backend.app.schemas.device import DeviceRead, DeviceRegister
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/register", response_model=DeviceRead)
async def register_device(
    data: DeviceRegister,
    current_user: CurrentUser,
    service: DeviceServiceDep,
) -> DeviceRead:
    device = await service.register_or_update(current_user.id, data)
    return DeviceRead.model_validate(device)


@router.get("/", response_model=List[DeviceRead])
async def list_devices(
    current_user: CurrentUser,
    service: DeviceServiceDep,
) -> List[DeviceRead]:
    devices = await service.list_devices(current_user.id)
    return [DeviceRead.model_validate(d) for d in devices]


@router.delete("/{device_id}")
async def remove_device(
    device_id: str,
    current_user: CurrentUser,
    service: DeviceServiceDep,
):
    device = await service.get_device(current_user.id, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await service.deactivate(device)
    return {"detail": "Device removed"}
