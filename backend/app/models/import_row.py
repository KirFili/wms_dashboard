"""
Модель ImportRow — одна строка staging-импорта.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.import_batch import ImportBatch


class ImportRow(Base):
    """Строка импорта."""

    __tablename__ = "import_rows"
    __table_args__ = (
        UniqueConstraint("batch_id", "row_number", name="uq_import_rows_batch_row"),
        CheckConstraint("row_number >= 0", name="ch_import_rows_row_number"),
        CheckConstraint(
            "validation_status IN ('pending', 'valid', 'warning', 'error')",
            name="ch_import_rows_validation_status",
        ),
        Index("ix_import_rows_batch_status", "batch_id", "validation_status"),
        {"schema": "wms"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.import_batches.id"), nullable=False
    )
    row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    raw_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    mapped_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    validation_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )
    error_messages: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    natural_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Связи
    batch: Mapped["ImportBatch"] = relationship("ImportBatch", back_populates="rows")

    def __repr__(self) -> str:
        return f"<ImportRow(batch={self.batch_id}, row={self.row_number}, status='{self.validation_status}')>"