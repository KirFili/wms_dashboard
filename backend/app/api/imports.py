"""
Роутер импорта XLSX: /api/imports/*
Endpoints: upload, parse, validate, commit, rollback, list, detail, rows
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
    Form,
    status,
)
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_role
from app.config import settings
from app.models.user import User
from app.models.import_batch import ImportBatch
from app.models.import_row import ImportRow
from app.schemas.import_ import (
    ImportBatchResponse,
    ImportBatchListResponse,
    ImportRowResponse,
    ImportRowListResponse,
)
from app.services.import_service import ImportService
from app.services.audit_service import AuditService
from app.services.aggregate_service import AggregateService

router = APIRouter(prefix="/api/imports", tags=["imports"])


# ═══════════════════════════════════════════════
# Upload
# ═══════════════════════════════════════════════

@router.post("/upload", response_model=ImportBatchResponse, status_code=201)
async def upload_file(
    file: Annotated[UploadFile, File(description="XLSX-файл из 1С")],
    import_type: Annotated[str, Form(description="Тип: stock_snapshot, shipment, movement")],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> ImportBatchResponse:
    """Загрузка XLSX-файла. Создаёт ImportBatch со статусом uploaded."""

    if import_type not in ("stock_snapshot", "shipment", "movement"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid import_type: {import_type}",
        )

    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files allowed")

    # Сохранить файл на диск
    os.makedirs(settings.upload_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.upload_dir, safe_name)

    contents = await file.read()
    if len(contents) > settings.max_upload_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max {settings.max_upload_size_mb}MB",
        )

    with open(file_path, "wb") as f:
        f.write(contents)

    checksum = ImportService.compute_checksum(file_path)

    batch = ImportBatch(
        file_name=file.filename,
        import_type=import_type,
        status="uploaded",
        uploaded_by=current_user.id,
        uploaded_at=datetime.now(timezone.utc),
        checksum=checksum,
        meta={"file_path": file_path, "file_size": len(contents)},
    )
    db.add(batch)
    await db.flush()

    await AuditService.log(
        db, current_user.id, "import_start", "import_batch", batch.id,
        {"file_name": file.filename, "import_type": import_type},
    )

    return ImportBatchResponse.model_validate(batch)


# ═══════════════════════════════════════════════
# Parse
# ═══════════════════════════════════════════════

@router.post("/{batch_id}/parse", response_model=ImportBatchResponse)
async def parse_batch(
    batch_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> ImportBatchResponse:
    """Парсинг XLSX: чтение листов, mapping колонок, запись ImportRow."""

    result = await db.execute(select(ImportBatch).where(ImportBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Import batch not found")
    if batch.status != "uploaded":
        raise HTTPException(
            status_code=400, detail=f"Cannot parse batch in status '{batch.status}'"
        )

    file_path = (batch.meta or {}).get("file_path", "")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="File not found on disk")

    batch = await ImportService.parse_xlsx(db, batch, file_path)
    return ImportBatchResponse.model_validate(batch)


# ═══════════════════════════════════════════════
# Validate
# ═══════════════════════════════════════════════

@router.post("/{batch_id}/validate", response_model=ImportBatchResponse)
async def validate_batch(
    batch_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> ImportBatchResponse:
    """Валидация строк импорта: проверка типов, существования SKU/камер, дедупликация."""

    result = await db.execute(select(ImportBatch).where(ImportBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Import batch not found")
    if batch.status not in ("parsed", "validated", "warning", "error"):
        raise HTTPException(
            status_code=400, detail=f"Cannot validate batch in status '{batch.status}'"
        )

    batch = await ImportService.validate_batch(db, batch)
    return ImportBatchResponse.model_validate(batch)


# ═══════════════════════════════════════════════
# Commit
# ═══════════════════════════════════════════════

@router.post("/{batch_id}/commit", response_model=ImportBatchResponse)
async def commit_batch(
    batch_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> ImportBatchResponse:
    """Запись валидных строк в production-таблицы (upsert). Обновление materialized views."""

    result = await db.execute(select(ImportBatch).where(ImportBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Import batch not found")

    batch = await ImportService.commit_batch(db, batch)

    await AuditService.log(
        db, current_user.id, "import_commit", "import_batch", batch.id,
        {"success_rows": batch.success_rows, "total_rows": batch.total_rows},
    )

    # Обновить агрегаты
    try:
        await AggregateService.refresh_all(db)
    except Exception:
        pass  # Materialized views могут не существовать — игнорируем

    return ImportBatchResponse.model_validate(batch)


# ═══════════════════════════════════════════════
# Rollback
# ═══════════════════════════════════════════════

@router.post("/{batch_id}/rollback", response_model=ImportBatchResponse)
async def rollback_batch(
    batch_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("admin"))],
) -> ImportBatchResponse:
    """Откат импорта: удаление данных из production-таблиц."""

    result = await db.execute(select(ImportBatch).where(ImportBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Import batch not found")

    batch = await ImportService.rollback_batch(db, batch)

    await AuditService.log(
        db, current_user.id, "import_rollback", "import_batch", batch.id
    )

    try:
        await AggregateService.refresh_all(db)
    except Exception:
        pass

    return ImportBatchResponse.model_validate(batch)


# ═══════════════════════════════════════════════
# List & Detail
# ═══════════════════════════════════════════════

@router.get("", response_model=ImportBatchListResponse)
async def list_batches(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status_filter: Optional[str] = Query(None, alias="status"),
    import_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> ImportBatchListResponse:
    """Список пакетов импорта."""
    query = select(ImportBatch)
    count_q = select(func.count(ImportBatch.id))

    if status_filter is not None:
        query = query.where(ImportBatch.status == status_filter)
        count_q = count_q.where(ImportBatch.status == status_filter)
    if import_type is not None:
        query = query.where(ImportBatch.import_type == import_type)
        count_q = count_q.where(ImportBatch.import_type == import_type)

    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    result = await db.execute(
        query.order_by(ImportBatch.uploaded_at.desc()).offset(skip).limit(limit)
    )
    items = [ImportBatchResponse.model_validate(b) for b in result.scalars().all()]
    return ImportBatchListResponse(items=items, total=total)


@router.get("/{batch_id}", response_model=ImportBatchResponse)
async def get_batch(
    batch_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ImportBatchResponse:
    """Детали пакета импорта."""
    result = await db.execute(select(ImportBatch).where(ImportBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Import batch not found")
    return ImportBatchResponse.model_validate(batch)


# ═══════════════════════════════════════════════
# Rows
# ═══════════════════════════════════════════════

@router.get("/{batch_id}/rows", response_model=ImportRowListResponse)
async def list_import_rows(
    batch_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    validation_status: Optional[str] = Query(None, description="Фильтр: pending, valid, warning, error"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=2000),
) -> ImportRowListResponse:
    """Строки импорта (preview)."""
    query = select(ImportRow).where(ImportRow.batch_id == batch_id)
    count_q = select(func.count(ImportRow.id)).where(ImportRow.batch_id == batch_id)

    if validation_status is not None:
        query = query.where(ImportRow.validation_status == validation_status)
        count_q = count_q.where(ImportRow.validation_status == validation_status)

    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    result = await db.execute(
        query.order_by(ImportRow.row_number).offset(skip).limit(limit)
    )
    items = [ImportRowResponse.model_validate(r) for r in result.scalars().all()]
    return ImportRowListResponse(items=items, total=total)
