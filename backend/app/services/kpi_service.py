"""
KPI-сервис — формулы эффективности склада и SKU.
Все расчёты собраны здесь согласно ТЗ §10.
"""

import math
from typing import Optional


class KPIService:
    """Сервис расчёта ключевых показателей эффективности."""

    # ──────────────────────────────────────────────
    # §10.1 Базовые показатели
    # ──────────────────────────────────────────────

    @staticmethod
    def occupancy_rate(occupied_locations: int, total_active_locations: int) -> float:
        """Процент заполненности склада.
        occupancy_rate = (occupied / total_active) * 100
        """
        if total_active_locations <= 0:
            return 0.0
        return round((occupied_locations / total_active_locations) * 100.0, 2)

    @staticmethod
    def free_rate(free_locations: int, total_active_locations: int) -> float:
        """Процент свободных мест.
        free_rate = (free / total_active) * 100
        """
        if total_active_locations <= 0:
            return 0.0
        return round((free_locations / total_active_locations) * 100.0, 2)

    @staticmethod
    def chamber_occupancy_rate(occupied: int, total: int) -> float:
        """Процент заполненности отдельной камеры."""
        if total <= 0:
            return 0.0
        return round((occupied / total) * 100.0, 2)

    # ──────────────────────────────────────────────
    # §10.2 Показатели по камерам
    # ──────────────────────────────────────────────

    @staticmethod
    def avg_chamber_occupancy(
        occupancy_list: list[float],
    ) -> float:
        """Средняя заполненность камеры за период."""
        if not occupancy_list:
            return 0.0
        return round(sum(occupancy_list) / len(occupancy_list), 2)

    @staticmethod
    def max_chamber_occupancy(
        occupancy_list: list[float],
    ) -> float:
        """Максимальная заполненность камеры за период."""
        if not occupancy_list:
            return 0.0
        return round(max(occupancy_list), 2)

    # ──────────────────────────────────────────────
    # §10.4 Вариант A: коэффициент оборачиваемости
    # ──────────────────────────────────────────────

    @staticmethod
    def turnover_efficiency(
        shipped_volume: float,
        avg_occupied_volume: float,
    ) -> Optional[float]:
        """Коэффициент оборачиваемости хранения.
        turnover = shipped_volume / avg_occupied_volume
        Чем выше, тем лучше SKU использует складскую ёмкость.
        """
        if avg_occupied_volume <= 0:
            return None
        return round(shipped_volume / avg_occupied_volume, 4)

    # ──────────────────────────────────────────────
    # §10.4 Вариант B: коэффициент складской нагрузки
    # ──────────────────────────────────────────────

    @staticmethod
    def storage_load_ratio(
        avg_occupied_locations: float,
        shipped_qty: float,
    ) -> Optional[float]:
        """Коэффициент складской нагрузки.
        ratio = avg_occupied_locations / shipped_qty
        Чем выше, тем больше мест требуется на единицу отгрузки (хуже).
        """
        if shipped_qty <= 0:
            return None
        return round(avg_occupied_locations / shipped_qty, 4)

    # ──────────────────────────────────────────────
    # §10.4 Вариант C: интегральный score
    # ──────────────────────────────────────────────

    @staticmethod
    def sku_efficiency_score(
        turnover: Optional[float],
        avg_occupied_locations: float,
        storage_days: int,
        w1: float = 0.5,
        w2: float = 0.3,
        w3: float = 0.2,
        max_turnover: float = 10.0,
        max_locations: float = 1000.0,
        max_storage_days: float = 365.0,
    ) -> float:
        """Интегральный score эффективности SKU.
        score = w1 * norm(turnover) - w2 * norm(avg_locations) - w3 * norm(storage_days)

        Все компоненты нормализуются к [0, 1] делением на configurable максимумы.
        """
        norm_turnover = min((turnover or 0.0) / max_turnover, 1.0)
        norm_locations = min(avg_occupied_locations / max_locations, 1.0)
        norm_storage = min(storage_days / max_storage_days, 1.0)

        score = w1 * norm_turnover - w2 * norm_locations - w3 * norm_storage
        return round(score, 4)

    # ──────────────────────────────────────────────
    # Вспомогательные методы
    # ──────────────────────────────────────────────

    @staticmethod
    def safe_divide(numerator: float, denominator: float) -> Optional[float]:
        """Безопасное деление (None при делении на 0)."""
        if denominator == 0:
            return None
        return numerator / denominator

    @staticmethod
    def safe_avg(values: list[float]) -> float:
        """Безопасное среднее арифметическое."""
        if not values:
            return 0.0
        return sum(values) / len(values)
