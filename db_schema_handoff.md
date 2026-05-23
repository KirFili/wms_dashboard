# Database Schema Handoff: WMS Dashboard «Управление складом»

**Документ:** handoff от Анатолия-аналитика → coding-агент  
**Дата:** 2026-05-23  
**Состояние:** готов к реализации  
**На основе:** warehouse_dashboard_tz.md (§7, §8, §9, §10)

---

## 1. Соглашения

- **СУБД:** PostgreSQL 15+
- **Расширения:** `uuid-ossp`, `pgcrypto` (для gen_random_uuid)
- **Кодировка:** UTF-8
- **Схема:** `wms` (все таблицы в одной схеме)
- **Именование:** `snake_case`, первичные ключи — `id UUID DEFAULT gen_random_uuid()`
- **Timestamps:** `TIMESTAMPTZ` для всех временных меток
- **Soft delete не используется.** Для деактивации применяется поле `is_active`.

---

## 2. Полный DDL

### 2.0 Создание схемы и расширений

```sql
CREATE SCHEMA IF NOT EXISTS wms;
SET search_path TO wms;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2.1 Таблица warehouses

```sql
CREATE TABLE wms.warehouses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_warehouses_code UNIQUE (code),
    CONSTRAINT ch_warehouses_code CHECK (code <> '')
);
```

### 2.2 Таблица chambers

```sql
CREATE TABLE wms.chambers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id      UUID         NOT NULL,
    code              VARCHAR(50)  NOT NULL,
    name              VARCHAR(255) NOT NULL,
    chamber_type      VARCHAR(50)  NOT NULL DEFAULT 'standard',
    capacity_pallets  INTEGER      NOT NULL CHECK (capacity_pallets >= 0),
    zone              VARCHAR(100),
    temperature_mode  VARCHAR(50),
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_chambers PRIMARY KEY (id),
    CONSTRAINT fk_chambers_warehouse FOREIGN KEY (warehouse_id)
        REFERENCES wms.warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT uq_chambers_warehouse_code UNIQUE (warehouse_id, code),
    CONSTRAINT ch_chambers_code CHECK (code <> ''),
    CONSTRAINT ch_chambers_capacity CHECK (capacity_pallets >= 0)
);

CREATE INDEX ix_chambers_warehouse_code ON wms.chambers(warehouse_id, code);
```

### 2.3 Таблица pallet_locations

```sql
CREATE TABLE wms.pallet_locations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chamber_id     UUID         NOT NULL,
    code           VARCHAR(50)  NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'free',
    is_blocked     BOOLEAN      NOT NULL DEFAULT FALSE,
    last_modified  TIMESTAMPTZ,
    note           TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fk_pallet_locations_chamber FOREIGN KEY (chamber_id)
        REFERENCES wms.chambers(id) ON DELETE RESTRICT,
    CONSTRAINT uq_pallet_locations_chamber_code UNIQUE (chamber_id, code),
    CONSTRAINT ch_pallet_locations_code CHECK (code <> ''),
    CONSTRAINT ch_pallet_locations_status CHECK (status IN ('free', 'occupied', 'blocked', 'unavailable'))
);

CREATE INDEX ix_pallet_locations_chamber_code ON wms.pallet_locations(chamber_id, code);
CREATE INDEX ix_pallet_locations_status ON wms.pallet_locations(status);
```

### 2.4 Таблица skus

```sql
CREATE TABLE wms.skus (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_code      VARCHAR(100) NOT NULL,
    sku_name      VARCHAR(500) NOT NULL,
    category      VARCHAR(100),
    unit          VARCHAR(20)  NOT NULL DEFAULT 'pcs',
    pallet_coeff  NUMERIC(12,4) CHECK (pallet_coeff > 0),
    volume        NUMERIC(12,4) CHECK (volume >= 0),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_skus_sku_code UNIQUE (sku_code),
    CONSTRAINT ch_skus_sku_code CHECK (sku_code <> ''),
    CONSTRAINT ch_skus_pallet_coeff CHECK (pallet_coeff IS NULL OR pallet_coeff > 0)
);

CREATE UNIQUE INDEX ix_skus_sku_code ON wms.skus(sku_code);
```

### 2.5 Таблица users

```sql
CREATE TABLE wms.users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username       VARCHAR(100) NOT NULL,
    email          VARCHAR(255),
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'viewer',
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ch_users_role CHECK (role IN ('viewer', 'analyst', 'admin')),
    CONSTRAINT ch_users_username CHECK (username <> '')
);
```

### 2.6 Таблица stock_snapshots

```sql
CREATE TABLE wms.stock_snapshots (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date     DATE         NOT NULL,
    warehouse_id      UUID         NOT NULL,
    chamber_id        UUID         NOT NULL,
    pallet_location_id UUID,
    sku_id            UUID         NOT NULL,
    occupied_locations INTEGER      NOT NULL CHECK (occupied_locations >= 0),
    occupied_volume   NUMERIC(14,4) CHECK (occupied_volume >= 0),
    source_batch_id   UUID         NOT NULL,
    natural_key       VARCHAR(500) NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fk_stock_snapshots_warehouse FOREIGN KEY (warehouse_id)
        REFERENCES wms.warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_snapshots_chamber FOREIGN KEY (chamber_id)
        REFERENCES wms.chambers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_snapshots_location FOREIGN KEY (pallet_location_id)
        REFERENCES wms.pallet_locations(id) ON DELETE SET NULL,
    CONSTRAINT fk_stock_snapshots_sku FOREIGN KEY (sku_id)
        REFERENCES wms.skus(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_snapshots_batch FOREIGN KEY (source_batch_id)
        REFERENCES wms.import_batches(id) ON DELETE RESTRICT,
    CONSTRAINT uq_stock_snapshots_natural_key UNIQUE (natural_key),
    CONSTRAINT ch_stock_snapshots_occupied_locations CHECK (occupied_locations >= 0)
);

-- Обязательные индексы §8.4
CREATE INDEX ix_stock_snapshots_date_chamber ON wms.stock_snapshots(snapshot_date, chamber_id);
CREATE INDEX ix_stock_snapshots_date_sku ON wms.stock_snapshots(snapshot_date, sku_id);

-- Дополнительные индексы
CREATE INDEX ix_stock_snapshots_warehouse_date ON wms.stock_snapshots(warehouse_id, snapshot_date);
CREATE INDEX ix_stock_snapshots_batch ON wms.stock_snapshots(source_batch_id);
```

### 2.7 Таблица shipment_facts

```sql
CREATE TABLE wms.shipment_facts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_date   DATE         NOT NULL,
    warehouse_id    UUID         NOT NULL,
    sku_id          UUID         NOT NULL,
    shipped_qty     NUMERIC(14,4) NOT NULL CHECK (shipped_qty >= 0),
    shipped_volume  NUMERIC(14,4) CHECK (shipped_volume >= 0),
    document_number VARCHAR(200),
    source_batch_id UUID         NOT NULL,
    natural_key     VARCHAR(500) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fk_shipment_facts_warehouse FOREIGN KEY (warehouse_id)
        REFERENCES wms.warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_shipment_facts_sku FOREIGN KEY (sku_id)
        REFERENCES wms.skus(id) ON DELETE RESTRICT,
    CONSTRAINT fk_shipment_facts_batch FOREIGN KEY (source_batch_id)
        REFERENCES wms.import_batches(id) ON DELETE RESTRICT,
    CONSTRAINT uq_shipment_facts_natural_key UNIQUE (natural_key),
    CONSTRAINT ch_shipment_facts_qty CHECK (shipped_qty >= 0)
);

-- Обязательный индекс §8.4
CREATE INDEX ix_shipment_facts_date_sku ON wms.shipment_facts(shipment_date, sku_id);

-- Дополнительные индексы
CREATE INDEX ix_shipment_facts_warehouse_date ON wms.shipment_facts(warehouse_id, shipment_date);
CREATE INDEX ix_shipment_facts_batch ON wms.shipment_facts(source_batch_id);
```

### 2.8 Таблица movement_facts

```sql
CREATE TABLE wms.movement_facts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_datetime  TIMESTAMPTZ  NOT NULL,
    warehouse_id        UUID         NOT NULL,
    chamber_id          UUID         NOT NULL,
    pallet_location_id  UUID,
    sku_id              UUID,
    operation_type      VARCHAR(50)  NOT NULL,
    qty                 NUMERIC(14,4) CHECK (qty >= 0),
    volume              NUMERIC(14,4) CHECK (volume >= 0),
    source_batch_id     UUID         NOT NULL,
    natural_key         VARCHAR(500) NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fk_movement_facts_warehouse FOREIGN KEY (warehouse_id)
        REFERENCES wms.warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_movement_facts_chamber FOREIGN KEY (chamber_id)
        REFERENCES wms.chambers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_movement_facts_location FOREIGN KEY (pallet_location_id)
        REFERENCES wms.pallet_locations(id) ON DELETE SET NULL,
    CONSTRAINT fk_movement_facts_sku FOREIGN KEY (sku_id)
        REFERENCES wms.skus(id) ON DELETE SET NULL,
    CONSTRAINT fk_movement_facts_batch FOREIGN KEY (source_batch_id)
        REFERENCES wms.import_batches(id) ON DELETE RESTRICT,
    CONSTRAINT uq_movement_facts_natural_key UNIQUE (natural_key),
    CONSTRAINT ch_movement_facts_type CHECK (operation_type IN (
        'placement', 'relocation', 'release', 'adjustment', 'other'
    ))
);

-- Обязательный индекс §8.4
CREATE INDEX ix_movement_facts_datetime_chamber ON wms.movement_facts(operation_datetime, chamber_id);

-- Дополнительные индексы
CREATE INDEX ix_movement_facts_datetime_warehouse ON wms.movement_facts(operation_datetime, warehouse_id);
CREATE INDEX ix_movement_facts_batch ON wms.movement_facts(source_batch_id);
```

### 2.9 Таблица import_batches

```sql
CREATE TABLE wms.import_batches (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name     VARCHAR(500) NOT NULL,
    import_type   VARCHAR(50)  NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'uploaded',
    uploaded_by   UUID         NOT NULL,
    uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    validated_at  TIMESTAMPTZ,
    imported_at   TIMESTAMPTZ,
    total_rows    INTEGER      NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
    success_rows  INTEGER      NOT NULL DEFAULT 0 CHECK (success_rows >= 0),
    warning_rows  INTEGER      NOT NULL DEFAULT 0 CHECK (warning_rows >= 0),
    error_rows    INTEGER      NOT NULL DEFAULT 0 CHECK (error_rows >= 0),
    checksum      VARCHAR(64),
    meta          JSONB,

    CONSTRAINT fk_import_batches_user FOREIGN KEY (uploaded_by)
        REFERENCES wms.users(id) ON DELETE RESTRICT,
    CONSTRAINT ch_import_batches_type CHECK (import_type IN (
        'stock_snapshot', 'shipment', 'movement'
    )),
    CONSTRAINT ch_import_batches_status CHECK (status IN (
        'uploaded', 'parsed', 'validated', 'warning', 'error', 'imported', 'rolled_back'
    )),
    CONSTRAINT ch_import_batches_rows CHECK (
        total_rows = success_rows + warning_rows + error_rows
    )
);

CREATE INDEX ix_import_batches_status ON wms.import_batches(status);
CREATE INDEX ix_import_batches_uploaded_at ON wms.import_batches(uploaded_at DESC);
```

### 2.10 Таблица import_rows

```sql
CREATE TABLE wms.import_rows (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id          UUID         NOT NULL,
    row_number        INTEGER      NOT NULL CHECK (row_number >= 0),
    raw_data          JSONB,
    mapped_data       JSONB,
    validation_status VARCHAR(20)  NOT NULL DEFAULT 'pending',
    error_messages    JSONB,
    natural_key       VARCHAR(500),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fk_import_rows_batch FOREIGN KEY (batch_id)
        REFERENCES wms.import_batches(id) ON DELETE CASCADE,
    CONSTRAINT uq_import_rows_batch_row UNIQUE (batch_id, row_number),
    CONSTRAINT ch_import_rows_validation_status CHECK (validation_status IN (
        'pending', 'valid', 'warning', 'error'
    ))
);

-- Обязательный индекс §8.4
CREATE INDEX ix_import_rows_batch_status ON wms.import_rows(batch_id, validation_status);
```

### 2.11 Таблица audit_logs

```sql
CREATE TABLE wms.audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID,
    payload     JSONB,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id)
        REFERENCES wms.users(id) ON DELETE RESTRICT,
    CONSTRAINT ch_audit_logs_action CHECK (action IN (
        'login', 'logout', 'create', 'update', 'delete',
        'import_start', 'import_commit', 'import_rollback',
        'user_role_change', 'data_adjustment'
    ))
);

CREATE INDEX ix_audit_logs_user ON wms.audit_logs(user_id, created_at DESC);
CREATE INDEX ix_audit_logs_entity ON wms.audit_logs(entity_type, entity_id);
CREATE INDEX ix_audit_logs_created_at ON wms.audit_logs(created_at DESC);
```

---

## 3. Сводка Natural Keys для дедупликации

| Таблица | Natural Key (формат составного ключа) | Поле |
|---|---|---|
| stock_snapshots | `snapshot_date::warehouse::chamber::pallet_location::sku` | `natural_key` VARCHAR(500) UNIQUE |
| shipment_facts | `shipment_date::warehouse::sku::document_number` | `natural_key` VARCHAR(500) UNIQUE |
| movement_facts | `operation_datetime::warehouse::chamber::pallet_location::sku::operation_type` | `natural_key` VARCHAR(500) UNIQUE |

**Правило:** natural_key формируется на этапе ETL до commit. Повторная загрузка того же файла (определяется по checksum) не должна создавать дубликаты. При upsert используется `ON CONFLICT (natural_key) DO UPDATE`.

---

## 4. Сводка индексов

### 4.1 Обязательные индексы (из §8.4 ТЗ)

| № | Индекс | Обоснование |
|---|---|---|
| 1 | `stock_snapshots(snapshot_date, chamber_id)` | Фильтрация dashboard по дате и камере |
| 2 | `stock_snapshots(snapshot_date, sku_id)` | Аналитика SKU по периоду |
| 3 | `shipment_facts(shipment_date, sku_id)` | Аналитика отгрузок SKU по периоду |
| 4 | `movement_facts(operation_datetime, chamber_id)` | Фильтрация операций по камере |
| 5 | `import_rows(batch_id, validation_status)` | Статус строк импорта |
| 6 | `skus(sku_code)` — UNIQUE | Поиск SKU по коду |
| 7 | `chambers(warehouse_id, code)` — UNIQUE | Поиск камеры в складе |
| 8 | `pallet_locations(chamber_id, code)` — UNIQUE | Поиск паллетоместа в камере |

### 4.2 Дополнительные индексы (для производительности)

| № | Индекс | Обоснование |
|---|---|---|
| 9 | `stock_snapshots(warehouse_id, snapshot_date)` | Фильтр по складу + дате |
| 10 | `stock_snapshots(source_batch_id)` | Откат импорта / трассировка |
| 11 | `shipment_facts(warehouse_id, shipment_date)` | Фильтр по складу |
| 12 | `shipment_facts(source_batch_id)` | Откат импорта |
| 13 | `movement_facts(operation_datetime, warehouse_id)` | Фильтр по складу |
| 14 | `movement_facts(source_batch_id)` | Откат импорта |
| 15 | `pallet_locations(status)` | Фильтр по статусу |
| 16 | `import_batches(status)` | Фильтр журнала импорта |
| 17 | `import_batches(uploaded_at DESC)` | Сортировка журнала |
| 18 | `audit_logs(user_id, created_at DESC)` | Аудит по пользователю |
| 19 | `audit_logs(entity_type, entity_id)` | Аудит по объекту |
| 20 | `audit_logs(created_at DESC)` | Хронология событий |

---

## 5. Materialized Views для KPI-агрегатов

### 5.1 mv_dashboard_summary — сводка по складу

```sql
CREATE MATERIALIZED VIEW wms.mv_dashboard_summary AS
SELECT
    w.id             AS warehouse_id,
    w.code           AS warehouse_code,
    w.name           AS warehouse_name,

    -- Всего активных паллетомест
    COUNT(pl.id) FILTER (WHERE pl.status IN ('free', 'occupied'))
        AS total_active_locations,

    -- Свободные паллетоместа
    COUNT(pl.id) FILTER (WHERE pl.status = 'free')
        AS free_locations,

    -- Занятые паллетоместа
    COUNT(pl.id) FILTER (WHERE pl.status = 'occupied')
        AS occupied_locations,

    -- Заблокированные
    COUNT(pl.id) FILTER (WHERE pl.status = 'blocked')
        AS blocked_locations,

    -- Недоступные
    COUNT(pl.id) FILTER (WHERE pl.status = 'unavailable')
        AS unavailable_locations,

    -- Число активных SKU в занятых местах
    COUNT(DISTINCT ss.sku_id) FILTER (WHERE pl.status = 'occupied')
        AS active_sku_count,

    -- Процент заполненности
    CASE
        WHEN COUNT(pl.id) FILTER (WHERE pl.status IN ('free', 'occupied')) > 0
        THEN ROUND(
            100.0 * COUNT(pl.id) FILTER (WHERE pl.status = 'occupied')
            / COUNT(pl.id) FILTER (WHERE pl.status IN ('free', 'occupied')),
            2
        )
        ELSE 0
    END AS occupancy_rate_pct,

    -- Дата последнего снимка
    (SELECT MAX(ss2.snapshot_date)
     FROM wms.stock_snapshots ss2
     WHERE ss2.warehouse_id = w.id
    ) AS last_snapshot_date,

    -- Дата последнего импорта
    (SELECT MAX(ib.imported_at)
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

CREATE UNIQUE INDEX ix_mv_dashboard_summary ON wms.mv_dashboard_summary(warehouse_id);
```

### 5.2 mv_chamber_occupancy — заполненность по камерам

```sql
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
    SELECT DISTINCT ON (ss2.pallet_location_id) ss2.sku_id
    FROM wms.stock_snapshots ss2
    WHERE ss2.chamber_id = ch.id
    ORDER BY ss2.pallet_location_id, ss2.snapshot_date DESC
) ss ON ss.pallet_location_id = pl.id
WHERE ch.is_active = TRUE
GROUP BY ch.id, ch.warehouse_id, ch.code, ch.name, ch.chamber_type, ch.zone, ch.capacity_pallets;

CREATE UNIQUE INDEX ix_mv_chamber_occupancy ON wms.mv_chamber_occupancy(chamber_id);
CREATE INDEX ix_mv_chamber_occupancy_warehouse ON wms.mv_chamber_occupancy(warehouse_id);
```

### 5.3 mv_sku_analytics — аналитика по SKU

```sql
CREATE MATERIALIZED VIEW wms.mv_sku_analytics AS
SELECT
    sk.id                   AS sku_id,
    sk.sku_code,
    sk.sku_name,
    sk.category,
    sk.unit,
    sk.pallet_coeff,

    -- Текущее количество занятых паллетомест
    COUNT(DISTINCT ss.pallet_location_id)
        FILTER (WHERE pl.status = 'occupied')
        AS current_occupied_locations,

    -- Суммарный объём хранения (все снимки)
    COALESCE(SUM(ss.occupied_volume), 0)
        AS total_stored_volume,

    -- Суммарный объём отгрузок
    COALESCE((
        SELECT SUM(sf.shipped_volume)
        FROM wms.shipment_facts sf
        WHERE sf.sku_id = sk.id
    ), 0) AS total_shipped_volume,

    -- Суммарное количество отгружено
    COALESCE((
        SELECT SUM(sf.shipped_qty)
        FROM wms.shipment_facts sf
        WHERE sf.sku_id = sk.id
    ), 0) AS total_shipped_qty,

    -- Количество дней с хранением
    COUNT(DISTINCT ss.snapshot_date)
        AS storage_days,

    -- Коэффициент оборачиваемости (Вариант A)
    CASE
        WHEN COALESCE(SUM(ss.occupied_volume), 0) > 0
        THEN ROUND(
            COALESCE((SELECT SUM(sf.shipped_volume) FROM wms.shipment_facts sf WHERE sf.sku_id = sk.id), 0)
            / SUM(ss.occupied_volume),
            4
        )
        ELSE 0
    END AS turnover_efficiency,

    -- Коэффициент складской нагрузки (Вариант B)
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

CREATE UNIQUE INDEX ix_mv_sku_analytics ON wms.mv_sku_analytics(sku_id);
CREATE INDEX ix_mv_sku_analytics_category ON wms.mv_sku_analytics(category);
```

### 5.4 mv_occupancy_trend — динамика занятости по датам

```sql
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

CREATE UNIQUE INDEX ix_mv_occupancy_trend ON wms.mv_occupancy_trend(snapshot_date, warehouse_id, chamber_id);
CREATE INDEX ix_mv_occupancy_trend_date ON wms.mv_occupancy_trend(snapshot_date);
```

### 5.5 Функция обновления materialized views

```sql
CREATE OR REPLACE FUNCTION wms.refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_dashboard_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_chamber_occupancy;
    REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_sku_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY wms.mv_occupancy_trend;
END;
$$ LANGUAGE plpgsql;
```

**Примечание:** `CONCURRENTLY` требует наличия уникального индекса на каждом materialized view. Все уникальные индексы созданы выше.

---

## 6. Триггеры для аудита

```sql
-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION wms.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применение к справочным таблицам
CREATE TRIGGER trg_warehouses_updated_at
    BEFORE UPDATE ON wms.warehouses
    FOR EACH ROW EXECUTE FUNCTION wms.set_updated_at();

CREATE TRIGGER trg_chambers_updated_at
    BEFORE UPDATE ON wms.chambers
    FOR EACH ROW EXECUTE FUNCTION wms.set_updated_at();

CREATE TRIGGER trg_pallet_locations_updated_at
    BEFORE UPDATE ON wms.pallet_locations
    FOR EACH ROW EXECUTE FUNCTION wms.set_updated_at();

CREATE TRIGGER trg_skus_updated_at
    BEFORE UPDATE ON wms.skus
    FOR EACH ROW EXECUTE FUNCTION wms.set_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON wms.users
    FOR EACH ROW EXECUTE FUNCTION wms.set_updated_at();
```

---

## 7. Карта зависимостей (порядок создания таблиц)

```
1. warehouses
2. chambers          (FK → warehouses)
3. pallet_locations  (FK → chambers)
4. skus
5. users
6. import_batches    (FK → users)
7. import_rows       (FK → import_batches)
8. stock_snapshots   (FK → warehouses, chambers, pallet_locations, skus, import_batches)
9. shipment_facts    (FK → warehouses, skus, import_batches)
10. movement_facts   (FK → warehouses, chambers, pallet_locations, skus, import_batches)
11. audit_logs       (FK → users)
```

---

## 8. Acceptance Criteria (приёмка схемы БД)

| № | Критерий | Проверка |
|---|---|---|
| AC-DB-1 | Все 11 таблиц созданы в схеме `wms` | `SELECT tablename FROM pg_tables WHERE schemaname='wms'` |
| AC-DB-2 | Все внешние ключи созданы и валидны | `SELECT * FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY' AND table_schema='wms'` |
| AC-DB-3 | Все 8 обязательных индексов существуют | Сверка с §4.1 |
| AC-DB-4 | Все 12 дополнительных индексов существуют | Сверка с §4.2 |
| AC-DB-5 | Все UNIQUE constraints на natural_key созданы | Сверка с §3 |
| AC-DB-6 | Все CHECK constraints на перечисления (статусы, роли, типы) созданы | `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE contype='c' AND connamespace='wms'::regnamespace` |
| AC-DB-7 | 4 materialized views созданы и имеют уникальные индексы | Сверка с §5.1–5.4 |
| AC-DB-8 | Функция `refresh_all_materialized_views()` корректно обновляет все MV | Ручной вызов + проверка данных |
| AC-DB-9 | Триггеры `updated_at` работают на 5 справочных таблицах | UPDATE строки → проверка изменения updated_at |
| AC-DB-10 | Схема проходит миграцию без ошибок | `psql -f schema.sql` — 0 ошибок |

### Definition of Done (Database)
- [ ] Все 11 таблиц созданы в целевой БД
- [ ] Все индексы (8 обязательных + 12 дополнительных) созданы
- [ ] Все FK-ограничения созданы и валидированы
- [ ] Все CHECK-ограничения на статусы/роли/типы созданы
- [ ] Natural keys заданы через UNIQUE constraints
- [ ] 4 materialized views созданы и успешно обновляются через `REFRESH`
- [ ] Триггеры `updated_at` работают
- [ ] Тестовые данные (seed) загружены без нарушения constraints
- [ ] Миграция воспроизводима с нуля одной командой
- [ ] Coding-агент может использовать схему БЕЗ угадывания имён полей, типов и ограничений

---

## 9. Seed-данные (минимальный набор для разработки)

```sql
-- Warehouse
INSERT INTO wms.warehouses (code, name) VALUES ('WH-001', 'Основной склад');

-- Chambers
INSERT INTO wms.chambers (warehouse_id, code, name, chamber_type, capacity_pallets, zone, temperature_mode)
VALUES
    ((SELECT id FROM wms.warehouses WHERE code='WH-001'), 'CH-A1', 'Камера A1', 'standard', 100, 'Зона A', 'ambient'),
    ((SELECT id FROM wms.warehouses WHERE code='WH-001'), 'CH-B1', 'Камера B1', 'cold', 50, 'Зона B', 'chilled'),
    ((SELECT id FROM wms.warehouses WHERE code='WH-001'), 'CH-C1', 'Камера C1', 'freezer', 30, 'Зона C', 'frozen');

-- Pallet Locations (по 5 на камеру)
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

-- SKUs
INSERT INTO wms.skus (sku_code, sku_name, category, unit, pallet_coeff, volume) VALUES
    ('SKU-1001', 'Товар Альфа', 'Категория 1', 'pcs', 1.0, 0.5),
    ('SKU-1002', 'Товар Бета',  'Категория 1', 'pcs', 1.5, 0.8),
    ('SKU-1003', 'Товар Гамма', 'Категория 2', 'box', 2.0, 1.2);

-- Users
INSERT INTO wms.users (username, email, password_hash, role) VALUES
    ('admin',   'admin@example.com',   crypt('admin123', gen_salt('bf')), 'admin'),
    ('analyst', 'analyst@example.com', crypt('analyst123', gen_salt('bf')), 'analyst'),
    ('viewer',  'viewer@example.com',  crypt('viewer123', gen_salt('bf')), 'viewer');
```

---

## 10. Traceability (трассировка к ТЗ)

| Раздел handoff | Ссылка на раздел ТЗ |
|---|---|
| §2.1–2.11 DDL | §8.1, §8.2, §8.3 |
| §3 Natural Keys | §9.5 |
| §4 Индексы | §8.4 |
| §5 Materialized Views | §10, §14, §19 |
| §6 Триггеры | §5.6 |
| §7 Карта зависимостей | §7.2 |
| §8 Acceptance Criteria | §21 |
| §9 Seed-данные | §2, §22 (Этап 2) |

---

**Составил:** Анатолий, AI-агент-аналитик  
**Передаётся:** coding-агенту для реализации Этапа 2 (Data Foundation)  
**Связанный документ:** architecture_handoff.md (domain model, модули, ER-диаграмма)
