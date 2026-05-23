"""
WMS Dashboard — FastAPI точка входа.
Подключает все роутеры, CORS middleware, lifespan для БД.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api import auth, dashboard, chambers, skus, imports, analytics, audit
from app.config import settings
from app.database import engine, init_db, async_session_factory


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan: инициализация БД + seed-пользователь."""
    # Создаём таблицы (если Alembic ещё не отработал)
    await init_db()

    # Seed: создаём админа, если нет ни одного пользователя
    from app.models.user import User
    from sqlalchemy import select, func
    import hashlib, uuid as _uuid

    async with async_session_factory() as session:
        result = await session.execute(select(func.count()).select_from(User))
        count = result.scalar()
        if count == 0:
            session.add(User(
                id=_uuid.uuid4(),
                username="admin",
                password_hash=hashlib.sha256("admin".encode()).hexdigest(),
                role="admin",
                is_active=True,
            ))
            await session.commit()

    yield
    # При завершении — закрываем движок
    await engine.dispose()


def create_app() -> FastAPI:
    """Фабрика приложения FastAPI."""

    app = FastAPI(
        title=settings.app_title,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Подключение роутеров
    app.include_router(auth.router)
    app.include_router(dashboard.router)
    app.include_router(chambers.router)
    app.include_router(skus.router)
    app.include_router(imports.router)
    app.include_router(analytics.router)
    app.include_router(audit.router)

    # Раздача фронтенда (SPA)
    from pathlib import Path
    static_dir = Path(__file__).parent / "static"
    if static_dir.exists():
        app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
