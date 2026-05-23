import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useThemeContext } from '../../context/ThemeContext';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useThemeContext();

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Настройки</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--color-text-muted))' }}>Настройки интерфейса и профиля</p>
      </div>

      {/* Profile */}
      <div className="chart-container space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Профиль</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>Логин</span>
            <p style={{ color: 'rgb(var(--color-text-primary))' }}>{user?.username || '—'}</p>
          </div>
          <div>
            <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>Роль</span>
            <p style={{ color: 'rgb(var(--color-text-primary))' }}>{user?.role || '—'}</p>
          </div>
          <div>
            <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>Email</span>
            <p style={{ color: 'rgb(var(--color-text-primary))' }}>{user?.email || '—'}</p>
          </div>
          <div>
            <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>Последний вход</span>
            <p style={{ color: 'rgb(var(--color-text-primary))' }}>{user?.last_login ? new Date(user.last_login).toLocaleString('ru') : '—'}</p>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="chart-container space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Тема оформления</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              theme === 'light' ? 'bg-blue-600 text-white' : 'btn-secondary'
            }`}
          >
            <svg className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            Светлая
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              theme === 'dark' ? 'bg-blue-600 text-white' : 'btn-secondary'
            }`}
          >
            <svg className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
            Тёмная
          </button>
        </div>
      </div>

      {/* Placeholder for future settings */}
      <div className="chart-container space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Дополнительно</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
            <div>
              <span className="text-sm" style={{ color: 'rgb(var(--color-text-primary))' }}>Автообновление</span>
              <p className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>Автоматически обновлять данные каждые 60 секунд</p>
            </div>
            <div className="w-10 h-5 rounded-full bg-slate-300 dark:bg-slate-600 relative">
              <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
            <div>
              <span className="text-sm" style={{ color: 'rgb(var(--color-text-primary))' }}>Уведомления о завершении импорта</span>
              <p className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>Показывать уведомление после успешного импорта</p>
            </div>
            <div className="w-10 h-5 rounded-full bg-slate-300 dark:bg-slate-600 relative">
              <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm" style={{ color: 'rgb(var(--color-text-primary))' }}>Компактный вид таблиц</span>
              <p className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>Уменьшить отступы в таблицах для большей плотности</p>
            </div>
            <div className="w-10 h-5 rounded-full bg-slate-300 dark:bg-slate-600 relative">
              <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </div>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="text-xs text-center" style={{ color: 'rgb(var(--color-text-muted))' }}>
        WMS Dashboard v1.0.0
      </div>
    </div>
  );
}