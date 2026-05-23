# Architecture Handoff: WMS Dashboard «Управление складом»

**Документ:** handoff от Анатолия-аналитика → coding-агент  
**Дата:** 2026-05-23  
**Состояние:** готов к реализации  
**На основе:** warehouse_dashboard_tz.md (803 строки)

---

## 1. Domain Model

### 1.1 Сущности

| Сущность | Назначение | Тип |
|---|---|---|
| Warehouse | Склад / логическая площадка хранения | Справочник |
| Chamber | Камера хранения внутри склада | Справочник |
| PalletLocation | Паллетоместо / ячейка внутри камеры | Справочник |
| SKU | Номенклатурная позиция (Stock Keeping Unit) | Справочник |
| StockSnapshot | Снимок состояния хранения на дату | Факт |
| ShipmentFact | Факт отгрузки SKU со склада | Факт |
| MovementFact | Операция: размещение / перемещение / освобождение | Факт |
| ImportBatch | Загруженный XLSX-файл / пакет импорта | Staging |
| ImportRow | Одна строка staging-импорта | Staging |
| User | Пользователь системы | Справочник |
| AuditLog | Запись журнала действий | Аудит |

### 1.2 Связи (бизнес-правила)

- Один склад содержит **много** камер хранения.  
- Одна камера содержит **много** паллетомест.  
- Один SKU может одновременно занимать **много** паллетомест.  
- StockSnapshot хранит состояние SKU в разрезе: дата, склад, камера, паллетоместо (опционально).  
- ShipmentFact хранит отгрузки SKU в разрезе: дата, склад.  
- MovementFact хранит операции в разрезе: дата/время, склад, камера, паллетоместо (опционально), SKU (опционально).  
- Один ImportBatch содержит **много** ImportRow.  
- ImportBatch и три факт-таблицы ссылаются через source_batch_id.  
- AuditLog привязан к пользователю (user_id) и объекту действия (entity_type + entity_id).

### 1.3 Статусная модель

**Статусы паллетоместа (pallet_locations.status):**
`free` | `occupied` | `blocked` | `unavailable`

**Статусы импорта (import_batches.status):**
`uploaded` → `parsed` → `validated` → (`warning` | `error`) → `imported` → (`rolled_back`)

**Статусы валидации строки (import_rows.validation_status):**
`valid` | `warning` | `error`

**Роли пользователей:**
`viewer` | `analyst` | `admin`

---

## 2. ER-диаграмма (Mermaid)

```mermaid
erDiagram
    Warehouse ||--o{ Chamber : "содержит"
    Chamber ||--o{ PalletLocation : "содержит"
    Chamber }o--|| Warehouse : "FK warehouse_id"

    Warehouse ||--o{ StockSnapshot : "snapshot"
    Warehouse ||--o{ ShipmentFact : "отгрузка"
    Warehouse ||--o{ MovementFact : "операция"

    Chamber ||--o{ StockSnapshot : "snapshot"
    Chamber ||--o{ MovementFact : "операция"

    PalletLocation ||--o{ StockSnapshot : "snapshot"
    PalletLocation ||--o{ MovementFact : "операция"

    SKU ||--o{ StockSnapshot : "snapshot"
    SKU ||--o{ ShipmentFact : "отгрузка"
    SKU ||--o{ MovementFact : "операция"

    ImportBatch ||--o{ ImportRow : "строки"
    ImportBatch ||--o{ StockSnapshot : "source_batch"
    ImportBatch ||--o{ ShipmentFact : "source_batch"
    ImportBatch ||--o{ MovementFact : "source_batch"

    User ||--o{ ImportBatch : "загрузил"
    User ||--o{ AuditLog : "действие"

    Warehouse {
        uuid id PK
        varchar code UK
        varchar name
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    Chamber {
        uuid id PK
        uuid warehouse_id FK
        varchar code
        varchar name
        varchar chamber_type
        int capacity_pallets
        varchar zone
        varchar temperature_mode
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PalletLocation {
        uuid id PK
        uuid chamber_id FK
        varchar code
        varchar status
        boolean is_blocked
        timestamptz last_modified
        varchar note
        timestamptz created_at
        timestamptz updated_at
    }

    SKU {
        uuid id PK
        varchar sku_code UK
        varchar sku_name
        varchar category
        varchar unit
        numeric pallet_coeff
        numeric volume
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    StockSnapshot {
        uuid id PK
        date snapshot_date
        uuid warehouse_id FK
        uuid chamber_id FK
        uuid pallet_location_id FK nullable
        uuid sku_id FK
        int occupied_locations
        numeric occupied_volume
        uuid source_batch_id FK
        varchar natural_key UK
        timestamptz created_at
    }

    ShipmentFact {
        uuid id PK
        date shipment_date
        uuid warehouse_id FK
        uuid sku_id FK
        numeric shipped_qty
        numeric shipped_volume
        varchar document_number
        uuid source_batch_id FK
        varchar natural_key UK
        timestamptz created_at
    }

    MovementFact {
        uuid id PK
        timestamptz operation_datetime
        uuid warehouse_id FK
        uuid chamber_id FK
        uuid pallet_location_id FK nullable
        uuid sku_id FK nullable
        varchar operation_type
        numeric qty
        numeric volume
        uuid source_batch_id FK
        varchar natural_key UK
        timestamptz created_at
    }

    ImportBatch {
        uuid id PK
        varchar file_name
        varchar import_type
        varchar status
        uuid uploaded_by FK
        timestamptz uploaded_at
        timestamptz validated_at
        timestamptz imported_at
        int total_rows
        int success_rows
        int warning_rows
        int error_rows
        varchar checksum
        jsonb meta
    }

    ImportRow {
        uuid id PK
        uuid batch_id FK
        int row_number
        jsonb raw_data
        jsonb mapped_data
        varchar validation_status
        jsonb error_messages
        varchar natural_key
        timestamptz created_at
    }

    User {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar role
        boolean is_active
        timestamptz last_login
        timestamptz created_at
        timestamptz updated_at
    }

    AuditLog {
        uuid id PK
        uuid user_id FK
        varchar action
        varchar entity_type
        uuid entity_id
        jsonb payload
        timestamptz created_at
    }
```

---

## 3. Модули системы

### 3.1 Frontend (React + TypeScript)

| Модуль | Назначение | Экраны |
|---|---|---|
| Auth | Вход/выход, проверка сессии | Login |
| Layout | Sidebar, Header, Theme | Все экраны |
| Dashboard | Главная аналитика склада | Dashboard |
| Chambers | CRUD камер хранения | Chambers, ChamberDetail |
| PalletLocations | CRUD паллетомест | PalletLocations |
| SKUDirectory | CRUD справочника SKU | SKU Directory |
| SKUAnalytics | Глубокая аналитика по SKU | SKU Analytics, SKU Card |
| Imports | Загрузка XLSX + журнал | Imports, ImportDetail |
| AuditLog | Журнал действий | Audit Log |
| Settings | Системные настройки | Settings |

**Обязательные состояния экранов:** loading, empty, error, stale data.

**Обязательные визуализации (Dashboard):**
- KPI Cards (всего мест, свободно, занято, % заполненности, кол-во активных SKU)
- Bar chart по камерам (заполненность)
- Line chart по датам (динамика занятости)
- Heatmap камер (перегруженные зоны)
- Scatter plot по SKU (хранение vs отгрузки)
- Detail table (сортировка, фильтрация, drill-down)

### 3.2 Backend (FastAPI)

| Модуль | API-группа | Назначение |
|---|---|---|
| Auth | `/api/auth/*` | JWT-авторизация |
| Dashboard | `/api/dashboard/*` | Агрегированные KPI и графики |
| Chambers | `/api/chambers/*` | CRUD камер |
| PalletLocations | `/api/pallet-locations/*` | CRUD паллетомест |
| SKUs | `/api/skus/*` | CRUD справочника SKU |
| SKUAnalytics | `/api/analytics/sku/*` | Детальная аналитика SKU |
| Imports | `/api/imports/*` | ETL-конвейер импорта |
| Audit | `/api/audit-logs/*` | Журнал аудита |

**Слои backend (обязательное разделение):**
- **API layer** — роуты, валидация запросов, авторизация
- **Service layer** — бизнес-логика, формулы KPI
- **Repository layer** — SQL-запросы, доступ к данным
- **ETL layer** — парсинг XLSX, валидация, upsert

### 3.3 ETL (импорт XLSX)

**Этапы конвейера:**
1. Upload файла (POST /api/imports/upload)
2. Parse листов XLSX (POST /api/imports/{batch_id}/parse)
3. Mapping колонок (пользовательский UI + авто-маппинг)
4. Validation (POST /api/imports/{batch_id}/validate)
5. Preview результата (GET /api/imports/{batch_id}/rows)
6. Commit в staging + upsert в production (POST /api/imports/{batch_id}/commit)
7. Rollback при ошибках (POST /api/imports/{batch_id}/rollback)
8. Rebuild агрегатов (автоматически после commit)

**Типы шаблонов импорта:**
- `stock_snapshot` — остатки на дату
- `shipment` — отгрузки за период
- `movement` — операции / движения

### 3.4 Database (PostgreSQL)

**Слои:**
- **Справочники** — warehouses, chambers, pallet_locations, skus, users
- **Факты** — stock_snapshots, shipment_facts, movement_facts
- **Staging** — import_batches, import_rows
- **Аудит** — audit_logs
- **Агрегаты** — materialized views (см. db_schema_handoff.md)

---

## 4. Риски и рекомендации

### 4.1 Выявленные риски

| Риск | Вероятность | Влияние | Рекомендация |
|---|---|---|---|
| Неоднородные XLSX-шаблоны из 1С | Высокая | Высокое | Гибкий mapping колонок + preview с возможностью ручной коррекции |
| Отсутствие единой трактовки KPI эффективности SKU | Средняя | Среднее | Реализовать все 3 формулы (A/B/C) как переключаемые метрики, финальную — утвердить с заказчиком |
| Низкое качество мастер-данных SKU и камер | Высокая | Высокое | Жёсткая валидация при импорте, авто-создание SKU опционально (настройка политики) |
| Разрыв между snapshot-данными и транзакционными отгрузками | Средняя | Среднее | Хранить только фактические снимки, не достраивать календарную серию (режим утвердить) |
| Рост нагрузки при больших объёмах | Средняя | Высокое | Materialized views + nightly refresh для агрегатов, партиционирование факт-таблиц по дате |

### 4.2 Архитектурные рекомендации

1. **Импорт не должен блокировать API.** Выполнять ETL в фоновом процессе (Celery / background task).
2. **Все формулы KPI — в отдельном сервисном слое**, не в SQL и не в контроллерах.
3. **На каждый этап импорта — своя транзакция.** Commit должен быть идемпотентным (upsert по natural_key).
4. **API должен возвращать pydantic-схемы**, а не сырые ORM-объекты.
5. **Dashboard-запросы должны ходить в materialized views**, а не в сырые факт-таблицы.
6. **Frontend должен уметь сериализовать состояние фильтров в URL** (query params), чтобы сохранять аналитический контекст.

---

## 5. Открытые вопросы (требуют ответа заказчика)

| № | Вопрос | Влияние на архитектуру |
|---|---|---|
| 1 | Что считается «эффективностью SKU»? | Выбор финальной формулы KPI |
| 2 | Есть ли в 1С привязка к конкретному паллетоместу или только к камере/зоне? | Заполнение pallet_location_id в фактах |
| 3 | Данные импортируются ежедневными snapshot-файлами или транзакционными событиями? | Структура ETL и периодичность обновления |
| 4 | Допускается ли авто-создание новых SKU при импорте? | Логика валидации: жёсткая ошибка vs авто-создание |
| 5 | Какой объём исторических данных нужен в первой версии? | Стратегия партиционирования и хранения |
| 6 | Нужен ли мультискладской режим в релизе 1? | Схема данных уже поддерживает; влияет на UI-фильтры |
| 7 | Требуется ли экспорт данных обратно в XLSX? | Отложено, архитектура должна позволять |
| 8 | Нужны ли уведомления о перегрузе камеры / дефиците мест? | Дополнительный модуль нотификаций |

---

## 6. Acceptance Criteria (приёмка архитектуры)

| № | Критерий | Проверка |
|---|---|---|
| AC-ARC-1 | Все 11 сущностей описаны и имеют чёткие связи | Ревизия ER-диаграммы |
| AC-ARC-2 | Статусная модель импорта покрывает все 7 состояний | Таблица состояний + переходы |
| AC-ARC-3 | API-контракт покрывает все разделы из ТЗ (§13) | Сверка endpoint list |
| AC-ARC-4 | ETL-конвейер описан по шагам с атомарными операциями | 9 шагов из §15.1 |
| AC-ARC-5 | Модульная структура покрывает frontend и backend | Карта модулей |
| AC-ARC-6 | Все риски из ТЗ (§25) отражены с рекомендациями | Таблица рисков |
| AC-ARC-7 | Все открытые вопросы из ТЗ (§24) перенесены | Таблица вопросов |
| AC-ARC-8 | Архитектура не смешивает факты, предположения и рекомендации | Каждый раздел имеет чёткий заголовок |

### Definition of Done (Architecture)
- [ ] ER-диаграмма утверждена (нет отсутствующих связей)
- [ ] Модульная структура зафиксирована (нет «серых зон»)
- [ ] API-контракт согласован с frontend-разработчиком
- [ ] ETL-конвейер не имеет двусмысленных переходов между статусами
- [ ] Риски документированы, по каждому есть рекомендация
- [ ] Открытые вопросы эскалированы заказчику
- [ ] Coding-агент может начать реализацию БЕЗ угадывания

---

## 7. Traceability (трассировка к ТЗ)

| Раздел handoff | Ссылка на раздел ТЗ |
|---|---|
| 1. Domain Model | §7, §8 |
| 2. ER-диаграмма | §7.1, §7.2 |
| 3. Модули системы | §5, §11, §13, §15 |
| 4. Риски | §25 |
| 5. Открытые вопросы | §24 |
| 6. Acceptance Criteria | §21 |

---

**Составил:** Анатолий, AI-агент-аналитик  
**Передаётся:** coding-агенту для реализации Этапа 2 (Data Foundation) и Этапа 3 (Backend)  
**Связанный документ:** db_schema_handoff.md (DDL, индексы, materialized views)
