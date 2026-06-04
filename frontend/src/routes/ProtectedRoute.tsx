import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { Spinner } from '@components/ui/Spinner';

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute
//
// Renders the child route only if the user is authenticated.
// While the session is being restored (isLoading), shows a full-screen
// spinner — this prevents the login redirect flash on hard reload.
// ─────────────────────────────────────────────────────────────────────────────

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-950">
        <Spinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
