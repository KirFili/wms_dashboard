"""
Роутер dashboard: /api/dashboard/*
Endpoints: summary, chambers-occupancy, occupancy-trend, sku-efficiency, heatmap, details
"""

from datetime import date
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    warehouse_id: Optional[UUID] = Query(None, description="Фильтр по складу"),
) -> list[dict]:
    """Сводка KPI по складу."""
    return await DashboardService.get_summary(db, warehouse_id)


@router.get("/chambers-occupancy")
async def chambers_occupancy(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    warehouse_id: Optional[UUID] = Query(None, description="Фильтр по складу"),
    chamber_id: Optional[UUID] = Query(None, description="Фильтр по камере"),
) -> list[dict]:
    """Заполненность по камерам."""
    return await DashboardService.get_chambers_occupancy(
        db, warehouse_id, chamber_id
    )


@router.get("/occupancy-trend")
async def occupancy_trend(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    date_from: Optional[date] = Query(None, description="Дата начала периода"),
    date_to: Optional[date] = Query(None, description="Дата конца периода"),
    warehouse_id: Optional[UUID] = Query(None, description="Фильтр по складу"),
    chamber_id: Optional[UUID] = Query(None, description="Фильтр по камере"),
) -> list[dict]:
    """Динамика занятости по датам."""
    return await DashboardService.get_occupancy_trend(
        db, date_from, date_to, warehouse_id, chamber_id
    )


@router.get("/sku-efficiency")
async def sku_efficiency(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    category: Optional[str] = Query(None, description="Фильтр по категории SKU"),
    sku_id: Optional[UUID] = Query(None, description="Фильтр по SKU"),
) -> list[dict]:
    """Эффективность SKU."""
    return await DashboardService.get_sku_efficiency(db, category, sku_id)


@router.get("/heatmap")
async def heatmap(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    warehouse_id: Optional[UUID] = Query(None, description="Фильтр по складу"),
) -> list[dict]:
    """Данные для heatmap камер."""
    return await DashboardService.get_heatmap(db, warehouse_id)


@router.get("/details")
async def details(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    date_from: Optional[date] = Query(None, description="Дата начала"),
    date_to: Optional[date] = Query(None, description="Дата конца"),
    warehouse_id: Optional[UUID] = Query(None),
    chamber_id: Optional[UUID] = Query(None),
    sku_id: Optional[UUID] = Query(None),
    location_status: Optional[str] = Query(None, description="Статус паллетоместа"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> list[dict]:
    """Детализация по камерам / SKU / датам."""
    return await DashboardService.get_details(
        db, date_from, date_to, warehouse_id, chamber_id,
        sku_id, location_status, limit, offset,
    )