import React, { useState, useEffect, useRef } from 'react';
import { Calendar, User, AlignLeft, Tag, Trash2, Image, MessageSquare, Clock, Edit2 } from 'lucide-react';
import { useUpdateCard, useDeleteCard } from '@features/workspace/hooks/useCards';
import { useOrganizationMembers } from '@hooks/useOrganizationMembers';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import type { Card, CardPriority } from '@appTypes';
import { useMe } from '@features/auth/hooks/useAuthHooks';
import { useSocket } from '@context/SocketContext';
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '../hooks/useComments';

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

  const { data: currentUser } = useMe();
  const { socket } = useSocket();

  // Comments queries and mutations
  const { data: comments = [] } = useComments(orgId, boardId, card.id);
  const createComment = useCreateComment(orgId, boardId, card.id);
  const updateComment = useUpdateComment(orgId, boardId, card.id);
  const deleteComment = useDeleteComment(orgId, boardId, card.id);

  // Comment action/composer states
  const [newCommentBody, setNewCommentBody] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState('');

  // Typing state
  const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Listen for real-time typing indicators
  useEffect(() => {
    if (!socket || !card.id) return;

    const handleUserTyping = (data: { cardId: string; userId: string; name: string }) => {
      if (data.cardId !== card.id) return;
      if (currentUser && data.userId === currentUser.id) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, name: data.name }];
      });
    };

    const handleUserStoppedTyping = (data: { cardId: string; userId: string }) => {
      if (data.cardId !== card.id) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, card.id, currentUser]);

  // Clean up typing indicator state on component unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && socket && boardId && card.id) {
        socket.emit('user_stopped_typing', { boardId, cardId: card.id });
      }
    };
  }, [isTyping, socket, boardId, card.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewCommentBody(val);

    if (!socket || !boardId || !card.id) return;

    if (!isTyping && val.trim().length > 0) {
      setIsTyping(true);
      socket.emit('user_typing', { boardId, cardId: card.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('user_stopped_typing', { boardId, cardId: card.id });
      setIsTyping(false);
    }, 2000);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping && socket && boardId && card.id) {
      socket.emit('user_stopped_typing', { boardId, cardId: card.id });
      setIsTyping(false);
    }

    try {
      await createComment.mutateAsync({ body: newCommentBody.trim() });
      setNewCommentBody('');
    } catch (err) {
      console.error('Failed to create comment:', err);
    }
  };

  const handleStartEdit = (commentId: string, body: string) => {
    setEditingCommentId(commentId);
    setEditingCommentBody(body);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentBody('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingCommentBody.trim()) return;
    try {
      await updateComment.mutateAsync({ commentId, data: { body: editingCommentBody.trim() } });
      setEditingCommentId(null);
      setEditingCommentBody('');
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment.mutateAsync(commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const formatCommentDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

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

            <hr className="border-surface-800" />

            {/* Collaborative Comments Section */}
            <div className="flex flex-col gap-4 mt-2">
              <label className="text-xs font-semibold text-surface-400 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-primary-500" />
                Comments ({comments.length})
              </label>

              {/* Comment Composer */}
              <div className="flex gap-3">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-8 w-8 rounded-full object-cover border border-surface-700"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-900 border border-primary-800 text-primary-300 text-xs font-semibold flex items-center justify-center uppercase">
                    {currentUser?.name?.slice(0, 2) || '??'}
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    value={newCommentBody}
                    onChange={handleInputChange}
                    placeholder="Write a comment..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-surface-700 bg-surface-800 px-3.5 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="flex justify-between items-center">
                    {/* Typing Indicator */}
                    <div className="text-[11px] text-surface-400 italic">
                      {typingUsers.length > 0 && (
                        <span>
                          {typingUsers.map((u) => u.name).join(', ')}{' '}
                          {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newCommentBody.trim() || createComment.isPending}
                    >
                      {createComment.isPending ? 'Sending...' : 'Comment'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comment List */}
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                {comments.map((comment) => {
                  const isAuthor = currentUser?.id === comment.userId;
                  const isEditing = editingCommentId === comment.id;

                  return (
                    <div key={comment.id} className="flex gap-3 text-sm group">
                      {comment.user?.avatarUrl ? (
                        <img
                          src={comment.user.avatarUrl}
                          alt={comment.user.name}
                          className="h-8 w-8 rounded-full object-cover border border-surface-700 mt-0.5"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-surface-700 text-surface-300 text-xs font-semibold flex items-center justify-center uppercase mt-0.5">
                          {comment.user?.name?.slice(0, 2) || '??'}
                        </div>
                      )}
                      <div className="flex-1 bg-surface-900 border border-surface-800 rounded-xl px-4 py-2.5 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-xs text-surface-200">
                            {comment.user?.name}
                          </span>
                          <span className="text-[10px] text-surface-500 flex items-center gap-1">
                            <Clock size={10} />
                            {formatCommentDate(comment.createdAt)}
                          </span>
                        </div>
                        {isEditing ? (
                          <div className="flex flex-col gap-2 mt-1.5">
                            <textarea
                              value={editingCommentBody}
                              onChange={(e) => setEditingCommentBody(e.target.value)}
                              rows={2}
                              className="w-full resize-none rounded-xl border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <div className="flex gap-1.5 justify-end">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSaveEdit(comment.id)}
                                disabled={!editingCommentBody.trim() || updateComment.isPending}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-surface-300 whitespace-pre-wrap mt-0.5">
                              {comment.body}
                            </p>
                            {isAuthor && (
                              <div className="flex gap-2.5 mt-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(comment.id, comment.body)}
                                  className="text-[10px] text-surface-400 hover:text-primary-400 flex items-center gap-0.5 transition-colors"
                                >
                                  <Edit2 size={10} /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-[10px] text-surface-400 hover:text-red-400 flex items-center gap-0.5 transition-colors"
                                >
                                  <Trash2 size={10} /> Delete
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {comments.length === 0 && (
                  <p className="text-xs text-surface-500 italic text-center py-4">
                    No comments yet. Start the conversation!
                  </p>
                )}
              </div>
            </div>
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
