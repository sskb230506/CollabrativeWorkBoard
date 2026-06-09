import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  UserPlus,
  MessageSquare,
  Calendar,
  Check,
  CheckCheck,
  Inbox,
} from 'lucide-react';
import { useActiveOrg } from '@hooks/useActiveOrg';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../hooks/useNotifications';
import type { Notification } from '@appTypes';
import { cn } from '@utils/cn';

export const NotificationCenter: React.FC = () => {
  const { activeOrgId } = useActiveOrg();
  const orgId = activeOrgId ?? '';
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useNotifications(orgId);
  const markAsReadMutation = useMarkNotificationAsRead(orgId);
  const markAllAsReadMutation = useMarkAllNotificationsAsRead(orgId);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    // Mark as read
    if (!n.isRead) {
      await markAsReadMutation.mutateAsync(n.id);
    }
    setIsOpen(false);

    // If metadata contains boardId and cardId, navigate to that card
    if (n.metadata?.boardId && n.metadata?.cardId) {
      navigate(`/boards/${n.metadata.boardId}?cardId=${n.metadata.cardId}`);
    } else if (n.metadata?.boardId) {
      navigate(`/boards/${n.metadata.boardId}`);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'assignment':
        return <UserPlus size={14} className="text-blue-400" />;
      case 'mention':
        return <MessageSquare size={14} className="text-purple-400" />;
      case 'due_date_reminder':
        return <Calendar size={14} className="text-amber-400" />;
      default:
        return <Bell size={14} className="text-surface-400" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 600);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-xl border border-surface-850 bg-surface-900/60 shadow-sm backdrop-blur-sm transition-all duration-200',
          isOpen
            ? 'bg-surface-800 text-surface-50 border-surface-700/60'
            : 'text-surface-400 hover:bg-surface-850 hover:text-surface-200 hover:border-surface-750',
          'focus:outline-none'
        )}
        aria-label="Toggle notifications dropdown"
        aria-expanded={isOpen}
      >
        <Bell size={16} className={cn(isOpen && 'animate-wiggle')} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[9px] font-bold text-white ring-2 ring-surface-950">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-surface-800 bg-surface-900 shadow-2xl backdrop-blur-md focus:outline-none z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-800/80 px-4 py-3 bg-surface-950/40">
            <div>
              <h3 className="text-sm font-semibold text-surface-100">Notifications</h3>
              <p className="text-[10px] text-surface-450 mt-0.5">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notifications`
                  : 'No unread notifications'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary-400 hover:bg-primary-500/10 active:bg-primary-500/15 disabled:opacity-50 transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-surface-850/60">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-950 border border-surface-850 text-surface-500 shadow-inner">
                  <Inbox size={20} />
                </div>
                <h4 className="mt-3 text-xs font-semibold text-surface-300">All caught up</h4>
                <p className="mt-1 max-w-[200px] text-[10px] text-surface-500">
                  When you get assigned to cards or mentioned, they will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'group relative flex gap-3 px-4 py-3.5 transition-colors cursor-pointer text-left',
                    n.isRead
                      ? 'hover:bg-surface-850/40'
                      : 'bg-primary-500/[0.03] hover:bg-primary-500/[0.06]'
                  )}
                >
                  {/* Left indicator dot for unread status */}
                  {!n.isRead && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary-500" />
                  )}

                  {/* Icon Wrapper */}
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-surface-800 bg-surface-950/60">
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={cn(
                        'text-xs font-semibold truncate',
                        n.isRead ? 'text-surface-200' : 'text-surface-50'
                      )}>
                        {n.title ?? 'Notification'}
                      </p>
                      <span className="text-[9px] text-surface-500 whitespace-nowrap pt-0.5">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className={cn(
                      'mt-1 text-[11px] leading-relaxed break-words',
                      n.isRead ? 'text-surface-400' : 'text-surface-200 font-medium'
                    )}>
                      {n.body}
                    </p>
                  </div>

                  {/* Quick mark as read button */}
                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void markAsReadMutation.mutate(n.id);
                      }}
                      disabled={markAsReadMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md border border-surface-800 bg-surface-900 text-surface-400 hover:text-primary-400 hover:border-primary-500/30 transition-all self-center"
                      title="Mark as read"
                    >
                      <Check size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
