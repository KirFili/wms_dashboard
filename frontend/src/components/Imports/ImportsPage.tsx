import React, { useState, useCallback } from 'react';
import { useImports } from '../../hooks/useImports';
import { UploadZone } from './UploadZone';
import { ImportHistory } from './ImportHistory';

export function ImportsPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const { batches, total, isLoading, error, refetch, upload } = useImports();

  const handleUploadSuccess = useCallback(() => {
    refetch();
    setActiveTab('history');
  }, [refetch]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Импорт данных</h1>
        <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--color-text-muted))' }}>Загрузка XLSX-файлов склада</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 rounded-md border overflow-hidden w-fit" style={{ borderColor: 'rgb(var(--color-border))' }}>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          style={activeTab !== 'upload' ? { color: 'rgb(var(--color-text-secondary))' } : {}}
        >
          Загрузка
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          style={activeTab !== 'history' ? { color: 'rgb(var(--color-text-secondary))' } : {}}
        >
          История ({total})
        </button>
      </div>

      {activeTab === 'upload' ? (
        <UploadZone onUpload={upload} onSuccess={handleUploadSuccess} />
      ) : (
        <ImportHistory
          batches={batches}
          total={total}
          isLoading={isLoading}
          error={error}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}