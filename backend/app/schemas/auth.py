"""
Pydantic-схемы для модуля авторизации.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


class LoginRequest(BaseModel):
    """Запрос на вход в систему."""

    username: str = Field(..., min_length=1, max_length=100, description="Имя пользователя")
    password: str = Field(..., min_length=1, description="Пароль")


class TokenResponse(BaseModel):
    """Ответ с JWT-токеном."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Тип токена")
    expires_at: datetime = Field(..., description="Дата истечения токена")


class UserResponse(BaseModel):
    """Информация о текущем пользователе."""

    id: UUID
    username: str
    email: str | None = None
    role: str
    is_active: bool
    last_login: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
