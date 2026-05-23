import React, { useState, useRef, useCallback } from 'react';
import { ErrorState as Error } from '../common/StatusBadge';
import type { ImportBatch } from '../../types';

interface UploadZoneProps {
  onUpload: (file: File, importType: string) => Promise<ImportBatch>;
  onSuccess: () => void;
}

const IMPORT_TYPES = [
  { value: 'stock_snapshot', label: 'Снимок склада' },
  { value: 'shipment', label: 'Отгрузки' },
  { value: 'movement', label: 'Перемещения' },
];

export function UploadZone({ onUpload, onSuccess }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState('stock_snapshot');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    setError(null);
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      setFile(f);
    } else if (f) {
      setError('Поддерживаются только файлы .xlsx и .xls');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] || null);
  }, [handleFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      await onUpload(file, importType);
      setFile(null);
      onSuccess();
    } catch (err: unknown) {
      setError((err as Error).message || 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`chart-container flex flex-col items-center justify-center py-12 cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="text-center space-y-2">
            <svg className="h-10 w-10 mx-auto text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>{file.name}</p>
            <p className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>{(file.size / 1024).toFixed(1)} КБ</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="btn-secondary text-xs px-2 py-1"
            >
              Убрать
            </button>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <svg className="h-10 w-10 mx-auto" style={{ color: 'rgb(var(--color-text-muted))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm" style={{ color: 'rgb(var(--color-text-primary))' }}>
              Перетащите файл сюда или <span className="text-blue-600 font-medium">выберите</span>
            </p>
            <p className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>Поддерживаются .xlsx и .xls</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="chart-container space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Тип импорта</label>
          <select value={importType} onChange={(e) => setImportType(e.target.value)} className="form-select w-56 text-sm">
            {IMPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {error && <Error message={error} />}

        <button type="submit" disabled={!file || isUploading} className="btn-primary">
          {isUploading ? 'Загрузка...' : 'Загрузить файл'}
        </button>
      </form>
    </div>
  );
}