# Stage 1: builder
FROM python:3.11-slim AS builder

WORKDIR /app

# Установка системных зависимостей для psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: runtime
FROM python:3.11-slim

WORKDIR /app

# Копируем установленные пакеты
COPY --from=builder /install /usr/local

# Устанавливаем только runtime-зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Копируем код приложения
COPY . .

# Создаём директорию для загрузок
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

EXPOSE 8000

# Ожидание БД + запуск миграций + запуск сервера
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
