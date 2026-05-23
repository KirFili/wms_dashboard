"""
Pydantic-схемы для аналитики SKU.
"""

from pydantic import BaseModel, Field
from datetime import date, datetime
from uuid import UUID


class SKUAnalyticsResponse(BaseModel):
    """Аналитика по одному SKU."""

    sku_id: UUID
    sku_code: str
    sku_name: str
    category: str | None = None
    unit: str
    pallet_coeff: float | None = None
    current_occupied_locations: int = Field(..., description="Текущее число занятых мест")
    total_stored_volume: float = Field(..., description="Суммарный объём хранения")
    total_shipped_volume: float = Field(..., description="Суммарный объём отгрузок")
    total_shipped_qty: float = Field(..., description="Суммарное количество отгружено")
    storage_days: int = Field(..., description="Число дней хранения")
    turnover_efficiency: float | None = Field(None, description="Коэффициент оборачиваемости (A)")
    storage_load_ratio: float | None = Field(None, description="Коэффициент нагрузки (B)")

    model_config = {"from_attributes": True}


class SKUAnalyticsListResponse(BaseModel):
    """Ответ: список аналитики SKU."""

    items: list[SKUAnalyticsResponse]
    total: int


class SKUTrendItem(BaseModel):
    """Точка тренда SKU по датам."""

    snapshot_date: date
    occupied_locations: int
    occupied_volume: float | None = None
    free_locations: int


class SKUShipmentItem(BaseModel):
    """Отгрузка SKU."""

    shipment_date: date
    shipped_qty: float
    shipped_volume: float | None = None
    document_number: str | None = None


class SKULocationItem(BaseModel):
    """Паллетоместо, занятое SKU."""

    pallet_location_id: UUID
    pallet_code: str
    chamber_code: str
    chamber_name: str
    pallet_status: str
