"""
Alembic env.py — конфигурация миграций для WMS Dashboard.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from app.database import Base
from app.models import *  # noqa: F401, F403 — импорт всех моделей для autogenerate
from app.config import settings

# Alembic Config object
config = context.config

# Настройка логирования
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Переопределяем URL из .env
config.set_main_option("sqlalchemy.url", settings.database_url_sync)

# Метаданные моделей
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Запуск миграций в офлайн-режиме (без подключения к БД)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema="wms",
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Запуск миграций с подключением к БД."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table_schema="wms",
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()