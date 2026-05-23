"""
Модель PalletLocation — паллетоместо / ячейка внутри камеры.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    CheckConstraint,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.chamber import Chamber


class PalletLocation(Base):
    """Паллетоместо."""

    __tablename__ = "pallet_locations"
    __table_args__ = (
        UniqueConstraint("chamber_id", "code", name="uq_pallet_locations_chamber_code"),
        CheckConstraint("code <> ''", name="ch_pallet_locations_code"),
        CheckConstraint(
            "status IN ('free', 'occupied', 'blocked', 'unavailable')",
            name="ch_pallet_locations_status",
        ),
        Index("ix_pallet_locations_chamber_code", "chamber_id", "code"),
        Index("ix_pallet_locations_status", "status"),
        {"schema": "wms"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    chamber_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.chambers.id"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="free")
    is_blocked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_modified: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Связи
    chamber: Mapped["Chamber"] = relationship("Chamber", back_populates="pallet_locations")
    stock_snapshots = relationship("StockSnapshot", back_populates="pallet_location", lazy="raise")
    movement_facts = relationship("MovementFact", back_populates="pallet_location", lazy="raise")

    def __repr__(self) -> str:
        return f"<PalletLocation(id={self.id}, code='{self.code}', status='{self.status}')>"
