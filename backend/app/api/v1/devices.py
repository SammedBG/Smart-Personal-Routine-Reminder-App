from fastapi import APIRouter, Depends
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
    return DeviceRead.from_orm(device)

