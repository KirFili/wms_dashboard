"""
Pydantic-схемы для журнала аудита.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class AuditLogResponse(BaseModel):
    """Ответ: запись аудита."""

    id: UUID
    user_id: UUID
    action: str
    entity_type: str
    entity_id: UUID | None = None
    payload: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    """Ответ: список записей аудита."""

    items: list[AuditLogResponse]
    total: int