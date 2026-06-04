import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layout } from 'lucide-react';
import { useBoards, useCreateBoard } from '@features/boards/hooks/useBoards';
import { useActiveOrg } from '@hooks/useActiveOrg';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Spinner } from '@components/ui/Spinner';
import { BoardCard } from '@features/boards/components/BoardCard';
import { useRecentBoards } from '@hooks/useRecentBoards';
import type { Board } from '@appTypes';

export const BoardsPage: React.FC = () => {
  const { activeOrgId } = useActiveOrg();
  const { data: boards, isLoading } = useBoards(activeOrgId ?? '');
  const createBoard = useCreateBoard(activeOrgId ?? '');
  const { recentIds } = useRecentBoards();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDesc, setBoardDesc] = useState('');

  const recentBoards = recentIds
    .map((id) => boards?.find((b) => b.id === id))
    .filter((b): b is Board => !!b);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    const board = await createBoard.mutateAsync({ name: boardName, description: boardDesc });
    setIsModalOpen(false);
    setBoardName('');
    setBoardDesc('');
    navigate(`/boards/${board.id}`);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Boards</h1>
          <p className="mt-0.5 text-sm text-surface-400">
            {boards?.length ?? 0} board{boards?.length !== 1 ? 's' : ''} in this workspace
          </p>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => setIsModalOpen(true)}
          id="create-board-btn"
        >
          New Board
        </Button>
      </div>

      {/* Recent boards section */}
      {recentBoards.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-surface-500">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentBoards.map((board) => (
              <BoardCard key={`recent-${board.id}`} board={board} />
            ))}
          </div>
        </div>
      )}

      {/* Board grid */}
      <div className="flex flex-col gap-3">
        {recentBoards.length > 0 && (
          <h2 className="text-xs font-semibold uppercase tracking-widest text-surface-500">
            All Boards
          </h2>
        )}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : boards && boards.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards.map((board: Board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-surface-700 py-20">
            <Layout size={40} className="text-surface-600" />
            <div className="text-center">
              <p className="font-medium text-surface-300">No boards yet</p>
              <p className="mt-1 text-sm text-surface-500">Create your first board to get started</p>
            </div>
            <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
              Create Board
            </Button>
          </div>
        )}
      </div>

      {/* Create board modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create new board"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Board name"
            placeholder="e.g. Product Roadmap"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="What is this board for?"
            value={boardDesc}
            onChange={(e) => setBoardDesc(e.target.value)}
          />
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              isLoading={createBoard.isPending}
              disabled={!boardName.trim()}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
