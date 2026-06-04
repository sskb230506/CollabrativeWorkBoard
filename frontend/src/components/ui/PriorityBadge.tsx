import { cn } from '@utils/cn';
import type { CardPriority } from '@appTypes';

const priorityConfig: Record<
  CardPriority,
  { label: string; className: string }
> = {
  NONE:   { label: 'No priority', className: 'bg-surface-700 text-surface-300' },
  LOW:    { label: 'Low',         className: 'bg-priority-low/20 text-priority-low' },
  MEDIUM: { label: 'Medium',      className: 'bg-priority-medium/20 text-priority-medium' },
  HIGH:   { label: 'High',        className: 'bg-priority-high/20 text-priority-high' },
  URGENT: { label: 'Urgent',      className: 'bg-priority-urgent/20 text-priority-urgent' },
};

interface PriorityBadgeProps {
  priority: CardPriority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  const { label, className: colorClass } = priorityConfig[priority];
  if (priority === 'NONE') return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
};
