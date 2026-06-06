import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useBoard } from '@features/boards/hooks/useBoards';
import { useLists, useCreateList } from '@features/workspace/hooks/useLists';
import { useCards, useMoveCard } from '@features/workspace/hooks/useCards';
import { useBoardSync } from '@features/workspace/hooks/useBoardSync';
import { useSocket } from '@context/SocketContext';
import { useAuth } from '@context/AuthContext';
import { useActiveOrg } from '@hooks/useActiveOrg';
import { useEffect, useState } from 'react';
import { ListColumn } from '@features/workspace/components/ListColumn';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import { AvatarGroup } from '@components/ui/Avatar';
import { useRecentBoards } from '@hooks/useRecentBoards';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import type { List, Card } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// WorkspacePage — the main Kanban board view
// ─────────────────────────────────────────────────────────────────────────────

export const WorkspacePage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { activeOrgId } = useActiveOrg();
  const { user } = useAuth();
  const { joinBoard, leaveBoard, presence } = useSocket();
  const { addRecentBoard } = useRecentBoards();

  const orgId = activeOrgId ?? '';
  const bId   = boardId ?? '';

  useEffect(() => {
    if (bId) {
      addRecentBoard(bId);
    }
  }, [bId, addRecentBoard]);

  const { data: board, isLoading: boardLoading } = useBoard(orgId, bId);
  const { data: lists = [], isLoading: listsLoading } = useLists(orgId, bId);
  const { data: cards = [] } = useCards(orgId, bId);
  const createList = useCreateList(orgId, bId);
  const moveCard = useMoveCard(orgId, bId);

  // Configure PointerSensor to allow normal clicks without triggering drag instantly
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Sort lists by position
  const sortedLists = [...lists].sort((a: List, b: List) => a.position - b.position);

  // Group cards by listId for O(1) lookup
  const cardsByList = cards.reduce<Record<string, Card[]>>((acc: Record<string, Card[]>, card: Card) => {
    if (!acc[card.listId]) acc[card.listId] = [];
    acc[card.listId]!.push(card);
    return acc;
  }, {});

  // Real-time sync
  useBoardSync(orgId, bId);

  // Join/leave board room
  useEffect(() => {
    if (!bId || !user) return;
    joinBoard(bId, { name: user.name, avatarUrl: user.avatarUrl });
    return () => leaveBoard(bId);
  }, [bId, user, joinBoard, leaveBoard]);

  // Add list inline state
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await createList.mutateAsync({ name: newListName });
    setNewListName('');
    setAddingList(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const activeCard = cards.find((c) => c.id === cardId);
    if (!activeCard) return;

    const overId = over.id as string;
    let targetListId = '';

    // Check if target is a list or a card
    const targetCard = cards.find((c) => c.id === overId);
    if (targetCard) {
      targetListId = targetCard.listId;
    } else if (overId.startsWith('list-')) {
      targetListId = overId.replace('list-', '');
    } else {
      targetListId = overId;
    }

    // Filter cards belonging to the target list (excluding the active card if moving within the same list)
    const destCards = cards
      .filter((c) => c.listId === targetListId && c.id !== cardId)
      .sort((a, b) => a.position - b.position);

    let newPosition: number;

    if (targetCard) {
      const index = destCards.findIndex((c) => c.id === targetCard.id);
      if (index === 0) {
        newPosition = targetCard.position / 2;
      } else {
        const prevCard = destCards[index - 1];
        newPosition = (prevCard.position + targetCard.position) / 2;
      }
    } else {
      if (destCards.length === 0) {
        newPosition = 1000;
      } else {
        newPosition = destCards[destCards.length - 1].position + 1000;
      }
    }

    // Skip update if card dropped back on its exact original position
    if (activeCard.listId === targetListId && Math.round(newPosition) === activeCard.position) {
      return;
    }

    try {
      await moveCard.mutateAsync({
        cardId,
        data: {
          listId: targetListId,
          position: Math.round(newPosition),
        },
      });
    } catch (err) {
      console.error('Failed to move card:', err);
    }
  };

  if (boardLoading || listsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-full flex-col">
        {/* Board header */}
        <div className="flex shrink-0 items-center justify-between border-b border-surface-800 bg-surface-950/60 px-6 py-3 backdrop-blur-sm">
          <div>
            <h1 className="text-lg font-semibold text-surface-100">{board?.name}</h1>
            {board?.description && (
              <p className="text-xs text-surface-400">{board.description}</p>
            )}
          </div>
          {/* Presence avatars */}
          {presence.length > 0 && (
            <AvatarGroup
              users={presence.map((p) => ({
                id: p.userId,
                name: p.name ?? 'Unknown',
                avatarUrl: p.avatarUrl,
              }))}
              size="sm"
            />
          )}
        </div>

        {/* Kanban scroll area */}
        <div className="flex flex-1 gap-3 overflow-x-auto p-6 pb-8">
          {sortedLists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              cards={(cardsByList[list.id] ?? []).sort((a: Card, b: Card) => a.position - b.position)}
              orgId={orgId}
              boardId={bId}
            />
          ))}

          {/* Add list column */}
          <div className="w-72 shrink-0">
            {addingList ? (
              <form
                onSubmit={handleAddList}
                className="rounded-2xl border border-surface-700/60 bg-surface-900/70 p-3 backdrop-blur-sm"
              >
                <input
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name..."
                  className="w-full rounded-lg bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="mt-2 flex gap-2">
                  <Button type="submit" size="sm" isLoading={createList.isPending} fullWidth>
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => { setAddingList(false); setNewListName(''); }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingList(true)}
                className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-surface-700 px-4 py-3 text-sm text-surface-400 transition hover:border-surface-600 hover:bg-surface-900/50 hover:text-surface-200"
              >
                <Plus size={15} />
                Add list
              </button>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
};
