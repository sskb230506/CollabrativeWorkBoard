import React, { useState, useEffect } from 'react';
import { Calendar, User, AlignLeft, Tag, Trash2, Image } from 'lucide-react';
import { useUpdateCard, useDeleteCard } from '@features/workspace/hooks/useCards';
import { useOrganizationMembers } from '@hooks/useOrganizationMembers';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import type { Card, CardPriority } from '@appTypes';

// ─────────────────────────────────────────────────────────────────────────────
// CardDetailsModal
//
// Modal displaying detailed card fields (Title, Description, Priority, Due Date,
// Cover URL, and Member assignments). Allows updating and deleting card entities.
// ─────────────────────────────────────────────────────────────────────────────

interface CardDetailsModalProps {
  card: Card;
  orgId: string;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

const toInputDate = (isoStr: string | null | undefined): string => {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const toIsoDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
};

export const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  card,
  orgId,
  boardId,
  isOpen,
  onClose,
}) => {
  const updateCard = useUpdateCard(orgId, boardId);
  const deleteCard = useDeleteCard(orgId, boardId);
  const { data: members = [] } = useOrganizationMembers(orgId);

  // Form states
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [priority, setPriority] = useState<CardPriority>(card.priority);
  const [dueDate, setDueDate] = useState(toInputDate(card.dueDate));
  const [coverUrl, setCoverUrl] = useState(card.coverUrl ?? '');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  // Sync state with card prop changes (useful if card is updated in real-time)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(card.title);
    setDescription(card.description ?? '');
    setPriority(card.priority);
    setDueDate(toInputDate(card.dueDate));
    setCoverUrl(card.coverUrl ?? '');
    setAssigneeIds(card.assignees.map((a) => a.userId));
  }, [card]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await updateCard.mutateAsync({
        cardId: card.id,
        data: {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          dueDate: toIsoDate(dueDate),
          coverUrl: coverUrl.trim() || null,
          assigneeIds,
        },
      });
      onClose();
    } catch (err) {
      console.error('Failed to update card:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the card "${card.title}"?`)) return;
    try {
      await deleteCard.mutateAsync(card.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Card details" size="lg">
      {/* Cover Banner */}
      {card.coverUrl && (
        <div className="relative -mx-6 -mt-6 mb-6 h-36 overflow-hidden bg-surface-900 border-b border-surface-800">
          <img
            src={card.coverUrl}
            alt="Card cover"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Main Content Fields */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <Input
              label="Card Title"
              placeholder="Enter card name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400 flex items-center gap-1.5">
                <AlignLeft size={13} /> Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a more detailed description..."
                rows={4}
                className="w-full resize-none rounded-xl border border-surface-700 bg-surface-800 px-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <Input
              label="Cover Image URL"
              placeholder="https://example.com/image.jpg"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              leftIcon={<Image size={14} />}
            />
          </div>

          {/* Sidebar / Metadata options */}
          <div className="flex flex-col gap-4">
            {/* Priority selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400 flex items-center gap-1.5">
                <Tag size={13} /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CardPriority)}
                className="w-full rounded-xl border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
              >
                <option value="NONE" className="bg-surface-800 text-surface-100">None</option>
                <option value="LOW" className="bg-surface-800 text-surface-100">Low</option>
                <option value="MEDIUM" className="bg-surface-800 text-surface-100">Medium</option>
                <option value="HIGH" className="bg-surface-800 text-surface-100">High</option>
              </select>
            </div>

            {/* Due date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400 flex items-center gap-1.5">
                <Calendar size={13} /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
              />
            </div>

            {/* Assignees Checklist */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400 flex items-center gap-1.5">
                <User size={13} /> Members
              </label>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-surface-700 bg-surface-800 p-2.5 flex flex-col gap-1.5">
                {members.length > 0 ? (
                  members.map((member) => {
                    const isAssigned = assigneeIds.includes(member.userId);
                    return (
                      <label
                        key={member.userId}
                        className="flex items-center gap-2 text-xs text-surface-300 hover:text-surface-100 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => {
                            setAssigneeIds((prev) =>
                              isAssigned
                                ? prev.filter((id) => id !== member.userId)
                                : [...prev, member.userId]
                            );
                          }}
                          className="rounded border-surface-700 bg-surface-900 text-primary-500 focus:ring-primary-500 cursor-pointer"
                        />
                        <span className="truncate">{member.user.name}</span>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-surface-500">No members available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between border-t border-surface-800 pt-4">
          <Button
            type="button"
            variant="danger"
            leftIcon={<Trash2 size={14} />}
            onClick={handleDelete}
            isLoading={deleteCard.isPending}
          >
            Delete Card
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateCard.isPending} disabled={!title.trim()}>
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
