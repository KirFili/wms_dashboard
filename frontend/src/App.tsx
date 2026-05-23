import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { MainLayout } from './components/Layout/MainLayout';
import { Loading } from './components/common/Loading';
import { DashboardPage } from './components/Dashboard/DashboardPage';
import { LoginPage } from './components/Login/LoginPage';
import { ChambersPage } from './components/Chambers/ChambersPage';
import { ChamberForm } from './components/Chambers/ChamberForm';
import { PalletLocationList } from './components/Chambers/PalletLocationList';
import { SKUPage } from './components/SKU/SKUPage';
import { SKUForm } from './components/SKU/SKUForm';
import { ImportsPage } from './components/Imports/ImportsPage';
import { AnalyticsPage } from './components/Analytics/AnalyticsPage';
import { SKUDetail } from './components/Analytics/SKUDetail';
import { AuditPage } from './components/Audit/AuditPage';
import { SettingsPage } from './components/Settings/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <MainLayout>
        <Loading text="Проверка авторизации..." />
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ChamberEditWrapper() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return (
    <div className="space-y-4">
      <ChamberForm />
      <PalletLocationList chamberId={id} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chambers"
        element={
          <ProtectedRoute>
            <ChambersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chambers/new"
        element={
          <ProtectedRoute>
            <ChamberForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chambers/:id"
        element={
          <ProtectedRoute>
            <ChamberEditWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/skus"
        element={
          <ProtectedRoute>
            <SKUPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/skus/new"
        element={
          <ProtectedRoute>
            <SKUForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/skus/:id"
        element={
          <ProtectedRoute>
            <SKUForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/imports"
        element={
          <ProtectedRoute>
            <ImportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics/:skuId"
        element={
          <ProtectedRoute>
            <SKUDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
