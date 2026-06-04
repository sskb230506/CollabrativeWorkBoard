import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { Avatar } from '@components/ui/Avatar';
import { useSocket } from '@context/SocketContext';
import type { User } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Topbar
//
// Top bar containing server status and the user profile menu.
// Handles clicking outside to dismiss the user settings dropdown.
// ─────────────────────────────────────────────────────────────────────────────

interface TopbarProps {
  user: User | null;
}

export const Topbar: React.FC<TopbarProps> = ({ user }) => {
  const { logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-800 bg-surface-950/80 px-6 backdrop-blur-sm relative z-50">
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

      {/* Right: User Menu Dropdown */}
      {user && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-surface-900 transition-colors focus:outline-none"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
            <span className="hidden sm:inline text-sm font-medium text-surface-200">{user.name}</span>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-surface-800 bg-surface-900 shadow-2xl py-1 text-left focus:outline-none z-50">
              {/* User info */}
              <div className="px-4 py-2.5 border-b border-surface-800">
                <p className="text-sm font-semibold text-surface-100 truncate">{user.name}</p>
                <p className="text-xs text-surface-400 truncate mt-0.5">{user.email}</p>
              </div>

              {/* Actions */}
              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-surface-300 hover:bg-surface-800 hover:text-surface-100 transition-colors"
                >
                  <Settings size={15} />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    void handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-300 hover:bg-surface-800 hover:text-red-400 transition-colors text-left"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
