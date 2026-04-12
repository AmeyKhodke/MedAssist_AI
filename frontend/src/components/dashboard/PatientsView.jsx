import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Phone, Mail, FileClock, Activity, MoreVertical, MapPin, Calendar, Heart, User } from 'lucide-react';
import api from '../../api';

export default function PatientsView({ isDarkMode = true }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/users`);
      const formatted = res.data.map(p => ({
        id: p.user_id,
        name: p.name || 'Unknown Patient',
        age: p.age || null,
        status: p.last_purchase_date ? 'Active' : 'Archived',
        phone: p.phone || 'N/A',
        email: p.email || 'N/A',
        lastVisit: p.last_purchase_date ? p.last_purchase_date.split(' ')[0] : 'None',
        condition: p.medicine || 'General Wellness',
        joiningDate: p.created_at || 'Jan 2024'
      }));
      setPatients(formatted);
      if (formatted.length > 0) setSelected(formatted[0]);
    } catch (err) {
      console.error("Patient sync protocol failure.", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Human Capital Index</span>
           </div>
           <h1 className="text-4xl font-black tracking-tight text-white mb-2">Patient <span className="text-indigo-500">Directory</span></h1>
           <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
              Real-time monitoring of patient demographics, engagement metrics, and longitudinal healthcare participation.
           </p>
        </div>
        
        <div className="flex items-center gap-4">
           <button onClick={fetchPatients} className="glass-card flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition-all font-bold text-sm">
              <RefreshCw size={18} className={loading ? 'animate-spin text-indigo-500' : ''} />
              <span>Full Sync</span>
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0 overflow-hidden pb-10">
         
         {/* Sidebar: List */}
         <div className="w-full md:w-96 flex flex-col glass-card border border-white/5 rounded-[32px] overflow-hidden bg-white/[0.01]">
            <div className="p-6 border-b border-white/5">
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                   <input 
                     type="text" 
                     placeholder="Filter by name or ID..."
                     className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {loading ? (
                 <div className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Syncing nodes...</div>
               ) : filtered.length === 0 ? (
                 <div className="p-10 text-center text-slate-500">No matching subjects.</div>
               ) : (
                 filtered.map((patient, idx) => (
                   <motion.div 
                     key={patient.id}
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.02 }}
                     onClick={() => setSelected(patient)}
                     className={`p-6 cursor-pointer border-b border-white/[0.02] transition-all relative overflow-hidden group ${
                       selected?.id === patient.id ? 'bg-indigo-600/10' : 'hover:bg-white/[0.02]'
                     }`}
                   >
                      {selected?.id === patient.id && (
                        <motion.div layoutId="activePatient" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                         <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{patient.name}</p>
                         <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                           patient.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                         }`}>
                            {patient.status}
                         </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                         <p className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-slate-400 transition-colors">#{patient.id.substring(0,12)}</p>
                         <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{patient.age || '??'} YRS</p>
                      </div>
                   </motion.div>
                 ))
               )}
            </div>
         </div>

         {/* Main detail */}
         <div className="flex-1 glass-card border border-white/5 rounded-[40px] bg-white/[0.01] overflow-hidden flex flex-col md:flex-row">
            {selected ? (
              <AnimatePresence mode="wait">
                 <motion.div 
                   key={selected.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="flex-1 flex flex-col md:flex-row w-full"
                 >
                    {/* Hero Profile */}
                    <div className="w-full md:w-1/2 p-12 flex flex-col items-center justify-center text-center border-r border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                        <div className="relative mb-8">
                           <div className="w-32 h-32 bg-indigo-600 rounded-[40px] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-500/20 relative z-10">
                              {selected.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                           </div>
                           <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#0f172a] border border-white/10 rounded-xl flex items-center justify-center text-emerald-400 shadow-xl z-20">
                              <ShieldCheck size={20} />
                           </div>
                        </div>
                        
                        <h2 className="text-3xl font-black text-white mb-2">{selected.name}</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Verified Registry • {selected.id}</p>
                        
                        <div className="flex flex-wrap justify-center gap-3">
                           <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                              <Heart size={14} className="text-rose-400" />
                              <span className="text-xs font-bold text-slate-300">Heart Status: Optimal</span>
                           </div>
                           <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                              <Calendar size={14} className="text-indigo-400" />
                              <span className="text-xs font-bold text-slate-300">Onboarded {selected.joiningDate}</span>
                           </div>
                        </div>
                        
                        <div className="w-full h-px bg-white/5 my-10" />
                        
                        <div className="grid grid-cols-2 gap-4 w-full px-6">
                           <button className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95">Open Dossier</button>
                           <button className="flex-1 py-4 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">Relay Message</button>
                        </div>
                    </div>

                    {/* Data Points */}
                    <div className="flex-1 p-12 bg-white/[0.01]">
                       <div className="flex items-center gap-3 mb-10">
                          <User className="text-indigo-400" size={24} />
                          <h3 className="text-xl font-black text-white">Subject Parameters</h3>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { icon: Phone, label: 'Comms Link', value: selected.phone, color: 'indigo' },
                            { icon: Mail, label: 'Direct Relay', value: selected.email, color: 'purple' },
                            { icon: Activity, label: 'Primary Pathology', value: selected.condition, color: 'emerald' },
                            { icon: FileClock, label: 'Historical Sync', value: selected.lastVisit, color: 'amber' },
                            { icon: MapPin, label: 'Regional Node', value: 'Global North East', color: 'rose' },
                            { icon: Calendar, label: 'Temporal Age', value: `${selected.age || '??'} Rotations`, color: 'cyan' },
                          ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className="p-6 glass-card bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-indigo-500/30 transition-all">
                               <div className="flex items-center gap-3 mb-3">
                                  <div className={`p-2 bg-${color}-500/10 text-${color}-400 rounded-xl`}>
                                     <Icon size={16} />
                                  </div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest uppercase">{label}</p>
                               </div>
                               <p className="text-base font-bold text-white group-hover:text-white transition-colors truncate">{value}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                 </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-30">
                 <User size={80} className="text-slate-600 mb-6" />
                 <p className="text-xl font-bold text-white">Selection Required</p>
                 <p className="text-sm text-slate-500">Initiate subject selection to retrieve healthcare parameters.</p>
              </div>
            )}
         </div>

      </div>

    </div>
  );
}

// Helper icons
function RefreshCw({ size, className }) {
  return <motion.svg 
    xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></motion.svg>;
}

function ShieldCheck({ size }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>;
}

