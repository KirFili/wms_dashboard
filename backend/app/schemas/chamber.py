"""
Pydantic-схемы для справочника камер хранения.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class ChamberCreate(BaseModel):
    """Создание камеры."""

    warehouse_id: UUID = Field(..., description="ID склада")
    code: str = Field(..., min_length=1, max_length=50, description="Код камеры")
    name: str = Field(..., min_length=1, max_length=255, description="Наименование")
    chamber_type: str = Field(default="standard", max_length=50, description="Тип камеры")
    capacity_pallets: int = Field(..., ge=0, description="Ёмкость (паллетомест)")
    zone: str | None = Field(None, max_length=100, description="Зона хранения")
    temperature_mode: str | None = Field(None, max_length=50, description="Температурный режим")
    is_active: bool = Field(default=True, description="Активна")


class ChamberUpdate(BaseModel):
    """Обновление камеры."""

    code: str | None = Field(None, min_length=1, max_length=50)
    name: str | None = Field(None, min_length=1, max_length=255)
    chamber_type: str | None = Field(None, max_length=50)
    capacity_pallets: int | None = Field(None, ge=0)
    zone: str | None = Field(None, max_length=100)
    temperature_mode: str | None = Field(None, max_length=50)
    is_active: bool | None = None


class ChamberResponse(BaseModel):
    """Ответ: данные камеры."""

    id: UUID
    warehouse_id: UUID
    code: str
    name: str
    chamber_type: str
    capacity_pallets: int
    zone: str | None = None
    temperature_mode: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChamberListResponse(BaseModel):
    """Ответ: список камер."""

    items: list[ChamberResponse]
    total: int
