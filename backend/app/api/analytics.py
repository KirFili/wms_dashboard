"""
Роутер аналитики SKU: /api/analytics/sku/*
"""

import uuid
from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.sku import SKU
from app.services.kpi_service import KPIService

router = APIRouter(prefix="/api/analytics/sku", tags=["analytics"])


@router.get("")
async def get_sku_analytics(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    date_from: Optional[date] = Query(None, description="Дата начала периода"),
    date_to: Optional[date] = Query(None, description="Дата конца периода"),
    category: Optional[str] = Query(None, description="Категория SKU"),
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Склад"),
    sort_by: str = Query("turnover_efficiency", description="Поле сортировки"),
    sort_desc: bool = Query(True, description="По убыванию"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> list[dict]:
    """Аналитика по всем SKU: занятость, отгрузки, эффективность."""

    params: dict = {"limit": limit, "offset": offset}

    # Строим условия для stock_snapshots
    stock_filters: list[str] = []
    if date_from:
        stock_filters.append("ss.snapshot_date >= :stock_date_from")
        params["stock_date_from"] = date_from
    if date_to:
        stock_filters.append("ss.snapshot_date <= :stock_date_to")
        params["stock_date_to"] = date_to
    if warehouse_id:
        stock_filters.append("ss.warehouse_id = :stock_warehouse_id")
        params["stock_warehouse_id"] = warehouse_id

    stock_filter_str = " AND ".join(stock_filters) if stock_filters else "TRUE"

    # Строим условия для shipment_facts
    ship_filters: list[str] = []
    if date_from:
        ship_filters.append("sf.shipment_date >= :ship_date_from")
        params["ship_date_from"] = date_from
    if date_to:
        ship_filters.append("sf.shipment_date <= :ship_date_to")
        params["ship_date_to"] = date_to
    if warehouse_id:
        ship_filters.append("sf.warehouse_id = :ship_warehouse_id")
        params["ship_warehouse_id"] = warehouse_id

    ship_filter_str = " AND ".join(ship_filters) if ship_filters else "TRUE"

    # SKU фильтры
    sku_filters: list[str] = ["sk.is_active = TRUE"]
    if category:
        sku_filters.append("sk.category = :category")
        params["category"] = category
    sku_filter_str = " AND ".join(sku_filters)

    sql = f"""
        SELECT
            sk.id AS sku_id,
            sk.sku_code,
            sk.sku_name,
            sk.category,
            sk.unit,
            sk.pallet_coeff,
            COALESCE(st.occupied_sum, 0) AS total_occupied_sum,
            COALESCE(st.avg_occupied, 0) AS avg_occupied_locations,
            COALESCE(st.max_occupied, 0) AS max_occupied_locations,
            COALESCE(st.total_volume, 0) AS total_stored_volume,
            COALESCE(st.storage_days, 0) AS storage_days,
            COALESCE(ship.shipped_qty_total, 0) AS total_shipped_qty,
            COALESCE(ship.shipped_vol_total, 0) AS total_shipped_volume,
            COALESCE(cur.current_occ, 0) AS current_occupied_locations
        FROM wms.skus sk
        LEFT JOIN LATERAL (
            SELECT
                SUM(ss2.occupied_locations) AS occupied_sum,
                AVG(ss2.occupied_locations) AS avg_occupied,
                MAX(ss2.occupied_locations) AS max_occupied,
                SUM(ss2.occupied_volume) AS total_volume,
                COUNT(DISTINCT ss2.snapshot_date) AS storage_days
            FROM wms.stock_snapshots ss2
            WHERE ss2.sku_id = sk.id AND ({stock_filter_str})
        ) st ON TRUE
        LEFT JOIN LATERAL (
            SELECT
                SUM(sf.shipped_qty) AS shipped_qty_total,
                SUM(sf.shipped_volume) AS shipped_vol_total
            FROM wms.shipment_facts sf
            WHERE sf.sku_id = sk.id AND ({ship_filter_str})
        ) ship ON TRUE
        LEFT JOIN LATERAL (
            SELECT SUM(ss3.occupied_locations) AS current_occ
            FROM wms.stock_snapshots ss3
            WHERE ss3.sku_id = sk.id
              AND ss3.snapshot_date = (SELECT MAX(snapshot_date) FROM wms.stock_snapshots ss4 WHERE ss4.sku_id = sk.id)
        ) cur ON TRUE
        WHERE {sku_filter_str}
        ORDER BY
            total_shipped_volume DESC NULLS LAST
        LIMIT :limit OFFSET :offset
    """

    result = await db.execute(text(sql), params)

    rows = result.fetchall()
    items = []
    for row in rows:
        d = dict(row._mapping)
        avg_occ_vol = (
            float(d["total_stored_volume"] or 0) / d["storage_days"]
            if d["storage_days"] > 0
            else 0.0
        )
        d["turnover_efficiency"] = KPIService.turnover_efficiency(
            float(d["total_shipped_volume"] or 0), avg_occ_vol
        )
        d["storage_load_ratio"] = KPIService.storage_load_ratio(
            float(d["avg_occupied_locations"] or 0), float(d["total_shipped_qty"] or 0)
        )
        items.append(d)

    return items


@router.get("/{sku_id}")
async def get_sku_detail(
    sku_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
) -> dict:
    """Детальная аналитика одного SKU: тренд, отгрузки, занятые паллетоместа."""

    result = await db.execute(select(SKU).where(SKU.id == sku_id))
    sku = result.scalar_one_or_none()
    if not sku:
        return {"error": "SKU not found"}

    # Тренд занятости
    trend_params: dict = {"sku_id": sku_id}
    trend_conds: list[str] = ["sku_id = :sku_id"]
    if date_from:
        trend_conds.append("snapshot_date >= :date_from")
        trend_params["date_from"] = date_from
    if date_to:
        trend_conds.append("snapshot_date <= :date_to")
        trend_params["date_to"] = date_to

    trend_result = await db.execute(
        text(f"""
            SELECT
                snapshot_date,
                SUM(occupied_locations) AS occupied_locations,
                SUM(occupied_volume) AS occupied_volume
            FROM wms.stock_snapshots
            WHERE {' AND '.join(trend_conds)}
            GROUP BY snapshot_date
            ORDER BY snapshot_date
        """),
        trend_params,
    )
    trend = [dict(row._mapping) for row in trend_result.fetchall()]

    # Отгрузки
    ship_params: dict = {"sku_id": sku_id}
    ship_conds: list[str] = ["sku_id = :sku_id"]
    if date_from:
        ship_conds.append("shipment_date >= :ship_date_from")
        ship_params["ship_date_from"] = date_from
    if date_to:
        ship_conds.append("shipment_date <= :ship_date_to")
        ship_params["ship_date_to"] = date_to

    ship_result = await db.execute(
        text(f"""
            SELECT
                shipment_date,
                shipped_qty,
                shipped_volume,
                document_number
            FROM wms.shipment_facts
            WHERE {' AND '.join(ship_conds)}
            ORDER BY shipment_date
        """),
        ship_params,
    )
    shipments = [dict(row._mapping) for row in ship_result.fetchall()]

    # Занятые паллетоместа (последний snapshot)
    loc_result = await db.execute(
        text("""
            SELECT
                pl.id AS pallet_location_id,
                pl.code AS pallet_code,
                ch.code AS chamber_code,
                ch.name AS chamber_name,
                pl.status AS pallet_status
            FROM wms.stock_snapshots ss
            JOIN wms.pallet_locations pl ON pl.id = ss.pallet_location_id
            JOIN wms.chambers ch ON ch.id = pl.chamber_id
            WHERE ss.sku_id = :sku_id
              AND ss.snapshot_date = (
                  SELECT MAX(snapshot_date) FROM wms.stock_snapshots ss2 WHERE ss2.sku_id = :sku_id
              )
            GROUP BY pl.id, pl.code, ch.code, ch.name, pl.status
        """),
        {"sku_id": sku_id},
    )
    locations = [dict(row._mapping) for row in loc_result.fetchall()]

    # KPI
    total_stored = sum(t.get("occupied_volume") or 0 for t in trend)
    total_shipped = sum(s.get("shipped_volume") or 0 for s in shipments)
    total_shipped_qty = sum(s.get("shipped_qty") or 0 for s in shipments)
    storage_days = len(trend)
    avg_occ = (
        sum(t.get("occupied_locations", 0) for t in trend) / max(storage_days, 1)
    )

    return {
        "sku_id": str(sku.id),
        "sku_code": sku.sku_code,
        "sku_name": sku.sku_name,
        "category": sku.category,
        "unit": sku.unit,
        "pallet_coeff": float(sku.pallet_coeff) if sku.pallet_coeff else None,
        "current_occupied_locations": trend[-1]["occupied_locations"] if trend else 0,
        "total_stored_volume": total_stored,
        "total_shipped_volume": total_shipped,
        "total_shipped_qty": total_shipped_qty,
        "storage_days": storage_days,
        "avg_occupied_locations": round(avg_occ, 2),
        "turnover_efficiency": KPIService.turnover_efficiency(total_shipped, avg_occ),
        "storage_load_ratio": KPIService.storage_load_ratio(
            avg_occ, total_shipped_qty
        ),
        "trend": trend,
        "shipments": shipments,
        "occupied_locations": locations,
    }