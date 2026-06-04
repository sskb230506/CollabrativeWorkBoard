import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@components/navigation/Sidebar';
import { Topbar } from '@components/navigation/Topbar';
import { useAuth } from '@context/AuthContext';
import { SocketProvider } from '@context/SocketContext';
import { useActiveOrg } from '@hooks/useActiveOrg';
import { organizationsApi } from '@api/organizations.api';
import { Spinner } from '@components/ui/Spinner';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { LayoutDashboard } from 'lucide-react';

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
//
// Self-healing flow:
//   1. Fetches all organizations the user belongs to.
//   2. If they have none (e.g. new signups), shows a screen to create their first workspace.
//   3. Auto-selects the first organization if none is active or if the active one is invalid.
// ─────────────────────────────────────────────────────────────────────────────

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const { activeOrgId, setActiveOrgId } = useActiveOrg();
  const queryClient = useQueryClient();

  const { data: orgs, isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
    enabled: !!user,
  });

  const createOrgMutation = useMutation({
    mutationFn: (name: string) => organizationsApi.create({ name }),
    onSuccess: async (newOrg) => {
      await queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setActiveOrgId(newOrg.id);
    },
  });

  const [newOrgName, setNewOrgName] = useState('');

  // Auto-select first organization if none is selected, or if the selected one is invalid
  useEffect(() => {
    if (orgs && orgs.length > 0) {
      const isValid = orgs.some((o) => o.id === activeOrgId);
      if (!activeOrgId || !isValid) {
        setActiveOrgId(orgs[0].id);
      }
    }
  }, [orgs, activeOrgId, setActiveOrgId]);

  if (orgsLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950">
        <Spinner size="lg" />
      </div>
    );
  }

  // If user has no organizations, show workspace creation screen
  if (!orgs || orgs.length === 0) {
    const handleCreateOrg = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newOrgName.trim()) return;
      try {
        await createOrgMutation.mutateAsync(newOrgName.trim());
      } catch (err) {
        console.error('Failed to create organization:', err);
      }
    };

    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950 p-4">
        <div className="w-full max-w-md rounded-2xl border border-surface-800 bg-surface-900/50 p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-surface-100">Create your workspace</h2>
              <p className="mt-1 text-sm text-surface-400">
                You need a workspace (organization) to start collaborating.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateOrg} className="mt-6 flex flex-col gap-4">
            <Input
              label="Workspace Name"
              placeholder="e.g. Acme Corp or Design Team"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              required
            />
            <Button
              type="submit"
              fullWidth
              isLoading={createOrgMutation.isPending}
              disabled={!newOrgName.trim()}
            >
              Create Workspace
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // If orgs exist, but activeOrgId is still setting, show loader
  if (!activeOrgId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950">
        <Spinner size="lg" />
      </div>
    );
  }

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
