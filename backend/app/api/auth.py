"""
Роутер авторизации: /api/auth/*
Endpoints: login, logout, me
"""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Вход в систему: проверка логина/пароля, выдача JWT."""
    user = await AuthService.authenticate_user(
        db, request.username, request.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # Обновить last_login
    await AuthService.update_last_login(db, user)
    await AuditService.log(db, user.id, "login", "user", user.id)

    token = AuthService.create_access_token(user.id, user.role)
    expire = AuthService.get_token_expire_time()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_at=expire,
    )


@router.post("/logout")
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Выход из системы (аудит)."""
    await AuditService.log(
        db, current_user.id, "logout", "user", current_user.id
    )
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Получить информацию о текущем пользователе."""
    return UserResponse.model_validate(current_user)