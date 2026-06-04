import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { PriorityBadge } from '@components/ui/PriorityBadge';
import { AvatarGroup } from '@components/ui/Avatar';
import { CardDetailsModal } from './CardDetailsModal';
import type { Card, CardAssignee } from '@appTypes';
import { cn } from '@utils/cn';

interface CardItemProps {
  card: Card;
  orgId: string;
  boardId: string;
}

const isOverdue = (dueDate: string | null) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const CardItem: React.FC<CardItemProps> = ({ card, orgId, boardId }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const overdue = isOverdue(card.dueDate);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.effectAllowed = 'move';
    // Delays opacity shift so the drag image/ghost remains fully visible
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsModalOpen(true);
          }
        }}
        className={cn(
          'group flex flex-col gap-2.5 rounded-xl border bg-surface-800/80 p-3',
          'cursor-grab active:cursor-grabbing transition-all duration-150 select-none',
          isDragging
            ? 'opacity-30 border-dashed border-primary-500 bg-surface-950/50 shadow-none scale-[0.98]'
            : 'hover:-translate-y-0.5 hover:border-surface-600 hover:bg-surface-800 hover:shadow-card border-surface-700/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        )}
      >
        {/* Cover image */}
        {card.coverUrl && (
          <div className="h-24 w-full overflow-hidden rounded-lg">
            <img
              src={card.coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Priority badge */}
        <PriorityBadge priority={card.priority} />

        {/* Title */}
        <p className="text-sm font-medium leading-snug text-surface-100 group-hover:text-white">
          {card.title}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          {/* Due date */}
          {card.dueDate && (
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                overdue
                  ? 'bg-priority-urgent/20 text-priority-urgent'
                  : 'bg-surface-700 text-surface-400',
              )}
            >
              <CalendarDays size={10} />
              {formatDate(card.dueDate)}
            </span>
          )}

          {/* Assignees */}
          {card.assignees.length > 0 && (
            <AvatarGroup
              users={card.assignees.map((a: CardAssignee) => ({
                id: a.userId,
                name: a.user.name,
                avatarUrl: a.user.avatarUrl,
              }))}
              size="xs"
              max={3}
            />
          )}
        </div>
      </div>

      {isModalOpen && (
        <CardDetailsModal
          card={card}
          orgId={orgId}
          boardId={boardId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};
