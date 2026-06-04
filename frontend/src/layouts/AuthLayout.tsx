import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// AuthLayout
//
// Full-screen gradient background with a centred glass card panel.
// Already-authenticated users are redirected to /boards.
// ─────────────────────────────────────────────────────────────────────────────

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/boards" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-950">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-primary-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-violet-700/20 blur-[120px]" />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md animate-slide-up px-4">
        <div className="rounded-2xl border border-surface-700/60 bg-surface-900/70 p-8 shadow-glass backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              CollabBoard
            </span>
            <p className="mt-1 text-sm text-surface-400">Real-time collaborative workspace</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
