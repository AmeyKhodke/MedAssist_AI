import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PrimarySidebar from '../layout/PrimarySidebar';
import ChatSessionsSidebar from '../layout/ChatSessionsSidebar';

const ClientDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  
  // Chat Session State
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Toggle function for children components to use
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Mock User Object (will come from API/Auth context eventually)
  const user = {
    id: 'pat-001',
    name: 'Patient PAT001',
    email: 'jejurkarom@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patient'
  };

  // Fetch sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Fallback port commonly used for FastAPI if proxy not set
        const res = await axios.get(`http://localhost:8000/api/sessions/${user.id}`);
        setSessions(res.data);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };
    fetchSessions();
  }, [user.id]);

  const handleNewChat = () => {
    setActiveSessionId(null);
  };

  const handleRenameSession = async (id, newTitle) => {
    try {
      await axios.patch(`http://localhost:8000/api/sessions/${id}`, { title: newTitle });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    } catch (err) {
      console.error("Rename failed", err);
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div
      id="dashboard-root"
      className={`${
        isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-[#F8F9FB] text-slate-800'
      } h-screen overflow-hidden flex`}
    >
      {/* 1. Primary Sidebar */}
      <PrimarySidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        user={user}
      />

      {/* 2. Secondary Sidebar (Chat Sessions) */}
      {activeTab === 'chat' && (
        <ChatSessionsSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          onNewChat={handleNewChat}
        />
      )}

      {/* 3. Main Workspace Placeholder */}
      <div className="flex-1 h-full bg-[#F8F9FB] dark:bg-slate-900 flex flex-col transition-colors overflow-y-auto">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Main Workspace</h1>
          <p className="text-slate-600 dark:text-slate-400">
            This area will contain the ChatInterface, Orders, Cart, Alerts, or Profile depending on the active tab.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
