import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  lastUpdated?: string | null;
  onRefresh?: () => void;
}

export function MainLayout({ children, lastUpdated, onRefresh }: MainLayoutProps) {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col ml-sidebar overflow-hidden">
        <Header lastUpdated={lastUpdated || null} onRefresh={onRefresh} />
        <main className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: 'rgb(var(--color-bg-secondary))' }}>
          {children}
        </main>
      </div>
    </div>
  );
}