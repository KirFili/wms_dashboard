"""
Сервис аудита — запись и чтение журнала действий.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditService:
    """Сервис аудита."""

    # ── Запись событий ─────────────────────────────

    @staticmethod
    async def log(
        db: AsyncSession,
        user_id: uuid.UUID,
        action: str,
        entity_type: str,
        entity_id: Optional[uuid.UUID] = None,
        payload: Optional[dict] = None,
    ) -> AuditLog:
        """Записать событие в аудит."""
        entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload or {},
            created_at=datetime.now(timezone.utc),
        )
        db.add(entry)
        await db.flush()
        return entry

    # ── Чтение журнала ─────────────────────────────

    @staticmethod
    async def list_logs(
        db: AsyncSession,
        user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[uuid.UUID] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[AuditLog], int]:
        """Получить список записей аудита с фильтрацией."""
        query = select(AuditLog)
        count_query = select(func.count(AuditLog.id))

        if user_id is not None:
            query = query.where(AuditLog.user_id == user_id)
            count_query = count_query.where(AuditLog.user_id == user_id)
        if action is not None:
            query = query.where(AuditLog.action == action)
            count_query = count_query.where(AuditLog.action == action)
        if entity_type is not None:
            query = query.where(AuditLog.entity_type == entity_type)
            count_query = count_query.where(AuditLog.entity_type == entity_type)
        if entity_id is not None:
            query = query.where(AuditLog.entity_id == entity_id)
            count_query = count_query.where(AuditLog.entity_id == entity_id)

        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
        result = await db.execute(query)
        items = list(result.scalars().all())

        return items, total
