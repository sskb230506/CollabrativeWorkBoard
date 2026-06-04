import { CalendarDays } from 'lucide-react';
import { PriorityBadge } from '@components/ui/PriorityBadge';
import { AvatarGroup } from '@components/ui/Avatar';
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

export const CardItem: React.FC<CardItemProps> = ({ card }) => {
  const overdue = isOverdue(card.dueDate);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group flex flex-col gap-2.5 rounded-xl border bg-surface-800/80 p-3',
        'cursor-pointer transition-all duration-150',
        'hover:-translate-y-0.5 hover:border-surface-600 hover:bg-surface-800 hover:shadow-card',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        'border-surface-700/60',
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
  );
};
