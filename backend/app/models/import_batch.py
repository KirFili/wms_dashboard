"""
Модель ImportBatch — загруженный XLSX-файл / пакет импорта.
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
    Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.import_row import ImportRow


class ImportBatch(Base):
    """Пакет импорта (XLSX-файл)."""

    __tablename__ = "import_batches"
    __table_args__ = (
        CheckConstraint(
            "import_type IN ('stock_snapshot', 'shipment', 'movement')",
            name="ch_import_batches_type",
        ),
        CheckConstraint(
            "status IN ('uploaded', 'parsed', 'validated', 'warning', 'error', 'imported', 'rolled_back')",
            name="ch_import_batches_status",
        ),
        CheckConstraint(
            "total_rows = success_rows + warning_rows + error_rows",
            name="ch_import_batches_rows",
        ),
        Index("ix_import_batches_status", "status"),
        Index("ix_import_batches_uploaded_at", "uploaded_at", postgresql_using="btree"),
        {"schema": "wms"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    import_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="uploaded")
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.users.id"), nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    validated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    imported_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    success_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warning_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Связи
    uploader: Mapped["User"] = relationship("User", back_populates="import_batches")
    rows: Mapped[list["ImportRow"]] = relationship(
        "ImportRow", back_populates="batch", lazy="raise", cascade="all, delete-orphan"
    )
    stock_snapshots = relationship(
        "StockSnapshot",
        back_populates="source_batch",
        lazy="raise",
        foreign_keys="StockSnapshot.source_batch_id",
    )
    shipment_facts = relationship(
        "ShipmentFact",
        back_populates="source_batch",
        lazy="raise",
        foreign_keys="ShipmentFact.source_batch_id",
    )
    movement_facts = relationship(
        "MovementFact",
        back_populates="source_batch",
        lazy="raise",
        foreign_keys="MovementFact.source_batch_id",
    )

    def __repr__(self) -> str:
        return f"<ImportBatch(id={self.id}, file='{self.file_name}', status='{self.status}')>"
