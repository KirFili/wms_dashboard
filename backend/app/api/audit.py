"""
Роутер аудита: /api/audit-logs/*
"""

import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse, AuditLogListResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/audit-logs", tags=["audit"])


@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    user_id: Optional[uuid.UUID] = Query(None, description="Фильтр по пользователю"),
    action: Optional[str] = Query(None, description="Фильтр по действию"),
    entity_type: Optional[str] = Query(None, description="Фильтр по типу сущности"),
    entity_id: Optional[uuid.UUID] = Query(None, description="Фильтр по ID сущности"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> AuditLogListResponse:
    """Список записей аудита с фильтрацией."""
    items, total = await AuditService.list_logs(
        db, user_id, action, entity_type, entity_id, limit, offset
    )
    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(item) for item in items],
        total=total,
    )
