import { LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { Avatar } from '@components/ui/Avatar';
import { useSocket } from '@context/SocketContext';
import type { User } from '@appTypes';

interface TopbarProps {
  user: User | null;
}

export const Topbar: React.FC<TopbarProps> = ({ user }) => {
  const { logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-800 bg-surface-950/80 px-6 backdrop-blur-sm">
      {/* Left: connection status */}
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full transition-colors ${
            isConnected ? 'bg-priority-low' : 'bg-surface-500'
          }`}
          title={isConnected ? 'Connected' : 'Offline'}
        />
        <span className="text-xs text-surface-400">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Right: user menu */}
      {user && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
            <span className="text-sm font-medium text-surface-200">{user.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="rounded-lg p-2 text-surface-400 transition hover:bg-surface-800 hover:text-surface-200"
              title="Profile"
            >
              <UserIcon size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-surface-400 transition hover:bg-surface-800 hover:text-red-400"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
