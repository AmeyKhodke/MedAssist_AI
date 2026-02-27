import React from 'react';
import { User, Lock, Bell, Store, Key, Database, Globe } from 'lucide-react';

export default function SettingsView() {
  return (
    <div className="animate-in fade-in duration-300 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-slate-500 mt-1">Configure MedAssist AI parameters, organization details, and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="col-span-1 border-r border-slate-200 pr-6 space-y-1">
          <SettingsTab icon={<User size={18} />} label="My Profile" active />
          <SettingsTab icon={<Store size={18} />} label="Pharmacy Profile" />
          <SettingsTab icon={<Lock size={18} />} label="Security" />
          <SettingsTab icon={<Bell size={18} />} label="Notifications" />
          <SettingsTab icon={<Key size={18} />} label="API Keys" />
          <SettingsTab icon={<Database size={18} />} label="Data Sync" />
        </div>

        {/* Content Area */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Personal Information</h2>
            
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-3xl border-4 border-white shadow-md relative group cursor-pointer">
                AD
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">Edit</span>
                </div>
              </div>
              <div>
                <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition text-sm mb-2">Upload new picture</button>
                <p className="text-xs text-slate-500">JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">First Name</label>
                <input type="text" defaultValue="Admin" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">Last Name</label>
                <input type="text" defaultValue="User" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-800" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-slate-700 block flex items-center"><Globe size={14} className="mr-1"/> Email Address</label>
                <input type="email" defaultValue="admin@medassist.ai" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-800" />
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3 border-t border-slate-100 pt-6">
              <button className="bg-white border text-slate-600 px-6 py-2 rounded-lg font-medium hover:bg-slate-50 transition">Cancel</button>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm border border-indigo-700">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ icon, label, active = false }) {
  return (
    <button className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
      active 
        ? "bg-indigo-50 text-indigo-700" 
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`}>
      <span className={active ? "text-indigo-600" : "text-slate-400"}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
