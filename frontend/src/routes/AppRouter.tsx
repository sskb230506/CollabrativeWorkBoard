import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthLayout } from '@layouts/AuthLayout';
import { AppLayout } from '@layouts/AppLayout';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { BoardsPage } from '@pages/BoardsPage';
import { WorkspacePage } from '@pages/WorkspacePage';
import { NotFoundPage } from '@pages/NotFoundPage';

// ─────────────────────────────────────────────────────────────────────────────
// Application Router
//
// Route hierarchy:
//   /                → redirect to /boards
//   /login           → LoginPage  (AuthLayout)
//   /register        → RegisterPage (AuthLayout)
//   /* protected */
//   /boards          → BoardsPage  (AppLayout)
//   /boards/:boardId → WorkspacePage (AppLayout — full bleed, no sidebar)
//   *                → 404 NotFoundPage
// ─────────────────────────────────────────────────────────────────────────────

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/boards" replace />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/boards/:boardId" element={<WorkspacePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);
