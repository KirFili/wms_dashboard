"""
API слой WMS Dashboard.
Все роутеры подключаются в main.py.
"""

from app.api import auth, dashboard, chambers, skus, imports, analytics, audit

__all__ = ["auth", "dashboard", "chambers", "skus", "imports", "analytics", "audit"]