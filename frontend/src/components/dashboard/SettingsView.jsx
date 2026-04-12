import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Bell, Store, Key, Database, Globe, Hexagon, Shield, Zap, Cpu } from 'lucide-react';

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="flex flex-col h-full w-full max-w-[1200px] mx-auto animate-in fade-in duration-500">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">System Configuration</span>
           </div>
           <h1 className="text-4xl font-black tracking-tight text-white mb-2">Interface <span className="text-indigo-500">Node</span></h1>
           <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
              Global parameters and security protocols for the MedAssist AI cluster. Modification requires executive clearance.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
           {[
             { id: 'profile', label: 'Identity', icon: User },
             { id: 'pharmacy', label: 'Resource Node', icon: Store },
             { id: 'security', label: 'Security Protocols', icon: Lock },
             { id: 'notifications', label: 'Neural Alerts', icon: Bell },
             { id: 'data', label: 'Core Database', icon: Database },
           ].map((tab) => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative overflow-hidden group ${
                 activeTab === tab.id ? 'bg-indigo-600/10 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
               }`}
             >
                {activeTab === tab.id && (
                  <motion.div layoutId="settingTab" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                )}
                <tab.icon size={18} className={activeTab === tab.id ? 'text-indigo-400' : 'text-slate-600'} />
                <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
           <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card border border-white/5 rounded-[40px] bg-white/[0.01] overflow-hidden p-10"
              >
                  {activeTab === 'profile' && (
                    <div className="space-y-10">
                        <div className="flex items-center gap-4 mb-10">
                           <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                              <Hexagon size={20} />
                           </div>
                           <h2 className="text-2xl font-black text-white">Identity Parameters</h2>
                        </div>

                        <div className="flex items-center gap-8 mb-12 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                           <div className="relative group">
                              <div className="w-24 h-24 bg-indigo-600 rounded-[30px] flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-500/20 relative z-10">
                                AD
                              </div>
                              <div className="absolute inset-0 bg-black/60 rounded-[30px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-20 cursor-pointer">
                                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Update</span>
                              </div>
                           </div>
                           <div>
                              <p className="text-lg font-black text-white mb-1">Administrator Node 01</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Level 5 Security Clearance</p>
                              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">Revise Avatar</button>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <Field label="Designation Prefix" value="Admin" />
                           <Field label="Subject ID" value="User_Alpha" />
                           <Field label="Comm relay" value="admin@medassist.ai" full />
                        </div>

                        <div className="pt-10 border-t border-white/5 flex justify-end gap-4">
                           <button className="px-8 py-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Reset Index</button>
                           <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">Commit Changes</button>
                        </div>
                    </div>
                  )}

                  {activeTab !== 'profile' && (
                    <div className="h-64 flex flex-col items-center justify-center text-center opacity-30">
                       <Shield size={64} className="text-slate-600 mb-6" />
                       <p className="text-xl font-black text-white tracking-widest uppercase">Protocol Locked</p>
                       <p className="text-sm text-slate-500 font-medium tracking-tight mt-2">Configuration for this module is currently restricted to Root Access.</p>
                    </div>
                  )}
              </motion.div>
           </AnimatePresence>
        </div>
      </div>

    </div>
  );
}

function Field({ label, value, full = false }) {
  return (
    <div className={`space-y-3 ${full ? 'md:col-span-2' : ''}`}>
       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">{label}</label>
       <div className="relative group">
          <input 
            type="text" 
            defaultValue={value}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white font-medium focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
             <Key size={14} className="text-indigo-400" />
          </div>
       </div>
    </div>
  );
}
