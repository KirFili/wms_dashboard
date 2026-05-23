"""
Сервис dashboard — чтение агрегированных данных из materialized views
и формирование ответов для dashboard API.
"""

from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession


class DashboardService:
    """Сервис dashboard: сводки, графики, таблицы."""

    @staticmethod
    async def get_summary(
        db: AsyncSession,
        warehouse_id: Optional[UUID] = None,
    ) -> list[dict]:
        """Сводка KPI по складу из mv_dashboard_summary."""
        query = text("""
            SELECT * FROM wms.mv_dashboard_summary
            WHERE (:warehouse_id IS NULL OR warehouse_id = :warehouse_id)
        """)
        result = await db.execute(query, {"warehouse_id": warehouse_id})
        return [dict(row._mapping) for row in result.fetchall()]

    @staticmethod
    async def get_chambers_occupancy(
        db: AsyncSession,
        warehouse_id: Optional[UUID] = None,
        chamber_id: Optional[UUID] = None,
    ) -> list[dict]:
        """Заполненность по камерам из mv_chamber_occupancy."""
        query = text("""
            SELECT * FROM wms.mv_chamber_occupancy
            WHERE (:warehouse_id IS NULL OR warehouse_id = :warehouse_id)
              AND (:chamber_id IS NULL OR chamber_id = :chamber_id)
            ORDER BY occupancy_rate_pct DESC
        """)
        result = await db.execute(
            query, {"warehouse_id": warehouse_id, "chamber_id": chamber_id}
        )
        return [dict(row._mapping) for row in result.fetchall()]

    @staticmethod
    async def get_occupancy_trend(
        db: AsyncSession,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        warehouse_id: Optional[UUID] = None,
        chamber_id: Optional[UUID] = None,
    ) -> list[dict]:
        """Динамика занятости по датам из mv_occupancy_trend."""
        query = text("""
            SELECT * FROM wms.mv_occupancy_trend
            WHERE (:date_from IS NULL OR snapshot_date >= :date_from)
              AND (:date_to IS NULL OR snapshot_date <= :date_to)
              AND (:warehouse_id IS NULL OR warehouse_id = :warehouse_id)
              AND (:chamber_id IS NULL OR chamber_id = :chamber_id)
            ORDER BY snapshot_date
        """)
        result = await db.execute(
            query,
            {
                "date_from": date_from,
                "date_to": date_to,
                "warehouse_id": warehouse_id,
                "chamber_id": chamber_id,
            },
        )
        return [dict(row._mapping) for row in result.fetchall()]

    @staticmethod
    async def get_sku_efficiency(
        db: AsyncSession,
        category: Optional[str] = None,
        sku_id: Optional[UUID] = None,
    ) -> list[dict]:
        """Эффективность SKU из mv_sku_analytics."""
        query = text("""
            SELECT * FROM wms.mv_sku_analytics
            WHERE (:category IS NULL OR category = :category)
              AND (:sku_id IS NULL OR sku_id = :sku_id)
            ORDER BY turnover_efficiency DESC NULLS LAST
        """)
        result = await db.execute(
            query, {"category": category, "sku_id": sku_id}
        )
        return [dict(row._mapping) for row in result.fetchall()]

    @staticmethod
    async def get_heatmap(
        db: AsyncSession,
        warehouse_id: Optional[UUID] = None,
    ) -> list[dict]:
        """Данные для heatmap камер."""
        query = text("""
            SELECT
                chamber_id, chamber_code, chamber_name, zone,
                occupancy_rate_pct, occupied_locations, capacity_pallets
            FROM wms.mv_chamber_occupancy
            WHERE (:warehouse_id IS NULL OR warehouse_id = :warehouse_id)
            ORDER BY occupancy_rate_pct DESC
        """)
        result = await db.execute(query, {"warehouse_id": warehouse_id})
        return [dict(row._mapping) for row in result.fetchall()]

    @staticmethod
    async def get_details(
        db: AsyncSession,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        warehouse_id: Optional[UUID] = None,
        chamber_id: Optional[UUID] = None,
        sku_id: Optional[UUID] = None,
        location_status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        """Детализация по камерам / SKU / датам из сырых фактов."""
        query = text("""
            SELECT
                ss.snapshot_date,
                ch.code AS chamber_code,
                ch.name AS chamber_name,
                sk.sku_code,
                sk.sku_name,
                pl.code AS pallet_code,
                pl.status AS pallet_status,
                ss.occupied_locations,
                ss.occupied_volume,
                ss.natural_key
            FROM wms.stock_snapshots ss
            JOIN wms.chambers ch ON ch.id = ss.chamber_id
            JOIN wms.skus sk ON sk.id = ss.sku_id
            LEFT JOIN wms.pallet_locations pl ON pl.id = ss.pallet_location_id
            WHERE (:date_from IS NULL OR ss.snapshot_date >= :date_from)
              AND (:date_to IS NULL OR ss.snapshot_date <= :date_to)
              AND (:warehouse_id IS NULL OR ss.warehouse_id = :warehouse_id)
              AND (:chamber_id IS NULL OR ss.chamber_id = :chamber_id)
              AND (:sku_id IS NULL OR ss.sku_id = :sku_id)
              AND (:location_status IS NULL OR pl.status = :location_status)
            ORDER BY ss.snapshot_date DESC, ch.code, sk.sku_code
            LIMIT :limit OFFSET :offset
        """)
        result = await db.execute(
            query,
            {
                "date_from": date_from,
                "date_to": date_to,
                "warehouse_id": warehouse_id,
                "chamber_id": chamber_id,
                "sku_id": sku_id,
                "location_status": location_status,
                "limit": limit,
                "offset": offset,
            },
        )
        return [dict(row._mapping) for row in result.fetchall()]
