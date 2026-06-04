import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, ChevronRight } from 'lucide-react';
import { useBoards } from '@features/boards/hooks/useBoards';
import { useActiveOrg } from '@hooks/useActiveOrg';
import { cn } from '@utils/cn';
import type { Board } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
//
// Fixed left-side navigation showing:
//   - App logo + org name
//   - Primary navigation (Boards, Settings)
//   - Board list for the active organization
//
// Board list is fetched from React Query; socket events keep it fresh.
// ─────────────────────────────────────────────────────────────────────────────

export const Sidebar: React.FC = () => {
  const { activeOrgId } = useActiveOrg();
  const { data: boards } = useBoards(activeOrgId ?? '');

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-surface-800 bg-surface-950">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-surface-800 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600">
          <LayoutDashboard size={15} className="text-white" />
        </div>
        <span className="font-semibold tracking-tight text-surface-100">CollabBoard</span>
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
