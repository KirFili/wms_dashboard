"""
Pydantic-схемы для справочника паллетомест.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class PalletLocationCreate(BaseModel):
    """Создание паллетоместа."""

    chamber_id: UUID = Field(..., description="ID камеры")
    code: str = Field(..., min_length=1, max_length=50, description="Код паллетоместа")
    status: str = Field(default="free", max_length=20, description="Статус")
    is_blocked: bool = Field(default=False, description="Заблокировано")
    note: str | None = Field(None, description="Примечание")


class PalletLocationUpdate(BaseModel):
    """Обновление паллетоместа."""

    code: str | None = Field(None, min_length=1, max_length=50)
    status: str | None = Field(None, max_length=20)
    is_blocked: bool | None = None
    note: str | None = None


class PalletLocationResponse(BaseModel):
    """Ответ: данные паллетоместа."""

    id: UUID
    chamber_id: UUID
    code: str
    status: str
    is_blocked: bool
    last_modified: datetime | None = None
    note: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PalletLocationListResponse(BaseModel):
    """Ответ: список паллетомест."""

    items: list[PalletLocationResponse]
    total: int