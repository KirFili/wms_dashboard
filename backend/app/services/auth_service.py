"""
Сервис аутентификации.
JWT-токены, хеширование паролей через bcrypt/pgcrypto.
"""

import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User

# Контекст для хеширования паролей (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Сервис аутентификации и управления JWT."""

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Проверка пароля — bcrypt или SHA-256 (dev)."""
        import hashlib
        # bcrypt (passlib)
        if hashed_password.startswith("$2"):
            return pwd_context.verify(plain_password, hashed_password)
        # SHA-256 (dev/seed)
        if len(hashed_password) == 64:
            return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def hash_password(plain_password: str) -> str:
        """Хеширование пароля через bcrypt."""
        return pwd_context.hash(plain_password)

    @staticmethod
    def create_access_token(user_id: uuid.UUID, role: str) -> str:
        """Создание JWT access токена."""
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
        to_encode = {
            "sub": str(user_id),
            "role": role,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

    @staticmethod
    def decode_access_token(token: str) -> dict | None:
        """Декодирование JWT токена. Возвращает None при ошибке."""
        try:
            payload = jwt.decode(
                token, settings.secret_key, algorithms=[settings.algorithm]
            )
            return payload
        except JWTError:
            return None

    @staticmethod
    def get_token_expire_time() -> datetime:
        """Возвращает время истечения токена."""
        return datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    @staticmethod
    async def authenticate_user(
        db: AsyncSession, username: str, password: str
    ) -> User | None:
        """Аутентификация пользователя по логину и паролю."""
        result = await db.execute(
            select(User).where(User.username == username, User.is_active == True)
        )
        user = result.scalar_one_or_none()
        if not user:
            return None
        if not AuthService.verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    async def update_last_login(db: AsyncSession, user: User) -> None:
        """Обновление времени последнего входа."""
        user.last_login = datetime.now(timezone.utc)
