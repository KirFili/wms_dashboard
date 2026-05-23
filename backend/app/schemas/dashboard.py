"""
Pydantic-схемы для dashboard API.
"""

from pydantic import BaseModel, Field
from datetime import date, datetime
from uuid import UUID
from typing import Optional


class DashboardSummary(BaseModel):
    """Сводка KPI по складу."""

    warehouse_id: UUID
    warehouse_code: str
    warehouse_name: str
    total_active_locations: int = Field(..., description="Всего активных паллетомест")
    free_locations: int = Field(..., description="Свободные паллетоместа")
    occupied_locations: int = Field(..., description="Занятые паллетоместа")
    blocked_locations: int = Field(..., description="Заблокированные паллетоместа")
    unavailable_locations: int = Field(..., description="Недоступные паллетоместа")
    active_sku_count: int = Field(..., description="Число активных SKU")
    occupancy_rate_pct: float = Field(..., description="Процент заполненности, %")
    last_snapshot_date: date | None = Field(None, description="Дата последнего снимка")
    last_import_at: datetime | None = Field(None, description="Дата последнего импорта")


class ChamberOccupancyItem(BaseModel):
    """Заполненность одной камеры."""

    chamber_id: UUID
    warehouse_id: UUID
    chamber_code: str
    chamber_name: str
    chamber_type: str
    zone: str | None = None
    capacity_pallets: int
    total_locations: int
    free_locations: int
    occupied_locations: int
    blocked_locations: int
    unavailable_locations: int
    occupancy_rate_pct: float
    distinct_sku_count: int


class OccupancyTrendItem(BaseModel):
    """Точка динамики занятости по датам."""

    snapshot_date: date
    warehouse_id: UUID
    chamber_id: UUID
    occupied_locations: int
    free_locations: int
    active_sku_count: int
    total_occupied_volume: float | None = None


class SkuEfficiencyItem(BaseModel):
    """Эффективность SKU."""

    sku_id: UUID
    sku_code: str
    sku_name: str
    category: str | None = None
    current_occupied_locations: int
    total_stored_volume: float
    total_shipped_volume: float
    total_shipped_qty: float
    storage_days: int
    turnover_efficiency: float | None = None
    storage_load_ratio: float | None = None


class HeatmapItem(BaseModel):
    """Данные для heatmap камер."""

    chamber_id: UUID
    chamber_code: str
    chamber_name: str
    zone: str | None = None
    occupancy_rate_pct: float
    occupied_locations: int
    capacity_pallets: int


class DetailItem(BaseModel):
    """Строка детализации: камера / SKU / дата."""

    snapshot_date: date | None = None
    chamber_code: str | None = None
    chamber_name: str | None = None
    sku_code: str | None = None
    sku_name: str | None = None
    pallet_code: str | None = None
    pallet_status: str | None = None
    occupied_locations: int | None = None
    occupied_volume: float | None = None
    natural_key: str | None = None