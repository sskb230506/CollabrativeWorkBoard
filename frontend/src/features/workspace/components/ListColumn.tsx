import React, { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useCreateCard } from '@features/workspace/hooks/useCards';
import { useDeleteList } from '@features/workspace/hooks/useLists';
import { CardItem } from './CardItem';
import { Button } from '@components/ui/Button';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Card, List } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// ListColumn
//
// Represents a single Trello board list column.
// Implements useDroppable for dnd-kit drop zones, allowing cards to be dropped
// into empty columns, and sets up SortableContext for sorting cards vertically.
// ─────────────────────────────────────────────────────────────────────────────

interface ListColumnProps {
  list: List;
  cards: Card[];
  orgId: string;
  boardId: string;
}

export const ListColumn: React.FC<ListColumnProps> = ({ list, cards, orgId, boardId }) => {
  const createCard = useCreateCard(orgId, boardId);
  const deleteList = useDeleteList(orgId, boardId);

  const [addingCard, setAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Setup droppable area matching list ID
  const { setNodeRef } = useDroppable({
    id: `list-${list.id}`,
  });

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;
    await createCard.mutateAsync({ listId: list.id, title: cardTitle });
    setCardTitle('');
    setAddingCard(false);
  };

  return (
    <div
      className="flex w-72 shrink-0 flex-col rounded-2xl border border-surface-700/50 bg-surface-900/60 backdrop-blur-sm"
      style={{ maxHeight: 'calc(100vh - 11rem)' }}
    >
      {/* List header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-surface-100">{list.name}</span>
          <span className="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-surface-400">
            {cards.length}
          </span>
        </div>

        {/* List menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-1 text-surface-500 transition hover:bg-surface-800 hover:text-surface-300 focus:outline-none"
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 min-w-[140px] rounded-xl border border-surface-700 bg-surface-800 py-1 shadow-card">
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await deleteList.mutateAsync(list.id);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-surface-700"
              >
                Delete list
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards Scrollable Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 overflow-y-auto px-3 pb-2 min-h-[4rem] transition-colors"
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} orgId={orgId} boardId={boardId} />
          ))}
        </SortableContext>
      </div>

      {/* Add card */}
      <div className="p-3 pt-1">
        {addingCard ? (
          <form onSubmit={handleAddCard} className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              placeholder="Card title..."
              rows={2}
              className="w-full resize-none rounded-lg bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={createCard.isPending} fullWidth>
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingCard(false);
                  setCardTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-surface-500 transition hover:bg-surface-800 hover:text-surface-300 focus:outline-none"
          >
            <Plus size={14} />
            Add card
          </button>
        )}
      </div>
    </div>
  );
};
