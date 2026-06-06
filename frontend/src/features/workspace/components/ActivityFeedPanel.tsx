import React, { useState } from 'react';
import { X, MessageSquare, Clock, PlusCircle, RefreshCw, Move, Kanban, Filter } from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { Spinner } from '@components/ui/Spinner';
import type { ActivityLog } from '@appTypes';

interface ActivityFeedPanelProps {
  orgId: string;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityFeedPanel: React.FC<ActivityFeedPanelProps> = ({
  orgId,
  boardId,
  isOpen,
  onClose,
}) => {
  const { data: activities = [], isLoading } = useActivities(orgId);
  const [filterThisBoard, setFilterThisBoard] = useState(true);

  if (!isOpen) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'board.created':
        return <Kanban size={13} className="text-blue-400" />;
      case 'card.created':
        return <PlusCircle size={13} className="text-green-400" />;
      case 'card.updated':
        return <RefreshCw size={13} className="text-yellow-400" />;
      case 'card.moved':
        return <Move size={13} className="text-purple-400" />;
      case 'comment.created':
        return <MessageSquare size={13} className="text-pink-400" />;
      default:
        return <Clock size={13} className="text-surface-400" />;
    }
  };

  const formatActivityAction = (activity: ActivityLog) => {
    const actorName = activity.user?.name || 'Someone';
    const boardName = activity.board?.name || (activity.metadata as Record<string, unknown> | null)?.boardName as string || 'a board';
    const cardTitle = activity.card?.title || (activity.metadata as Record<string, unknown> | null)?.cardTitle as string || 'a card';

    switch (activity.action) {
      case 'board.created':
        return {
          actor: actorName,
          actionText: 'created board',
          resource: boardName,
        };
      case 'card.created':
        return {
          actor: actorName,
          actionText: 'created card',
          resource: cardTitle,
        };
      case 'card.updated':
        return {
          actor: actorName,
          actionText: 'updated card',
          resource: cardTitle,
        };
      case 'card.moved':
        return {
          actor: actorName,
          actionText: 'moved card',
          resource: cardTitle,
        };
      case 'comment.created':
        return {
          actor: actorName,
          actionText: 'commented on card',
          resource: cardTitle,
        };
      default:
        return {
          actor: actorName,
          actionText: activity.action,
          resource: '',
        };
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' ' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      );
    } catch {
      return '';
    }
  };

  const filtered = filterThisBoard
    ? activities.filter((a) => a.boardId === boardId)
    : activities;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-80 md:w-96 border-l border-surface-850 bg-surface-950 p-6 shadow-2xl flex flex-col gap-5 transition-transform duration-300 transform translate-x-0">
        <div className="flex items-center justify-between border-b border-surface-850 pb-4">
          <div className="flex items-center gap-2.5">
            <Clock size={17} className="text-primary-500" />
            <h2 className="text-md font-semibold text-surface-100">Activity Feed</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between bg-surface-900/40 border border-surface-850/60 rounded-xl p-2 text-xs">
          <span className="text-surface-400 flex items-center gap-1.5 px-1 font-medium">
            <Filter size={12} /> Scope:
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterThisBoard(true)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterThisBoard
                  ? 'bg-primary-900 border border-primary-800 text-primary-300'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              This Board
            </button>
            <button
              onClick={() => setFilterThisBoard(false)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                !filterThisBoard
                  ? 'bg-primary-900 border border-primary-800 text-primary-300'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              All Org
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-1">
            {filtered.map((activity) => {
              const formatted = formatActivityAction(activity);
              return (
                <div
                  key={activity.id}
                  className="flex gap-3 text-xs bg-surface-900/35 border border-surface-900 rounded-xl p-3 hover:bg-surface-900/60 hover:border-surface-850/80 transition-all"
                >
                  {activity.user?.avatarUrl ? (
                    <img
                      src={activity.user.avatarUrl}
                      alt={activity.user.name}
                      className="h-7.5 w-7.5 rounded-full object-cover border border-surface-800 mt-0.5"
                    />
                  ) : (
                    <div className="h-7.5 w-7.5 rounded-full bg-surface-800 border border-surface-700/60 text-surface-300 font-semibold flex items-center justify-center uppercase mt-0.5">
                      {activity.user?.name?.slice(0, 2) || '??'}
                    </div>
                  )}
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="leading-relaxed">
                      <span className="font-semibold text-surface-200">{formatted.actor}</span>{' '}
                      <span className="text-surface-400">{formatted.actionText}</span>{' '}
                      {formatted.resource && (
                        <span className="font-medium text-primary-400">{formatted.resource}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-surface-500 mt-0.5">
                      {getActionIcon(activity.action)}
                      <span>{formatTime(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center text-surface-500 py-12 italic text-xs">
                No activity logged yet in this scope.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
