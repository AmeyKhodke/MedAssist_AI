import React from 'react';
import { LayoutDashboard, Users, Package, Settings, LogOut, FileText, Activity, Terminal } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Sidebar({ setRole, activeView, setActiveView }) {
  const handleSignOut = () => {
    setRole(null);
  };

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { id: 'inventory', icon: <Package size={20} />, label: "Inventory" },
    { id: 'predictions', icon: <Activity size={20} />, label: "Predictions" },
    { id: 'prescriptions', icon: <FileText size={20} />, label: "Prescriptions" },
    { id: 'patients', icon: <Users size={20} />, label: "Patients" }
  ];

  const systemItems = [
    { id: 'observability', icon: <Terminal size={20} />, label: "Observability" },
    { id: 'settings', icon: <Settings size={20} />, label: "Settings" }
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-[#0F172A] text-white flex-col items-start px-4 py-6 border-r border-[#1e293b] shadow-xl z-50">
      <div className="w-full mb-8 px-2 flex items-center space-x-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/20">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white leading-tight">MedAssist AI</h2>
          <p className="text-xs text-indigo-300 font-medium tracking-wider uppercase">Enterprise</p>
        </div>
      </div>
      
      <div className="flex-1 w-full space-y-1">
        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">Overview</p>
        {navItems.map(item => (
          <SidebarItem 
            key={item.id} 
            icon={item.icon} 
            label={item.label} 
            active={activeView === item.id} 
            onClick={() => setActiveView(item.id)}
          />
        ))}
        
        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-8">System</p>
        {systemItems.map(item => (
          <SidebarItem 
            key={item.id} 
            icon={item.icon} 
            label={item.label} 
            active={activeView === item.id} 
            onClick={() => setActiveView(item.id)}
          />
        ))}
      </div>

      <div className="w-full pt-4 border-t border-slate-800 mt-auto">
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active = false, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm font-medium",
        active 
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20" 
          : "text-slate-400 hover:bg-[#1e293b] hover:text-white"
      )}>
      <span className={cn(
        "transition-colors",
        active ? "text-indigo-100" : "text-slate-500 group-hover:text-indigo-400"
      )}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
