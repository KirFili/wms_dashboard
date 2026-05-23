"""
Сервис обновления materialized views.
Вызывается после успешного импорта.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class AggregateService:
    """Сервис для работы с materialized views."""

    @staticmethod
    async def refresh_all(db: AsyncSession) -> None:
        """Обновить все materialized views параллельно."""
        views = [
            "wms.mv_dashboard_summary",
            "wms.mv_chamber_occupancy",
            "wms.mv_occupancy_trend",
            "wms.mv_sku_analytics",
        ]
        for view in views:
            await db.execute(text(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view}"))

    @staticmethod
    async def refresh_dashboard_summary(db: AsyncSession) -> None:
        """Обновить mv_dashboard_summary."""
        await db.execute(
            text("REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_dashboard_summary")
        )

    @staticmethod
    async def refresh_chamber_occupancy(db: AsyncSession) -> None:
        """Обновить mv_chamber_occupancy."""
        await db.execute(
            text("REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_chamber_occupancy")
        )

    @staticmethod
    async def refresh_occupancy_trend(db: AsyncSession) -> None:
        """Обновить mv_occupancy_trend."""
        await db.execute(
            text("REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_occupancy_trend")
        )

    @staticmethod
    async def refresh_sku_analytics(db: AsyncSession) -> None:
        """Обновить mv_sku_analytics."""
        await db.execute(
            text("REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_sku_analytics")
        )
