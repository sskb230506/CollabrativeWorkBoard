import { useNavigate } from 'react-router-dom';
import { Lock, Globe, Users } from 'lucide-react';
import type { Board, BoardVisibility } from '@appTypes';
import { cn } from '@utils/cn';

interface BoardCardProps {
  board: Board;
}

const visibilityConfig: Record<BoardVisibility, { icon: React.ReactNode; label: string }> = {
  PRIVATE:      { icon: <Lock size={11} />,   label: 'Private' },
  PUBLIC:       { icon: <Globe size={11} />,  label: 'Public' },
  ORGANIZATION: { icon: <Users size={11} />,  label: 'Team' },
};

const COVER_GRADIENTS = [
  'from-primary-700 to-violet-700',
  'from-indigo-700 to-cyan-700',
  'from-violet-700 to-pink-700',
  'from-teal-700 to-primary-700',
];

const pickGradient = (id: string) =>
  COVER_GRADIENTS[id.charCodeAt(0) % COVER_GRADIENTS.length];

export const BoardCard: React.FC<BoardCardProps> = ({ board }) => {
  const navigate = useNavigate();
  const { icon, label } = visibilityConfig[board.visibility];

  return (
    <button
      onClick={() => navigate(`/boards/${board.id}`)}
      className={cn(
        'group relative flex h-40 w-full flex-col overflow-hidden rounded-2xl text-left',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
      )}
    >
      {/* Cover */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          board.coverUrl ? '' : pickGradient(board.id),
        )}
        style={board.coverUrl ? { backgroundImage: `url(${board.coverUrl})`, backgroundSize: 'cover' } : undefined}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/20" />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-end p-4">
        <p className="truncate text-sm font-semibold text-white">{board.name}</p>
        {board.description && (
          <p className="mt-0.5 truncate text-xs text-white/60">{board.description}</p>
        )}
        <div className="mt-2 flex items-center gap-1 text-white/50">
          {icon}
          <span className="text-[11px]">{label}</span>
        </div>
      </div>
    </button>
  );
};
