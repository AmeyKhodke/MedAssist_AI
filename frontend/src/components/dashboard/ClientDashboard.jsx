import React, { useState } from 'react';
import PrimarySidebar from '../layout/PrimarySidebar';

const ClientDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  // Toggle function for children components to use
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Mock User Object (will come from API/Auth context eventually)
  const user = {
    name: 'Patient PAT001',
    email: 'jejurkarom@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patient'
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

      {/* 2. Secondary Sidebar (Chat Sessions) Placeholder */}
      <div className="w-[280px] h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <p className="font-semibold">Secondary Sidebar</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Chat Sessions</p>
        </div>
        <div className="flex-1 p-4">
          <p className="text-sm">Placeholder content...</p>
        </div>
      </div>

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
