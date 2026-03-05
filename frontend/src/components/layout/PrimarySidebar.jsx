import React from 'react';
import { MessageSquare, ShoppingBag, ShoppingCart, Bell, User, Pill, Sun, Moon, LogOut } from 'lucide-react';

const PrimarySidebar = ({ activeTab, setActiveTab, isDarkMode, toggleDarkMode, user }) => {
  const navItems = [
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'cart', label: 'My Cart', icon: ShoppingCart },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  // Fallback user details if not provided
  const currentUser = user || {
    name: 'Patient PAT001',
    email: 'patient@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patient'
  };

  return (
    <div className="w-[64px] md:w-[256px] h-full flex flex-col bg-[#1A1C2E] text-white shrink-0 transition-all duration-300 relative">
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-4 mb-6 shrink-0 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MedAssist AI" className="w-9 h-9 rounded-lg object-cover shrink-0" />
          <span className="font-bold text-xl hidden md:block text-white tracking-wide">
            MedAssist
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span className={`font-medium hidden md:block whitespace-nowrap`}>
                {item.label}
              </span>
              {/* Optional notification dot for alerts */}
              {item.id === 'alerts' && !isActive && (
                <div className="hidden md:block ml-auto w-2 h-2 rounded-full bg-red-500"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section: Theme & Profile */}
      <div className="p-4 mt-auto space-y-4 shrink-0 border-t border-slate-700/50">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
        >
          {isDarkMode ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
          <span className="font-medium hidden md:block whitespace-nowrap">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        {/* User Profile Mini */}
        <div className="flex items-center gap-3 px-2 py-2">
          <img 
            src={currentUser.avatar} 
            alt="User avatar" 
            className="w-10 h-10 rounded-full bg-slate-800 shrink-0 border border-slate-700"
          />
          <div className="hidden md:block overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
          </div>
        </div>
        
        {/* Sign Out (Placeholder) */}
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors">
          <LogOut size={20} className="shrink-0" />
          <span className="font-medium hidden md:block whitespace-nowrap">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default PrimarySidebar;
