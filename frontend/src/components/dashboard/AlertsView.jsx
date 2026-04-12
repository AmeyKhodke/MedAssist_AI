import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, ShieldAlert, Cpu, CheckCircle, RefreshCcw, XCircle, AlertTriangle, Zap, Terminal } from 'lucide-react';
import api from '../../api';

export default function AlertsView({ isDarkMode = true }) {
  const [restocks, setRestocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRestocks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/restocks`);
      setRestocks(res.data);
    } catch (e) { 
      console.error('Critical: Restock sync failure.', e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchRestocks();
    const interval = setInterval(fetchRestocks, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id, name, requestedQty) => {
    try {
      const addAmount = Math.max(50, requestedQty * 2); 
      await api.post(`/api/restocks/${id}/approve`, { amount_to_add: addAmount });
      setRestocks(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      // api handles toast
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/api/restocks/${id}/reject`, {});
      setRestocks(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      // api handles toast
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1200px] mx-auto animate-in fade-in duration-500">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Emergency Response System</span>
           </div>
           <h1 className="text-4xl font-black tracking-tight text-white mb-2">Action <span className="text-indigo-500">Center</span></h1>
           <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
              Monitoring critical stock depletion and system alerts. Executive intervention required for pharmaceutical restock protocols.
           </p>
        </div>
        
        <div className="flex items-center gap-4">
           <button onClick={fetchRestocks} className="glass-card flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition-all font-bold text-sm">
              <RefreshCcw size={18} className={loading ? 'animate-spin text-rose-500' : ''} />
              <span>Rescan Nodes</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         <div className="glass-card border border-white/5 rounded-[32px] overflow-hidden bg-white/[0.01]">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-500">
                      <BellRing size={20} />
                   </div>
                   <div>
                      <h3 className="text-lg font-black text-white">Pending Restock Protocols</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Awaiting Executive Authorization</p>
                   </div>
                </div>
                <div className="px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-xs font-black uppercase tracking-widest">
                   {restocks.length} Active Alerts
                </div>
            </div>

            <div className="divide-y divide-white/[0.02]">
               <AnimatePresence mode="popLayout">
                  {restocks.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-20 text-center space-y-4 opacity-50"
                    >
                       <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6">
                          <CheckCircle size={40} />
                       </div>
                       <p className="text-xl font-black text-white">System Optimal</p>
                       <p className="text-sm text-slate-500">No critical stock depletion events detected in the current cycle.</p>
                    </motion.div>
                  ) : (
                    restocks.map((req, idx) => (
                      <motion.div 
                        key={req.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-8 group hover:bg-white/[0.02] transition-all flex flex-col md:flex-row gap-8 items-start md:items-center"
                      >
                         <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-lg shadow-rose-500/5">
                            <ShieldAlert size={32} />
                         </div>
                         
                         <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                               <div>
                                  <h4 className="text-lg font-black text-white group-hover:text-rose-400 transition-colors">Critical Deficit: {req.medicine}</h4>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detection Timestamp: {new Date(req.timestamp).toLocaleString()}</p>
                               </div>
                               <div className="flex flex-col items-end">
                                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">Node_ID: {req.id}</span>
                               </div>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">
                               Subject <span className="text-white font-bold">{req.user_id}</span> requested <span className="text-white font-bold">{req.requested_qty}</span> units. 
                               Mesh inventory shows <span className="text-rose-400 font-bold">{req.current_stock}</span> remaining. Emergency replenishment recommended.
                            </p>
                            
                            <div className="flex flex-wrap gap-3 pt-2">
                               <div className="px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center gap-2">
                                  <Zap size={12} className="text-indigo-400" />
                                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Auto_Scale Actionable</span>
                               </div>
                               <div className="px-3 py-1.5 bg-purple-500/5 border border-purple-500/10 rounded-xl flex items-center gap-2">
                                  <Terminal size={12} className="text-purple-400" />
                                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Audit Trail: Secured</span>
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex flex-col gap-3 w-full md:w-auto">
                            <button 
                              onClick={() => handleApprove(req.id, req.medicine, req.requested_qty)}
                              className="w-full md:w-48 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-xl shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2"
                            >
                               <CheckCircle size={16} /> Execute Restock
                            </button>
                            <button 
                              onClick={() => handleReject(req.id)}
                              className="w-full md:w-48 py-4 bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                               <XCircle size={16} /> Decline
                            </button>
                         </div>
                      </motion.div>
                    ))
                  )}
               </AnimatePresence>
            </div>
            
            <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Monitor: <span className="text-slate-300">Reactive Compliance Active</span></p>
               </div>
               <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Secure Admin Relayed Session
               </div>
            </div>
         </div>

         {/* Proactive Prediction (Simulated / Placeholder) */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card border border-white/5 p-8 rounded-[32px] bg-white/[0.01]">
               <div className="flex items-center gap-3 mb-6">
                  <Cpu className="text-indigo-400" size={24} />
                  <h4 className="text-lg font-black text-white">Neural Monitoring</h4>
               </div>
               <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Real-time pattern recognition scanning for unusual demand spikes and potential logistics bottlenecks in the regional network.
               </p>
            </div>
            <div className="glass-card border border-white/5 p-8 rounded-[32px] bg-white/[0.01] flex items-center gap-6">
               <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                  <Zap size={32} />
               </div>
               <div>
                  <h4 className="text-lg font-black text-white">Efficiency Index: 98%</h4>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Optimization Complete</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
