import { Outlet } from 'react-router-dom';
import { Sidebar } from '@components/navigation/Sidebar';
import { Topbar } from '@components/navigation/Topbar';
import { useAuth } from '@context/AuthContext';
import { SocketProvider } from '@context/SocketContext';
import { useActiveOrg } from '@hooks/useActiveOrg';

// ─────────────────────────────────────────────────────────────────────────────
// AppLayout
//
// Shell for all authenticated routes. Composed of:
//   - Sidebar (fixed left, org nav + board list)
//   - Topbar (fixed top, search, user menu)
//   - Main content area (Outlet)
//
// The SocketProvider is mounted here (not at the root) so it can receive
// `organizationId`. It only connects when the user is in an org context.
// ─────────────────────────────────────────────────────────────────────────────

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const { activeOrgId } = useActiveOrg();

  return (
    <SocketProvider organizationId={activeOrgId}>
      <div className="flex h-screen w-screen overflow-hidden bg-surface-950 text-surface-100">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={user} />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SocketProvider>
  );
};
