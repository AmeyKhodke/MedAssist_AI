import React, { useState, useEffect, useRef } from 'react';
import { Plus, MoreVertical, Edit2, Trash2, MessageSquare } from 'lucide-react';

const ChatSessionsSidebar = ({ 
  sessions, 
  activeSessionId, 
  setActiveSessionId, 
  onRenameSession, 
  onDeleteSession, 
  onNewChat,
  isDarkMode = false
}) => {
  const [renamingId, setRenamingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

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
    if (editTitle.trim()) onRenameSession(id, editTitle.trim());
    setRenamingId(null);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') handleRenameSubmit(id);
    else if (e.key === 'Escape') setRenamingId(null);
  };

  const bg = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const text = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const subText = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const newChatBtnCls = isDarkMode
    ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
    : 'bg-blue-50 text-blue-600 hover:bg-blue-100';
  const activeCls = isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-900';
  const hoverCls = isDarkMode ? 'hover:bg-slate-700/60 hover:text-slate-100' : 'hover:bg-slate-50 hover:text-slate-900';
  const menuBg = isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200';
  const menuItemCls = isDarkMode ? 'text-slate-200 hover:bg-slate-600' : 'text-slate-600 hover:bg-slate-50';

  return (
    <div className={`w-[280px] h-full flex flex-col border-r transition-colors duration-300 shrink-0 ${bg}`}>
      {/* Header and New Chat Button */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${newChatBtnCls}`}
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className={`text-xs font-semibold mb-3 px-2 uppercase tracking-wider ${subText}`}>
          Recent Sessions
        </div>

        {sessions.length === 0 ? (
          <div className={`text-sm text-center mt-8 ${subText}`}>
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
                  isActive ? activeCls : `${subText} ${hoverCls}`
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <MessageSquare size={16} className={`shrink-0 ${isActive ? 'text-blue-500' : subText}`} />
                  {isRenaming ? (
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleRenameSubmit(session.id)}
                      onKeyDown={(e) => handleKeyDown(e, session.id)}
                      className={`flex-1 px-2 py-1 text-sm rounded border border-blue-500 outline-none ${
                        isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm truncate font-medium">
                      {session.title || 'New Chat'}
                    </span>
                  )}
                </div>

                {!isRenaming && (
                  <div className={`relative ${activeMenuId === session.id ? 'block' : 'hidden group-hover:block'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === session.id ? null : session.id);
                      }}
                      className={`p-1 rounded transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenuId === session.id && (
                      <div
                        ref={menuRef}
                        className={`absolute right-0 top-full mt-1 w-32 rounded-lg shadow-lg border py-1 z-10 ${menuBg}`}
                      >
                        <button
                          onClick={(e) => handleStartRename(session, e)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${menuItemCls}`}
                        >
                          <Edit2 size={14} /> Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                            setActiveMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={14} /> Delete
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
