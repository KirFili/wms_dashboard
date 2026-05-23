import React from 'react';

export function Loading({ text = 'Загрузка...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      <span className="text-sm text-slate-500 dark:text-slate-400">{text}</span>
    </div>
  );
}

export function Empty({ text = 'Нет данных', action }: { text?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <span className="text-sm text-slate-500 dark:text-slate-400">{text}</span>
      {action && (
        <button onClick={action.onClick} className="btn-primary text-xs">
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message = 'Произошла ошибка', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <span className="text-sm text-red-600 dark:text-red-400">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          Повторить
        </button>
      )}
    </div>
  );
}

export function StaleIndicator({ lastUpdated, onRefresh }: { lastUpdated: string | null; onRefresh?: () => void }) {
  if (!lastUpdated) return null;
  const date = new Date(lastUpdated);
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  const isStale = mins > 5;

  return (
    <span className={`inline-flex items-center gap-1 text-2xs tabular-nums ${isStale ? 'text-amber-500' : 'text-slate-400'}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${isStale ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
      {mins} мин. назад
      {onRefresh && (
        <button onClick={onRefresh} className="ml-1 hover:text-slate-600 dark:hover:text-slate-300" title="Обновить">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </button>
      )}
    </span>
  );
}

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const colorMap: Record<string, string> = {
    free: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    occupied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    blocked: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    unavailable: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    uploaded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    parsed: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    validated: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    imported: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rolled_back: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    valid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    admin: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    analyst: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <span className={`status-badge ${colorMap[status] || 'bg-slate-100 text-slate-700'} ${className}`}>
      {status}
    </span>
  );
}