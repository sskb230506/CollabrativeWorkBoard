import React, { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useCreateCard } from '@features/workspace/hooks/useCards';
import { useDeleteList } from '@features/workspace/hooks/useLists';
import { useMoveCard } from '@features/workspace/hooks/useCards';
import { CardItem } from './CardItem';
import { Button } from '@components/ui/Button';
import type { Card, List } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// ListColumn
//
// Represents a single Trello board list column.
// Acts as a drop zone target for CardItems using custom fractional positioning.
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
  const moveCard = useMoveCard(orgId, boardId);

  const [addingCard, setAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Drag-and-drop hover indices
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;
    await createCard.mutateAsync({ listId: list.id, title: cardTitle });
    setCardTitle('');
    setAddingCard(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = e.currentTarget;
    const children = Array.from(container.children) as HTMLElement[];

    // Extract only card elements (buttons represent draggable CardItems)
    const cardElements = children.filter((child) => child.getAttribute('role') === 'button');
    const clientY = e.clientY;
    let targetIndex = cardElements.length;

    for (let i = 0; i < cardElements.length; i++) {
      const rect = cardElements[i].getBoundingClientRect();
      const middleY = rect.top + rect.height / 2;
      if (clientY < middleY) {
        targetIndex = i;
        break;
      }
    }
    setDropIndex(targetIndex);
  };

  const handleDragLeave = () => {
    setDropIndex(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    const currentTargetIndex = dropIndex;
    setDropIndex(null);

    if (!cardId || currentTargetIndex === null) return;

    // Filter out the dragged card itself to compute target fractional positions
    const filteredCards = cards.filter((c) => c.id !== cardId);
    let newPosition: number;

    if (filteredCards.length === 0) {
      newPosition = 1000;
    } else if (currentTargetIndex === 0) {
      newPosition = filteredCards[0].position / 2;
    } else if (currentTargetIndex >= filteredCards.length) {
      newPosition = filteredCards[filteredCards.length - 1].position + 1000;
    } else {
      const prevCard = filteredCards[currentTargetIndex - 1];
      const nextCard = filteredCards[currentTargetIndex];
      newPosition = (prevCard.position + nextCard.position) / 2;
    }

    try {
      await moveCard.mutateAsync({
        cardId,
        data: {
          listId: list.id,
          position: Math.round(newPosition),
        },
      });
    } catch (err) {
      console.error('Failed to move card:', err);
    }
  };

  const dropIndicator = (
    <div className="h-16 w-full shrink-0 rounded-xl border border-dashed border-primary-500/50 bg-primary-950/20 transition-all duration-100" />
  );

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

      {/* Cards Scrollable Drag-and-Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex flex-col gap-2 overflow-y-auto px-3 pb-2 min-h-[4rem] transition-colors"
      >
        {cards.map((card, idx) => (
          <React.Fragment key={card.id}>
            {dropIndex === idx && dropIndicator}
            <CardItem card={card} orgId={orgId} boardId={boardId} />
          </React.Fragment>
        ))}
        {dropIndex === cards.length && dropIndicator}
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
