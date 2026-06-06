import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useBoards } from '@features/boards/hooks/useBoards';
import { useActiveOrg } from '@hooks/useActiveOrg';
import { organizationsApi } from '@api/organizations.api';
import { cn } from '@utils/cn';
import { useSocket } from '@context/SocketContext';
import { Avatar } from '@components/ui/Avatar';
import type { Board } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
//
// Fixed left-side navigation showing:
//   - App logo + organization dropdown switcher
//   - Primary navigation (Boards, Settings)
//   - Board list for the active organization
//
// Board list is fetched from React Query; socket events keep it fresh.
// ─────────────────────────────────────────────────────────────────────────────

export const Sidebar: React.FC = () => {
  const { activeOrgId, setActiveOrgId } = useActiveOrg();
  const { data: boards } = useBoards(activeOrgId ?? '');

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
  });

  const activeOrg = orgs?.find((o) => o.id === activeOrgId);
  const { orgPresence } = useSocket();

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-surface-800 bg-surface-950">
      {/* Brand / Workspace Switcher */}
      <div className="flex h-14 items-center gap-2 border-b border-surface-800 px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-600">
          <LayoutDashboard size={15} className="text-white" />
        </div>
        {orgs && orgs.length > 1 ? (
          <select
            value={activeOrgId ?? ''}
            onChange={(e) => setActiveOrgId(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-surface-100 focus:outline-none cursor-pointer pr-4"
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id} className="bg-surface-900 text-surface-100">
                {org.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-semibold tracking-tight text-surface-100 truncate">
            {activeOrg?.name ?? 'CollabBoard'}
          </span>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5 px-2 pt-3">
        <SidebarLink to="/boards" icon={<LayoutDashboard size={16} />} label="Boards" />
        <SidebarLink to="/settings" icon={<Settings size={16} />} label="Settings" />
      </nav>

      {/* Board list */}
      {boards && boards.length > 0 && (
        <div className="mt-4 px-3">
          <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-widest text-surface-500">
            Boards
          </p>
          <ul className="flex flex-col gap-0.5">
            {boards.map((board: Board) => (
              <li key={board.id}>
                <NavLink
                  to={`/boards/${board.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-primary-600/20 text-primary-300'
                        : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200',
                    )
                  }
                >
                  <span className="truncate">{board.name}</span>
                  <ChevronRight size={13} className="shrink-0 opacity-50" />
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Online Collaborators */}
      {orgPresence && orgPresence.length > 0 && (
        <div className="mt-6 px-3 border-t border-surface-800/50 pt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-surface-500">
              Online ({orgPresence.length})
            </p>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-priority-low opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-priority-low"></span>
            </span>
          </div>
          <ul className="flex flex-col gap-1.5 overflow-y-auto max-h-48 pr-1">
            {orgPresence.map((p) => {
              const viewingBoard = boards?.find((b) => b.id === p.boardId);
              return (
                <li key={p.userId} className="flex items-center gap-2 px-1 py-0.5 animate-fadeIn">
                  <div className="relative">
                    <Avatar name={p.name ?? 'Unknown'} avatarUrl={p.avatarUrl} size="xs" />
                    <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-priority-low ring-1 ring-surface-950" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-surface-300 truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-surface-500 truncate">
                      {viewingBoard ? `Viewing ${viewingBoard.name}` : 'Browsing'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />
    </aside>
  );
};

const SidebarLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      cn(
        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-600/20 text-primary-300'
          : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200',
      )
    }
  >
    {icon}
    {label}
  </NavLink>
);
