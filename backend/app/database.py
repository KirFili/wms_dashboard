"""
Модуль инициализации базы данных.
Асинхронный движок SQLAlchemy, фабрика сессий, Base для моделей.
"""

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Асинхронный движок
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

# Фабрика сессий
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Базовый класс для всех моделей SQLAlchemy."""

    pass


async def get_db() -> AsyncSession:
    """Зависимость FastAPI: предоставляет асинхронную сессию БД."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Инициализация БД — создание таблиц (для разработки).
    В production должны использоваться миграции Alembic."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)