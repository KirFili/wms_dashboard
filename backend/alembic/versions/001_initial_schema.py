"""
Первичная миграция: полный DDL схемы wms.
Включает: 11 таблиц, все индексы, FK, check constraints,
4 materialized views, триггеры updated_at, seed-данные.

Revision ID: 001
Revises: None
Create Date: 2026-05-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Создание схемы wms, таблиц, индексов, MV, триггеров, seed-данных."""

    # ── 2.0 Схема и расширения ──
    op.execute("CREATE SCHEMA IF NOT EXISTS wms")
    op.execute("SET search_path TO wms")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # ── 2.1 warehouses ──
    op.create_table(
        "warehouses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.UniqueConstraint("code", name="uq_warehouses_code"),
        sa.CheckConstraint("code <> ''", name="ch_warehouses_code"),
        schema="wms",
    )

    # ── 2.2 chambers ──
    op.create_table(
        "chambers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("warehouse_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("chamber_type", sa.String(50), nullable=False, server_default=sa.text("'standard'")),
        sa.Column("capacity_pallets", sa.Integer(), nullable=False),
        sa.Column("zone", sa.String(100), nullable=True),
        sa.Column("temperature_mode", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["warehouse_id"], ["wms.warehouses.id"],
                                name="fk_chambers_warehouse", ondelete="RESTRICT"),
        sa.UniqueConstraint("warehouse_id", "code", name="uq_chambers_warehouse_code"),
        sa.CheckConstraint("code <> ''", name="ch_chambers_code"),
        sa.CheckConstraint("capacity_pallets >= 0", name="ch_chambers_capacity"),
        schema="wms",
    )
    op.create_index("ix_chambers_warehouse_code", "chambers", ["warehouse_id", "code"], schema="wms")

    # ── 2.3 pallet_locations ──
    op.create_table(
        "pallet_locations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("chamber_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'free'")),
        sa.Column("is_blocked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("last_modified", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["chamber_id"], ["wms.chambers.id"],
                                name="fk_pallet_locations_chamber", ondelete="RESTRICT"),
        sa.UniqueConstraint("chamber_id", "code", name="uq_pallet_locations_chamber_code"),
        sa.CheckConstraint("code <> ''", name="ch_pallet_locations_code"),
        sa.CheckConstraint(
            "status IN ('free', 'occupied', 'blocked', 'unavailable')",
            name="ch_pallet_locations_status",
        ),
        schema="wms",
    )
    op.create_index("ix_pallet_locations_chamber_code", "pallet_locations", ["chamber_id", "code"], schema="wms")
    op.create_index("ix_pallet_locations_status", "pallet_locations", ["status"], schema="wms")

    # ── 2.4 skus ──
    op.create_table(
        "skus",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("sku_code", sa.String(100), nullable=False),
        sa.Column("sku_name", sa.String(500), nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("unit", sa.String(20), nullable=False, server_default=sa.text("'pcs'")),
        sa.Column("pallet_coeff", sa.Numeric(12, 4), nullable=True),
        sa.Column("volume", sa.Numeric(12, 4), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.UniqueConstraint("sku_code", name="uq_skus_sku_code"),
        sa.CheckConstraint("sku_code <> ''", name="ch_skus_sku_code"),
        sa.CheckConstraint("pallet_coeff IS NULL OR pallet_coeff > 0", name="ch_skus_pallet_coeff"),
        schema="wms",
    )
    op.create_index("ix_skus_sku_code", "skus", ["sku_code"], unique=True, schema="wms")

    # ── 2.5 users ──
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default=sa.text("'viewer'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.UniqueConstraint("username", name="uq_users_username"),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.CheckConstraint("role IN ('viewer', 'analyst', 'admin')", name="ch_users_role"),
        sa.CheckConstraint("username <> ''", name="ch_users_username"),
        schema="wms",
    )

    # ── 2.6 import_batches (создаётся до факт-таблиц, т.к. они ссылаются на неё) ──
    op.create_table(
        "import_batches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("file_name", sa.String(500), nullable=False),
        sa.Column("import_type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'uploaded'")),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("imported_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_rows", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("success_rows", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("warning_rows", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("error_rows", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("checksum", sa.String(64), nullable=True),
        sa.Column("meta", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["uploaded_by"], ["wms.users.id"],
                                name="fk_import_batches_user", ondelete="RESTRICT"),
        sa.CheckConstraint(
            "import_type IN ('stock_snapshot', 'shipment', 'movement')",
            name="ch_import_batches_type",
        ),
        sa.CheckConstraint(
            "status IN ('uploaded', 'parsed', 'validated', 'warning', 'error', 'imported', 'rolled_back')",
            name="ch_import_batches_status",
        ),
        sa.CheckConstraint(
            "total_rows = success_rows + warning_rows + error_rows",
            name="ch_import_batches_rows",
        ),
        schema="wms",
    )
    op.create_index("ix_import_batches_status", "import_batches", ["status"], schema="wms")
    op.create_index("ix_import_batches_uploaded_at", "import_batches", ["uploaded_at"], schema="wms")

    # ── 2.7 import_rows ──
    op.create_table(
        "import_rows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("row_number", sa.Integer(), nullable=False),
        sa.Column("raw_data", postgresql.JSONB(), nullable=True),
        sa.Column("mapped_data", postgresql.JSONB(), nullable=True),
        sa.Column("validation_status", sa.String(20), nullable=False,
                  server_default=sa.text("'pending'")),
        sa.Column("error_messages", postgresql.JSONB(), nullable=True),
        sa.Column("natural_key", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["batch_id"], ["wms.import_batches.id"],
                                name="fk_import_rows_batch", ondelete="CASCADE"),
        sa.UniqueConstraint("batch_id", "row_number", name="uq_import_rows_batch_row"),
        sa.CheckConstraint("row_number >= 0", name="ch_import_rows_row_number"),
        sa.CheckConstraint(
            "validation_status IN ('pending', 'valid', 'warning', 'error')",
            name="ch_import_rows_validation_status",
        ),
        schema="wms",
    )
    op.create_index("ix_import_rows_batch_status", "import_rows", ["batch_id", "validation_status"], schema="wms")

    # ── 2.8 stock_snapshots ──
    op.create_table(
        "stock_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("snapshot_date", sa.Date(), nullable=False),
        sa.Column("warehouse_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chamber_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pallet_location_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("sku_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("occupied_locations", sa.Integer(), nullable=False),
        sa.Column("occupied_volume", sa.Numeric(14, 4), nullable=True),
        sa.Column("source_batch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("natural_key", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["warehouse_id"], ["wms.warehouses.id"],
                                name="fk_stock_snapshots_warehouse", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["chamber_id"], ["wms.chambers.id"],
                                name="fk_stock_snapshots_chamber", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["pallet_location_id"], ["wms.pallet_locations.id"],
                                name="fk_stock_snapshots_location", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["sku_id"], ["wms.skus.id"],
                                name="fk_stock_snapshots_sku", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_batch_id"], ["wms.import_batches.id"],
                                name="fk_stock_snapshots_batch", ondelete="RESTRICT"),
        sa.UniqueConstraint("natural_key", name="uq_stock_snapshots_natural_key"),
        sa.CheckConstraint("occupied_locations >= 0", name="ch_stock_snapshots_occupied_locations"),
        schema="wms",
    )
    op.create_index("ix_stock_snapshots_date_chamber", "stock_snapshots",
                    ["snapshot_date", "chamber_id"], schema="wms")
    op.create_index("ix_stock_snapshots_date_sku", "stock_snapshots",
                    ["snapshot_date", "sku_id"], schema="wms")
    op.create_index("ix_stock_snapshots_warehouse_date", "stock_snapshots",
                    ["warehouse_id", "snapshot_date"], schema="wms")
    op.create_index("ix_stock_snapshots_batch", "stock_snapshots",
                    ["source_batch_id"], schema="wms")

    # ── 2.9 shipment_facts ──
    op.create_table(
        "shipment_facts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("shipment_date", sa.Date(), nullable=False),
        sa.Column("warehouse_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sku_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("shipped_qty", sa.Numeric(14, 4), nullable=False),
        sa.Column("shipped_volume", sa.Numeric(14, 4), nullable=True),
        sa.Column("document_number", sa.String(200), nullable=True),
        sa.Column("source_batch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("natural_key", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["warehouse_id"], ["wms.warehouses.id"],
                                name="fk_shipment_facts_warehouse", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["sku_id"], ["wms.skus.id"],
                                name="fk_shipment_facts_sku", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_batch_id"], ["wms.import_batches.id"],
                                name="fk_shipment_facts_batch", ondelete="RESTRICT"),
        sa.UniqueConstraint("natural_key", name="uq_shipment_facts_natural_key"),
        sa.CheckConstraint("shipped_qty >= 0", name="ch_shipment_facts_qty"),
        schema="wms",
    )
    op.create_index("ix_shipment_facts_date_sku", "shipment_facts",
                    ["shipment_date", "sku_id"], schema="wms")
    op.create_index("ix_shipment_facts_warehouse_date", "shipment_facts",
                    ["warehouse_id", "shipment_date"], schema="wms")
    op.create_index("ix_shipment_facts_batch", "shipment_facts",
                    ["source_batch_id"], schema="wms")

    # ── 2.10 movement_facts ──
    op.create_table(
        "movement_facts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("operation_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("warehouse_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chamber_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pallet_location_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("sku_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("operation_type", sa.String(50), nullable=False),
        sa.Column("qty", sa.Numeric(14, 4), nullable=True),
        sa.Column("volume", sa.Numeric(14, 4), nullable=True),
        sa.Column("source_batch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("natural_key", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["warehouse_id"], ["wms.warehouses.id"],
                                name="fk_movement_facts_warehouse", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["chamber_id"], ["wms.chambers.id"],
                                name="fk_movement_facts_chamber", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["pallet_location_id"], ["wms.pallet_locations.id"],
                                name="fk_movement_facts_location", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["sku_id"], ["wms.skus.id"],
                                name="fk_movement_facts_sku", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_batch_id"], ["wms.import_batches.id"],
                                name="fk_movement_facts_batch", ondelete="RESTRICT"),
        sa.UniqueConstraint("natural_key", name="uq_movement_facts_natural_key"),
        sa.CheckConstraint(
            "operation_type IN ('placement', 'relocation', 'release', 'adjustment', 'other')",
            name="ch_movement_facts_type",
        ),
        schema="wms",
    )
    op.create_index("ix_movement_facts_datetime_chamber", "movement_facts",
                    ["operation_datetime", "chamber_id"], schema="wms")
    op.create_index("ix_movement_facts_datetime_warehouse", "movement_facts",
                    ["operation_datetime", "warehouse_id"], schema="wms")
    op.create_index("ix_movement_facts_batch", "movement_facts",
                    ["source_batch_id"], schema="wms")

    # ── 2.11 audit_logs ──
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(100), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["wms.users.id"],
                                name="fk_audit_logs_user", ondelete="RESTRICT"),
        sa.CheckConstraint(
            "action IN ('login', 'logout', 'create', 'update', 'delete', "
            "'import_start', 'import_commit', 'import_rollback', "
            "'user_role_change', 'data_adjustment')",
            name="ch_audit_logs_action",
        ),
        schema="wms",
    )
    op.create_index("ix_audit_logs_user", "audit_logs", ["user_id", "created_at"], schema="wms")
    op.create_index("ix_audit_logs_entity", "audit_logs", ["entity_type", "entity_id"], schema="wms")
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"], schema="wms")

    # ── 5. Триггеры updated_at ──
    op.execute("""
        CREATE OR REPLACE FUNCTION wms.set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    for table_name in ["warehouses", "chambers", "pallet_locations", "skus", "users"]:
        op.execute(f"""
            CREATE TRIGGER trg_{table_name}_updated_at
                BEFORE UPDATE ON wms.{table_name}
                FOR EACH ROW EXECUTE FUNCTION wms.set_updated_at();
        """)

    # ── 6. Materialized Views ──
    _create_materialized_views()
    _create_refresh_function()

    # ── 7. Seed-данные ──
    _seed_data()


def downgrade() -> None:
    """Удаление схемы wms полностью."""
    op.execute("DROP SCHEMA IF EXISTS wms CASCADE")


def _create_materialized_views() -> None:
    """Создание всех 4 materialized views."""

    # 5.1 mv_dashboard_summary
    op.execute("""
        CREATE MATERIALIZED VIEW wms.mv_dashboard_summary AS
        SELECT
            w.id             AS warehouse_id,
            w.code           AS warehouse_code,
            w.name           AS warehouse_name,
            COUNT(pl.id) FILTER (WHERE pl.status IN ('free', 'occupied'))
                AS total_active_locations,
            COUNT(pl.id) FILTER (WHERE pl.status = 'free')
                AS free_locations,
            COUNT(pl.id) FILTER (WHERE pl.status = 'occupied')
                AS occupied_locations,
            COUNT(pl.id) FILTER (WHERE pl.status = 'blocked')
                AS blocked_locations,
            COUNT(pl.id) FILTER (WHERE pl.status = 'unavailable')
                AS unavailable_locations,
            COUNT(DISTINCT ss.sku_id) FILTER (WHERE pl.status = 'occupied')
                AS active_sku_count,
            CASE
                WHEN COUNT(pl.id) FILTER (WHERE pl.status IN ('free', 'occupied')) > 0
                THEN ROUND(
                    100.0 * COUNT(pl.id) FILTER (WHERE pl.status = 'occupied')
                    / COUNT(pl.id) FILTER (WHERE pl.status IN ('free', 'occupied')),
                    2
                )
                ELSE 0
            END AS occupancy_rate_pct,
            (
                SELECT MAX(ss2.snapshot_date)
                FROM wms.stock_snapshots ss2
                WHERE ss2.warehouse_id = w.id
            ) AS last_snapshot_date,
            (
                SELECT MAX(ib.imported_at)
                FROM wms.import_batches ib
                WHERE ib.status = 'imported'
            ) AS last_import_at
        FROM wms.warehouses w
        LEFT JOIN wms.chambers ch ON ch.warehouse_id = w.id AND ch.is_active = TRUE
        LEFT JOIN wms.pallet_locations pl ON pl.chamber_id = ch.id
        LEFT JOIN wms.stock_snapshots ss ON ss.pallet_location_id = pl.id
            AND ss.snapshot_date = (
                SELECT MAX(ss3.snapshot_date)
                FROM wms.stock_snapshots ss3
                WHERE ss3.warehouse_id = w.id
            )
        WHERE w.is_active = TRUE
        GROUP BY w.id, w.code, w.name;
    """)
    op.execute("CREATE UNIQUE INDEX ix_mv_dashboard_summary ON wms.mv_dashboard_summary(warehouse_id)")

    # 5.2 mv_chamber_occupancy
    op.execute("""
        CREATE MATERIALIZED VIEW wms.mv_chamber_occupancy AS
        SELECT
            ch.id               AS chamber_id,
            ch.warehouse_id,
            ch.code             AS chamber_code,
            ch.name             AS chamber_name,
            ch.chamber_type,
            ch.zone,
            ch.capacity_pallets,
            COUNT(pl.id)                            AS total_locations,
            COUNT(pl.id) FILTER (WHERE pl.status = 'free')        AS free_locations,
            COUNT(pl.id) FILTER (WHERE pl.status = 'occupied')    AS occupied_locations,
            COUNT(pl.id) FILTER (WHERE pl.status = 'blocked')     AS blocked_locations,
            COUNT(pl.id) FILTER (WHERE pl.status = 'unavailable') AS unavailable_locations,
            CASE
                WHEN COUNT(pl.id) > 0
                THEN ROUND(100.0 * COUNT(pl.id) FILTER (WHERE pl.status = 'occupied') / COUNT(pl.id), 2)
                ELSE 0
            END AS occupancy_rate_pct,
            COUNT(DISTINCT ss.sku_id) FILTER (WHERE pl.status = 'occupied') AS distinct_sku_count
        FROM wms.chambers ch
        LEFT JOIN wms.pallet_locations pl ON pl.chamber_id = ch.id
        LEFT JOIN LATERAL (
            SELECT DISTINCT ON (ss2.pallet_location_id) ss2.pallet_location_id, ss2.sku_id
            FROM wms.stock_snapshots ss2
            WHERE ss2.chamber_id = ch.id
            ORDER BY ss2.pallet_location_id, ss2.snapshot_date DESC
        ) ss ON ss.pallet_location_id = pl.id
        WHERE ch.is_active = TRUE
        GROUP BY ch.id, ch.warehouse_id, ch.code, ch.name, ch.chamber_type, ch.zone, ch.capacity_pallets;
    """)
    op.execute("CREATE UNIQUE INDEX ix_mv_chamber_occupancy ON wms.mv_chamber_occupancy(chamber_id)")
    op.execute("CREATE INDEX ix_mv_chamber_occupancy_warehouse ON wms.mv_chamber_occupancy(warehouse_id)")

    # 5.3 mv_sku_analytics
    op.execute("""
        CREATE MATERIALIZED VIEW wms.mv_sku_analytics AS
        SELECT
            sk.id                   AS sku_id,
            sk.sku_code,
            sk.sku_name,
            sk.category,
            sk.unit,
            sk.pallet_coeff,
            COUNT(DISTINCT ss.pallet_location_id)
                FILTER (WHERE pl.status = 'occupied')
                AS current_occupied_locations,
            COALESCE(SUM(ss.occupied_volume), 0) AS total_stored_volume,
            COALESCE((
                SELECT SUM(sf.shipped_volume)
                FROM wms.shipment_facts sf
                WHERE sf.sku_id = sk.id
            ), 0) AS total_shipped_volume,
            COALESCE((
                SELECT SUM(sf.shipped_qty)
                FROM wms.shipment_facts sf
                WHERE sf.sku_id = sk.id
            ), 0) AS total_shipped_qty,
            COUNT(DISTINCT ss.snapshot_date) AS storage_days,
            CASE
                WHEN COALESCE(SUM(ss.occupied_volume), 0) > 0
                THEN ROUND(
                    COALESCE((SELECT SUM(sf.shipped_volume) FROM wms.shipment_facts sf WHERE sf.sku_id = sk.id), 0)
                    / SUM(ss.occupied_volume),
                    4
                )
                ELSE 0
            END AS turnover_efficiency,
            CASE
                WHEN COALESCE((SELECT SUM(sf.shipped_qty) FROM wms.shipment_facts sf WHERE sf.sku_id = sk.id), 0) > 0
                THEN ROUND(
                    COUNT(DISTINCT ss.pallet_location_id) FILTER (WHERE pl.status = 'occupied')
                    / COALESCE((SELECT SUM(sf.shipped_qty) FROM wms.shipment_facts sf WHERE sf.sku_id = sk.id), 1),
                    4
                )
                ELSE NULL
            END AS storage_load_ratio
        FROM wms.skus sk
        LEFT JOIN wms.stock_snapshots ss ON ss.sku_id = sk.id
        LEFT JOIN wms.pallet_locations pl ON pl.id = ss.pallet_location_id
        WHERE sk.is_active = TRUE
        GROUP BY sk.id, sk.sku_code, sk.sku_name, sk.category, sk.unit, sk.pallet_coeff;
    """)
    op.execute("CREATE UNIQUE INDEX ix_mv_sku_analytics ON wms.mv_sku_analytics(sku_id)")
    op.execute("CREATE INDEX ix_mv_sku_analytics_category ON wms.mv_sku_analytics(category)")

    # 5.4 mv_occupancy_trend
    op.execute("""
        CREATE MATERIALIZED VIEW wms.mv_occupancy_trend AS
        SELECT
            ss.snapshot_date,
            ss.warehouse_id,
            ss.chamber_id,
            COUNT(DISTINCT ss.pallet_location_id) FILTER (WHERE pl.status = 'occupied') AS occupied_locations,
            COUNT(DISTINCT ss.pallet_location_id) FILTER (WHERE pl.status = 'free')     AS free_locations,
            COUNT(DISTINCT ss.sku_id)                                                    AS active_sku_count,
            SUM(ss.occupied_volume)                                                      AS total_occupied_volume
        FROM wms.stock_snapshots ss
        LEFT JOIN wms.pallet_locations pl ON pl.id = ss.pallet_location_id
        GROUP BY ss.snapshot_date, ss.warehouse_id, ss.chamber_id;
    """)
    op.execute("CREATE UNIQUE INDEX ix_mv_occupancy_trend ON wms.mv_occupancy_trend(snapshot_date, warehouse_id, chamber_id)")
    op.execute("CREATE INDEX ix_mv_occupancy_trend_date ON wms.mv_occupancy_trend(snapshot_date)")


def _create_refresh_function() -> None:
    """Создание функции обновления всех materialized views."""
    op.execute("""
        CREATE OR REPLACE FUNCTION wms.refresh_all_materialized_views()
        RETURNS void AS $$
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_dashboard_summary;
            REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_chamber_occupancy;
            REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_sku_analytics;
            REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_occupancy_trend;
        END;
        $$ LANGUAGE plpgsql;
    """)


def _seed_data() -> None:
    """Загрузка минимальных seed-данных для разработки."""

    # Warehouse
    op.execute("INSERT INTO wms.warehouses (code, name) VALUES ('WH-001', 'Основной склад')")

    # Chambers
    op.execute("""
        INSERT INTO wms.chambers (warehouse_id, code, name, chamber_type, capacity_pallets, zone, temperature_mode)
        VALUES
            ((SELECT id FROM wms.warehouses WHERE code='WH-001'), 'CH-A1', 'Камера A1', 'standard', 100, 'Зона A', 'ambient'),
            ((SELECT id FROM wms.warehouses WHERE code='WH-001'), 'CH-B1', 'Камера B1', 'cold', 50, 'Зона B', 'chilled'),
            ((SELECT id FROM wms.warehouses WHERE code='WH-001'), 'CH-C1', 'Камера C1', 'freezer', 30, 'Зона C', 'frozen');
    """)

    # Pallet Locations (по 5 на камеру)
    op.execute("""
        DO $$
        DECLARE
            ch_id UUID;
            i INTEGER;
        BEGIN
            FOR ch_id IN SELECT id FROM wms.chambers LOOP
                FOR i IN 1..5 LOOP
                    INSERT INTO wms.pallet_locations (chamber_id, code, status)
                    VALUES (ch_id, 'LOC-' || i, CASE WHEN i <= 3 THEN 'free' ELSE 'occupied' END);
                END LOOP;
            END LOOP;
        END $$;
    """)

    # SKUs
    op.execute("""
        INSERT INTO wms.skus (sku_code, sku_name, category, unit, pallet_coeff, volume) VALUES
            ('SKU-1001', 'Товар Альфа', 'Категория 1', 'pcs', 1.0, 0.5),
            ('SKU-1002', 'Товар Бета',  'Категория 1', 'pcs', 1.5, 0.8),
            ('SKU-1003', 'Товар Гамма', 'Категория 2', 'box', 2.0, 1.2);
    """)

    # Users (dev-пароли: admin123, analyst123, viewer123)
    op.execute("""
        INSERT INTO wms.users (username, email, password_hash, role) VALUES
            ('admin',   'admin@example.com',   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin'),
            ('analyst', 'analyst@example.com', '20249749412d73a3f5799f6f1dcf910e7b4aa3ce4de133b1f8a63c044792a4e9', 'analyst'),
            ('viewer',  'viewer@example.com',  '65375049b9e4d7cad6c9ba286fdeb9394b28135a3e84136404cfccfdcc438894', 'viewer');
    """)