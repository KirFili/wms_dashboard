import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../common/ThemeToggle';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      navigate('/');
    } catch {
      // error handled in context
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'rgb(var(--color-bg-secondary))' }}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-lg border p-8" style={{ backgroundColor: 'rgb(var(--color-card-bg))', borderColor: 'rgb(var(--color-card-border))' }}>
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white text-xs font-bold">
            WM
          </div>
          <span className="font-semibold text-lg">WMS Dashboard</span>
        </div>

        <h1 className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
          Управление складом
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="admin"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center">
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="mt-4 text-center text-2xs text-slate-400 dark:text-slate-500">
          admin / analyst / viewer
        </p>
      </div>
    </div>
  );
}