import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveOrg } from '@hooks/useActiveOrg';
import { useSearch } from '../hooks/useSearch';
import {
  Search,
  X,
  Folder,
  CreditCard,
  MessageSquare,
  User as UserIcon,
  Loader2,
  CornerDownLeft,
} from 'lucide-react';
import { Avatar } from '@components/ui/Avatar';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { activeOrgId } = useActiveOrg();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query to prevent fast consecutive API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Execute the search hook
  const { data: results, isLoading } = useSearch(activeOrgId, debouncedQuery);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectBoard = (boardId: string) => {
    navigate(`/boards/${boardId}`);
    onClose();
  };

  const handleSelectCard = (boardId: string, cardId: string) => {
    navigate(`/boards/${boardId}?cardId=${cardId}`);
    onClose();
  };

  const hasResults =
    results &&
    (results.boards.length > 0 ||
      results.cards.length > 0 ||
      results.comments.length > 0 ||
      results.users.length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-surface-950/80 p-4 pt-[15vh] backdrop-blur-md">
      {/* Modal Box */}
      <div
        ref={modalRef}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-surface-800 bg-surface-900 shadow-2xl transition-all duration-300"
      >
        {/* Search Input Box */}
        <div className="relative flex items-center border-b border-surface-800 px-4 py-3">
          <Search size={20} className="text-surface-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search boards, cards, comments, and members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ml-3 h-10 w-full bg-transparent text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-0"
          />
          {isLoading && (
            <Loader2 size={18} className="animate-spin text-primary-500 mr-2" />
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[50vh] overflow-y-auto p-4 custom-scrollbar">
          {/* Default / Helper states */}
          {debouncedQuery.trim().length < 2 ? (
            <div className="py-8 text-center text-sm text-surface-400">
              Type at least 2 characters to search...
            </div>
          ) : isLoading && !results ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={32} className="animate-spin text-primary-500" />
              <span className="text-sm text-surface-400">Searching workspace...</span>
            </div>
          ) : !hasResults ? (
            <div className="py-8 text-center text-sm text-surface-400">
              No results found for <span className="font-semibold text-surface-200">"{debouncedQuery}"</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Boards */}
              {results.boards.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                    <Folder size={12} />
                    Boards
                  </h3>
                  <div className="space-y-1">
                    {results.boards.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBoard(b.id)}
                        className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-surface-850 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {b.coverUrl ? (
                            <img
                              src={b.coverUrl}
                              alt=""
                              className="h-8 w-12 rounded-lg object-cover border border-surface-800"
                            />
                          ) : (
                            <div className="flex h-8 w-12 items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400">
                              <Folder size={16} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-surface-200 group-hover:text-surface-50">
                              {b.name}
                            </p>
                            {b.description && (
                              <p className="truncate text-xs text-surface-400 max-w-md">
                                {b.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 text-xs text-surface-500 flex items-center gap-1 transition-opacity">
                          Go to board <CornerDownLeft size={10} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cards */}
              {results.cards.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                    <CreditCard size={12} />
                    Cards
                  </h3>
                  <div className="space-y-1">
                    {results.cards.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCard(c.boardId, c.id)}
                        className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-surface-850 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400">
                            <CreditCard size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-surface-200 group-hover:text-surface-50">
                              {c.title}
                            </p>
                            <p className="text-xs text-surface-400">
                              {c.boardName} &rsaquo; {c.listName}
                            </p>
                          </div>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 text-xs text-surface-500 flex items-center gap-1 transition-opacity">
                          Open card <CornerDownLeft size={10} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {results.comments.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                    <MessageSquare size={12} />
                    Comments
                  </h3>
                  <div className="space-y-1">
                    {results.comments.map((co) => (
                      <button
                        key={co.id}
                        onClick={() => handleSelectCard(co.boardId, co.cardId)}
                        className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-surface-850 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-800 border border-surface-700 text-surface-400">
                            <MessageSquare size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-surface-300 group-hover:text-surface-200 line-clamp-2 italic">
                              "{co.body}"
                            </p>
                            <p className="mt-0.5 text-xs text-surface-400">
                              in card <span className="font-semibold text-surface-300">{co.cardTitle}</span>
                            </p>
                          </div>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 text-xs text-surface-500 flex items-center gap-1 shrink-0 transition-opacity">
                          View card <CornerDownLeft size={10} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {results.users.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                    <UserIcon size={12} />
                    Members
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 rounded-xl border border-surface-800 bg-surface-900/50 p-2.5"
                      >
                        <Avatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-surface-200 truncate">
                            {u.name}
                          </p>
                          <p className="text-xs text-surface-400 truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="flex items-center justify-between border-t border-surface-800 bg-surface-950/40 px-4 py-2 text-xs text-surface-500">
          <div className="flex gap-4">
            <span>
              <kbd className="rounded border border-surface-800 bg-surface-900 px-1 py-0.5 font-sans text-[10px] text-surface-400 mr-1">
                &uarr;&darr;
              </kbd>
              to navigate
            </span>
            <span>
              <kbd className="rounded border border-surface-800 bg-surface-900 px-1 py-0.5 font-sans text-[10px] text-surface-400 mr-1">
                Enter
              </kbd>
              to select
            </span>
          </div>
          <span>
            <kbd className="rounded border border-surface-800 bg-surface-900 px-1.5 py-0.5 font-sans text-[10px] text-surface-400 mr-1">
              ESC
            </kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
};
