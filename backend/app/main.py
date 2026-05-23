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
from app.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan: подключение / отключение БД."""
    # При старте — движок уже создан в database.py
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
