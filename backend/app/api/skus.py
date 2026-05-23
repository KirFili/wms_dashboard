"""
Роутер справочника SKU: /api/skus/*
"""

import uuid
from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_role
from app.models.user import User
from app.models.sku import SKU
from app.schemas.sku import (
    SKUCreate,
    SKUUpdate,
    SKUResponse,
    SKUListResponse,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/skus", tags=["skus"])


@router.get("", response_model=SKUListResponse)
async def list_skus(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    is_active: Optional[bool] = Query(None, description="Фильтр активности"),
    search: Optional[str] = Query(None, description="Поиск по коду/названию"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> SKUListResponse:
    """Список SKU."""
    query = select(SKU)
    count_q = select(func.count(SKU.id))

    if category is not None:
        query = query.where(SKU.category == category)
        count_q = count_q.where(SKU.category == category)
    if is_active is not None:
        query = query.where(SKU.is_active == is_active)
        count_q = count_q.where(SKU.is_active == is_active)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            (SKU.sku_code.ilike(pattern)) | (SKU.sku_name.ilike(pattern))
        )
        count_q = count_q.where(
            (SKU.sku_code.ilike(pattern)) | (SKU.sku_name.ilike(pattern))
        )

    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    result = await db.execute(
        query.order_by(SKU.sku_code).offset(skip).limit(limit)
    )
    items = [SKUResponse.model_validate(sku) for sku in result.scalars().all()]
    return SKUListResponse(items=items, total=total)


@router.get("/{sku_id}", response_model=SKUResponse)
async def get_sku(
    sku_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> SKUResponse:
    """Получить SKU по ID."""
    result = await db.execute(select(SKU).where(SKU.id == sku_id))
    sku = result.scalar_one_or_none()
    if not sku:
        raise HTTPException(status_code=404, detail="SKU not found")
    return SKUResponse.model_validate(sku)


@router.post("", response_model=SKUResponse, status_code=201)
async def create_sku(
    data: SKUCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> SKUResponse:
    """Создать SKU."""
    sku = SKU(
        sku_code=data.sku_code,
        sku_name=data.sku_name,
        category=data.category,
        unit=data.unit,
        pallet_coeff=data.pallet_coeff,
        volume=data.volume,
        is_active=data.is_active,
    )
    db.add(sku)
    await db.flush()
    await AuditService.log(
        db, current_user.id, "create", "sku", sku.id, {"sku_code": data.sku_code}
    )
    return SKUResponse.model_validate(sku)


@router.put("/{sku_id}", response_model=SKUResponse)
async def update_sku(
    sku_id: uuid.UUID,
    data: SKUUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> SKUResponse:
    """Обновить SKU."""
    result = await db.execute(select(SKU).where(SKU.id == sku_id))
    sku = result.scalar_one_or_none()
    if not sku:
        raise HTTPException(status_code=404, detail="SKU not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sku, key, value)
    sku.updated_at = datetime.now(timezone.utc)

    await db.flush()
    await AuditService.log(db, current_user.id, "update", "sku", sku.id, update_data)
    return SKUResponse.model_validate(sku)


@router.delete("/{sku_id}", status_code=204)
async def delete_sku(
    sku_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> None:
    """Деактивировать SKU (soft delete)."""
    result = await db.execute(select(SKU).where(SKU.id == sku_id))
    sku = result.scalar_one_or_none()
    if not sku:
        raise HTTPException(status_code=404, detail="SKU not found")
    sku.is_active = False
    sku.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await AuditService.log(db, current_user.id, "delete", "sku", sku_id)
