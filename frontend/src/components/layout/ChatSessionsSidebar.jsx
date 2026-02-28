import React, { useState, useEffect, useRef } from 'react';
import { Plus, MoreVertical, Edit2, Trash2, MessageSquare } from 'lucide-react';

const ChatSessionsSidebar = ({ 
  sessions, 
  activeSessionId, 
  setActiveSessionId, 
  onRenameSession, 
  onDeleteSession, 
  onNewChat 
}) => {
  const [renamingId, setRenamingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = (session, e) => {
    e.stopPropagation();
    setRenamingId(session.id);
    setEditTitle(session.title || 'New Chat');
    setActiveMenuId(null);
  };

  const handleRenameSubmit = (id) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setRenamingId(null);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(id);
    } else if (e.key === 'Escape') {
      setRenamingId(null);
    }
  };

  return (
    <div className="w-[280px] h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all shrink-0">
      {/* Header and New Chat Button */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl font-medium transition-colors"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 px-2 uppercase tracking-wider">
          Recent Sessions
        </div>

        {sessions.length === 0 ? (
          <div className="text-sm text-slate-500 text-center mt-8">
            No previous chats
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            const isRenaming = renamingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => !isRenaming && setActiveSessionId(session.id)}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors relative ${
                  isActive 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <MessageSquare size={16} className={`shrink-0 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                  
                  {isRenaming ? (
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleRenameSubmit(session.id)}
                      onKeyDown={(e) => handleKeyDown(e, session.id)}
                      className="flex-1 bg-white dark:bg-slate-950 px-2 py-1 text-sm rounded border border-blue-500 outline-none text-slate-900 dark:text-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm truncate font-medium">
                      {session.title || 'New Chat'}
                    </span>
                  )}
                </div>

                {/* Focus/Hover Menu */}
                {!isRenaming && (
                  <div className={`relative ${activeMenuId === session.id ? 'block' : 'hidden group-hover:block'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === session.id ? null : session.id);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === session.id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10"
                      >
                        <button
                          onClick={(e) => handleStartRename(session, e)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <Edit2 size={14} />
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSessionsSidebar;
