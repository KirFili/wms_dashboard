"""
Pydantic-схемы для справочника SKU.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class SKUCreate(BaseModel):
    """Создание SKU."""

    sku_code: str = Field(..., min_length=1, max_length=100, description="Код SKU")
    sku_name: str = Field(..., min_length=1, max_length=500, description="Наименование")
    category: str | None = Field(None, max_length=100, description="Категория")
    unit: str = Field(default="pcs", max_length=20, description="Единица измерения")
    pallet_coeff: float | None = Field(None, gt=0, description="Коэффициент паллетизации")
    volume: float | None = Field(None, ge=0, description="Объём")
    is_active: bool = Field(default=True, description="Активен")


class SKUUpdate(BaseModel):
    """Обновление SKU."""

    sku_name: str | None = Field(None, min_length=1, max_length=500)
    category: str | None = Field(None, max_length=100)
    unit: str | None = Field(None, max_length=20)
    pallet_coeff: float | None = Field(None, gt=0)
    volume: float | None = Field(None, ge=0)
    is_active: bool | None = None


class SKUResponse(BaseModel):
    """Ответ: данные SKU."""

    id: UUID
    sku_code: str
    sku_name: str
    category: str | None = None
    unit: str
    pallet_coeff: float | None = None
    volume: float | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SKUListResponse(BaseModel):
    """Ответ: список SKU."""

    items: list[SKUResponse]
    total: int