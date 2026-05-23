"""
Роутер камер хранения и паллетомест: /api/chambers/*, /api/pallet-locations/*
"""

import uuid
from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_role
from app.models.user import User
from app.models.chamber import Chamber
from app.models.pallet_location import PalletLocation
from app.schemas.chamber import (
    ChamberCreate,
    ChamberUpdate,
    ChamberResponse,
    ChamberListResponse,
)
from app.schemas.pallet_location import (
    PalletLocationCreate,
    PalletLocationUpdate,
    PalletLocationResponse,
    PalletLocationListResponse,
)
from app.services.audit_service import AuditService

router = APIRouter(tags=["chambers"])


# ═══════════════════════════════════════════════
# Chambers CRUD
# ═══════════════════════════════════════════════

@router.get("/api/chambers", response_model=ChamberListResponse)
async def list_chambers(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Фильтр по складу"),
    is_active: Optional[bool] = Query(None, description="Фильтр активности"),
    search: Optional[str] = Query(None, description="Поиск по коду/названию"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> ChamberListResponse:
    """Список камер хранения."""
    query = select(Chamber)
    count_q = select(func.count(Chamber.id))

    if warehouse_id is not None:
        query = query.where(Chamber.warehouse_id == warehouse_id)
        count_q = count_q.where(Chamber.warehouse_id == warehouse_id)
    if is_active is not None:
        query = query.where(Chamber.is_active == is_active)
        count_q = count_q.where(Chamber.is_active == is_active)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            (Chamber.code.ilike(pattern)) | (Chamber.name.ilike(pattern))
        )
        count_q = count_q.where(
            (Chamber.code.ilike(pattern)) | (Chamber.name.ilike(pattern))
        )

    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    result = await db.execute(
        query.order_by(Chamber.code).offset(skip).limit(limit)
    )
    items = [ChamberResponse.model_validate(ch) for ch in result.scalars().all()]
    return ChamberListResponse(items=items, total=total)


@router.get("/api/chambers/{chamber_id}", response_model=ChamberResponse)
async def get_chamber(
    chamber_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ChamberResponse:
    """Получить камеру по ID."""
    result = await db.execute(select(Chamber).where(Chamber.id == chamber_id))
    chamber = result.scalar_one_or_none()
    if not chamber:
        raise HTTPException(status_code=404, detail="Chamber not found")
    return ChamberResponse.model_validate(chamber)


@router.post("/api/chambers", response_model=ChamberResponse, status_code=201)
async def create_chamber(
    data: ChamberCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> ChamberResponse:
    """Создать камеру."""
    chamber = Chamber(
        warehouse_id=data.warehouse_id,
        code=data.code,
        name=data.name,
        chamber_type=data.chamber_type,
        capacity_pallets=data.capacity_pallets,
        zone=data.zone,
        temperature_mode=data.temperature_mode,
        is_active=data.is_active,
    )
    db.add(chamber)
    await db.flush()
    await AuditService.log(db, current_user.id, "create", "chamber", chamber.id, {"code": data.code})
    return ChamberResponse.model_validate(chamber)


@router.put("/api/chambers/{chamber_id}", response_model=ChamberResponse)
async def update_chamber(
    chamber_id: uuid.UUID,
    data: ChamberUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> ChamberResponse:
    """Обновить камеру."""
    result = await db.execute(select(Chamber).where(Chamber.id == chamber_id))
    chamber = result.scalar_one_or_none()
    if not chamber:
        raise HTTPException(status_code=404, detail="Chamber not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(chamber, key, value)
    chamber.updated_at = datetime.now(timezone.utc)

    await db.flush()
    await AuditService.log(db, current_user.id, "update", "chamber", chamber.id, update_data)
    return ChamberResponse.model_validate(chamber)


@router.delete("/api/chambers/{chamber_id}", status_code=204)
async def delete_chamber(
    chamber_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> None:
    """Деактивировать камеру (soft delete через is_active=False)."""
    result = await db.execute(select(Chamber).where(Chamber.id == chamber_id))
    chamber = result.scalar_one_or_none()
    if not chamber:
        raise HTTPException(status_code=404, detail="Chamber not found")
    chamber.is_active = False
    chamber.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await AuditService.log(db, current_user.id, "delete", "chamber", chamber.id)


# ═══════════════════════════════════════════════
# Pallet Locations CRUD
# ═══════════════════════════════════════════════

@router.get("/api/pallet-locations", response_model=PalletLocationListResponse)
async def list_pallet_locations(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    chamber_id: Optional[uuid.UUID] = Query(None, description="Фильтр по камере"),
    status: Optional[str] = Query(None, description="Фильтр по статусу"),
    search: Optional[str] = Query(None, description="Поиск по коду"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> PalletLocationListResponse:
    """Список паллетомест."""
    query = select(PalletLocation)
    count_q = select(func.count(PalletLocation.id))

    if chamber_id is not None:
        query = query.where(PalletLocation.chamber_id == chamber_id)
        count_q = count_q.where(PalletLocation.chamber_id == chamber_id)
    if status is not None:
        query = query.where(PalletLocation.status == status)
        count_q = count_q.where(PalletLocation.status == status)
    if search:
        pattern = f"%{search}%"
        query = query.where(PalletLocation.code.ilike(pattern))
        count_q = count_q.where(PalletLocation.code.ilike(pattern))

    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    result = await db.execute(
        query.order_by(PalletLocation.code).offset(skip).limit(limit)
    )
    items = [PalletLocationResponse.model_validate(pl) for pl in result.scalars().all()]
    return PalletLocationListResponse(items=items, total=total)


@router.get("/api/pallet-locations/{location_id}", response_model=PalletLocationResponse)
async def get_pallet_location(
    location_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PalletLocationResponse:
    """Получить паллетоместо по ID."""
    result = await db.execute(
        select(PalletLocation).where(PalletLocation.id == location_id)
    )
    pl = result.scalar_one_or_none()
    if not pl:
        raise HTTPException(status_code=404, detail="Pallet location not found")
    return PalletLocationResponse.model_validate(pl)


@router.post("/api/pallet-locations", response_model=PalletLocationResponse, status_code=201)
async def create_pallet_location(
    data: PalletLocationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> PalletLocationResponse:
    """Создать паллетоместо."""
    pl = PalletLocation(
        chamber_id=data.chamber_id,
        code=data.code,
        status=data.status,
        is_blocked=data.is_blocked,
        note=data.note,
        last_modified=datetime.now(timezone.utc),
    )
    db.add(pl)
    await db.flush()
    await AuditService.log(db, current_user.id, "create", "pallet_location", pl.id, {"code": data.code})
    return PalletLocationResponse.model_validate(pl)


@router.put("/api/pallet-locations/{location_id}", response_model=PalletLocationResponse)
async def update_pallet_location(
    location_id: uuid.UUID,
    data: PalletLocationUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> PalletLocationResponse:
    """Обновить паллетоместо."""
    result = await db.execute(
        select(PalletLocation).where(PalletLocation.id == location_id)
    )
    pl = result.scalar_one_or_none()
    if not pl:
        raise HTTPException(status_code=404, detail="Pallet location not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pl, key, value)
    pl.last_modified = datetime.now(timezone.utc)
    pl.updated_at = datetime.now(timezone.utc)

    await db.flush()
    await AuditService.log(db, current_user.id, "update", "pallet_location", pl.id, update_data)
    return PalletLocationResponse.model_validate(pl)


@router.delete("/api/pallet-locations/{location_id}", status_code=204)
async def delete_pallet_location(
    location_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> None:
    """Удалить паллетоместо."""
    result = await db.execute(
        select(PalletLocation).where(PalletLocation.id == location_id)
    )
    pl = result.scalar_one_or_none()
    if not pl:
        raise HTTPException(status_code=404, detail="Pallet location not found")
    await db.delete(pl)
    await db.flush()
    await AuditService.log(db, current_user.id, "delete", "pallet_location", location_id)
