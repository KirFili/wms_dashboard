"""
Конфигурация приложения WMS Dashboard.
Параметры читаются из переменных окружения / .env-файла.
"""

from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    """Настройки приложения."""

    # База данных
    database_url: str = "postgresql+asyncpg://wms_user:wms_password@localhost:5432/wms_dashboard"
    database_url_sync: str = "postgresql+psycopg2://wms_user:wms_password@localhost:5432/wms_dashboard"

    # JWT
    secret_key: str = "change-me-to-a-secure-random-string-at-least-32-chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    # Приложение
    app_title: str = "WMS Dashboard"
    app_version: str = "1.0.0"
    debug: bool = False
    cors_origins_raw: str = '["http://localhost:3000","http://localhost:5173"]'

    # Импорт
    max_upload_size_mb: int = 20
    upload_dir: str = "./uploads"

    @property
    def cors_origins(self) -> List[str]:
        """Разбирает JSON-строку CORS_ORIGINS в список."""
        return json.loads(self.cors_origins_raw)

    @property
    def max_upload_size(self) -> int:
        """Максимальный размер загружаемого файла в байтах."""
        return self.max_upload_size_mb * 1024 * 1024

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


settings = Settings()
