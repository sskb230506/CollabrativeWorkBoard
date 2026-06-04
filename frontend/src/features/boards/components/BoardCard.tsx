import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Globe, Users, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useUpdateBoard, useDeleteBoard } from '@features/boards/hooks/useBoards';
import { useActiveOrg } from '@hooks/useActiveOrg';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
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
  const { activeOrgId } = useActiveOrg();
  const orgId = activeOrgId ?? '';

  // Mutation hooks
  const updateBoard = useUpdateBoard(orgId, board.id);
  const deleteBoard = useDeleteBoard(orgId);

  // Component states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [editName, setEditName] = useState(board.name);
  const [editDesc, setEditDesc] = useState(board.description ?? '');
  const [editVis, setEditVis] = useState<BoardVisibility>(board.visibility);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { icon, label } = visibilityConfig[board.visibility];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      await updateBoard.mutateAsync({
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        visibility: editVis,
      });
      setIsEditOpen(false);
    } catch (err) {
      console.error('Failed to update board:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBoard.mutateAsync(board.id);
      setIsDeleteOpen(false);
    } catch (err) {
      console.error('Failed to delete board:', err);
    }
  };

  return (
    <>
      <div
        className={cn(
          'group relative flex h-40 w-full flex-col overflow-hidden rounded-2xl text-left bg-surface-900 border border-surface-800',
          'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card focus-within:ring-2 focus-within:ring-primary-500',
        )}
      >
        {/* Navigation Action Area */}
        <button
          onClick={() => navigate(`/boards/${board.id}`)}
          className="absolute inset-0 z-0 text-left focus:outline-none"
          title={`Open ${board.name}`}
        >
          {/* Cover background */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br transition-all duration-200 group-hover:scale-105',
              board.coverUrl ? '' : pickGradient(board.id),
            )}
            style={
              board.coverUrl
                ? { backgroundImage: `url(${board.coverUrl})`, backgroundSize: 'cover' }
                : undefined
            }
          />
          {/* Cover dimming overlay */}
          <div className="absolute inset-0 bg-black/40 transition group-hover:bg-black/35" />
        </button>

        {/* Top Action Bar (Options Dropdown) */}
        <div className="absolute top-3 right-3 z-10" ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-colors focus:outline-none"
            title="Board actions"
          >
            <MoreVertical size={14} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-36 origin-top-right rounded-xl border border-surface-800 bg-surface-900 shadow-2xl py-1 text-left focus:outline-none z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(false);
                  setIsEditOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-surface-300 hover:bg-surface-800 hover:text-surface-100 transition-colors"
              >
                <Edit2 size={12} />
                Edit Board
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(false);
                  setIsDeleteOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-surface-300 hover:bg-surface-800 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
                Delete Board
              </button>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="relative pointer-events-none mt-auto flex flex-col p-4 z-0">
          <p className="truncate text-sm font-semibold text-white">{board.name}</p>
          {board.description && (
            <p className="mt-0.5 truncate text-xs text-white/70">{board.description}</p>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-white/50">
            {icon}
            <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
          </div>
        </div>
      </div>

      {/* Edit Board Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit board settings"
      >
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <Input
            label="Board name"
            placeholder="e.g. Product Roadmap"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="What is this board for?"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Visibility</label>
            <select
              value={editVis}
              onChange={(e) => setEditVis(e.target.value as BoardVisibility)}
              className="w-full rounded-xl border border-surface-700 bg-surface-800 px-3.5 py-2 text-sm text-surface-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option value="ORGANIZATION" className="bg-surface-800 text-surface-100">Organization (All members)</option>
              <option value="PRIVATE" className="bg-surface-800 text-surface-100">Private (Only you)</option>
              <option value="PUBLIC" className="bg-surface-800 text-surface-100">Public (Anyone with link)</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditOpen(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              isLoading={updateBoard.isPending}
              disabled={!editName.trim()}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Board Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete board"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-surface-300 leading-relaxed">
            Are you sure you want to delete <strong className="text-surface-100">{board.name}</strong>? This action will permanently remove the board and all of its lists, cards, and activity history. This cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              fullWidth
              isLoading={deleteBoard.isPending}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
