"""
Pydantic-схемы для модуля импорта.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional


class ImportBatchResponse(BaseModel):
    """Ответ: пакет импорта."""

    id: UUID
    file_name: str
    import_type: str
    status: str
    uploaded_by: UUID
    uploaded_at: datetime
    validated_at: datetime | None = None
    imported_at: datetime | None = None
    total_rows: int
    success_rows: int
    warning_rows: int
    error_rows: int
    checksum: str | None = None
    meta: dict | None = None

    model_config = {"from_attributes": True}


class ImportBatchListResponse(BaseModel):
    """Ответ: список пакетов импорта."""

    items: list[ImportBatchResponse]
    total: int


class ImportRowResponse(BaseModel):
    """Ответ: строка импорта."""

    id: UUID
    batch_id: UUID
    row_number: int
    raw_data: dict | None = None
    mapped_data: dict | None = None
    validation_status: str
    error_messages: dict | None = None
    natural_key: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ImportRowListResponse(BaseModel):
    """Ответ: список строк импорта."""

    items: list[ImportRowResponse]
    total: int