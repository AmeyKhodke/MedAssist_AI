import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, XCircle, Clock, Eye, RefreshCw, CheckCheck, X, ShieldAlert } from 'lucide-react';
import api from '../../api';

export default function PrescriptionsView({ isDarkMode = true }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/approvals`);
      setPrescriptions(res.data);
    } catch (err) {
      console.error("Prescription sync failure.", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    setActionLoading(id);
    try {
      await api.post(`/api/approvals/${id}`, { status });
      await fetchPrescriptions();
    } catch (err) {
      console.error('Approval action failure', err);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = prescriptions.filter(p => p.status === 'pending').length;
  const approvedCount = prescriptions.filter(p => p.status === 'approved').length;
  const rejectedCount = prescriptions.filter(p => p.status === 'rejected').length;

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Compliance & Verification</span>
           </div>
           <h1 className="text-4xl font-black tracking-tight text-white mb-2">Prescription <span className="text-indigo-500">Queue</span></h1>
           <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
              Analyzing medical documentation for authenticity and safety verification. All actions are logged via encrypted audit trails.
           </p>
        </div>
        
        <button onClick={fetchPrescriptions} className="glass-card flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition-all font-bold text-sm">
           <RefreshCw size={18} className={loading ? 'animate-spin text-indigo-500' : ''} />
           <span>Verify Sync</span>
        </button>
      </div>

      {/* Stat Overlays */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {[
          { label: 'Pending Audit', count: pendingCount, Icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Authorized', count: approvedCount, Icon: ShieldAlert, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Red flagged', count: rejectedCount, Icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
        ].map(({ label, count, Icon, color, bg, border }) => (
          <motion.div 
            key={label}
            whileHover={{ y: -5 }}
            className={`p-8 glass-card border rounded-3xl bg-white/[0.01] flex items-center justify-between ${border}`}
          >
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
               <p className="text-3xl font-black text-white">{count}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ${color}`}>
               <Icon size={28} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Queue Table */}
      <div className="flex-1 glass-card border border-white/5 rounded-3xl overflow-hidden flex flex-col relative bg-white/[0.01]">
         <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
               <thead className="sticky top-0 z-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5">
                  <tr>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">RX Token</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Patient Hash</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Medical Professional</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Target Resource</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Security Status</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Verification Logic</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.02]">
                  {loading ? (
                    <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Synchronizing secure queue...</td></tr>
                  ) : prescriptions.map((req, idx) => (
                    <motion.tr 
                      key={req.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                       <td className="px-8 py-6">
                          <p className="font-mono text-indigo-400 font-bold text-xs">RX-{req.id + 8840}</p>
                          <p className="text-[10px] text-slate-600 font-bold mt-1 uppercase tracking-tighter">Verified: {new Date(req.timestamp).toLocaleDateString()}</p>
                       </td>
                       <td className="px-8 py-6 max-w-[150px]">
                          <p className="text-white font-bold truncate">{req.user_id}</p>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-slate-300 font-medium italic">{(req.doctor_name && req.doctor_name !== 'Unknown Doctor') ? req.doctor_name : 'No clinician specified'}</p>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-white font-black">{req.medicine}</p>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 w-32 mx-auto ${
                            req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            req.status === 'pending'  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {req.status === 'approved' && <CheckCircle2 size={12} />}
                            {req.status === 'pending'  && <Clock size={12} />}
                            {req.status === 'rejected' && <XCircle size={12} />}
                            {req.status}
                          </span>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                             {req.prescription_url && (
                               <a href={req.prescription_url} target="_blank" rel="noopener noreferrer" className="p-3 text-indigo-400 hover:text-white hover:bg-indigo-500/20 bg-indigo-500/5 border border-indigo-500/10 rounded-xl transition-all" title="View Document">
                                  <Eye size={18} />
                               </a>
                             )}
                             {req.status === 'pending' ? (
                               <>
                                 <button 
                                   disabled={actionLoading === req.id}
                                   onClick={() => handleAction(req.id, 'approved')}
                                   className="h-10 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                 >
                                    Authorize
                                 </button>
                                 <button 
                                   disabled={actionLoading === req.id}
                                   onClick={() => handleAction(req.id, 'rejected')}
                                   className="h-10 px-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                 >
                                    Decline
                                 </button>
                               </>
                             ) : (
                               <div className="h-10 px-4 flex items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest border border-white/5 bg-white/[0.02] rounded-xl">
                                  Finalized {req.status}
                               </div>
                             )}
                          </div>
                       </td>
                    </motion.tr>
                  ))}
               </tbody>
            </table>
            {prescriptions.length === 0 && !loading && (
               <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-50">
                  <FileText size={64} className="text-slate-600 mb-2" />
                  <p className="text-lg font-bold text-white">Queue Empty</p>
                  <p className="text-sm text-slate-500">All pending medical authorizations have been processed.</p>
               </div>
            )}
         </div>

         {/* Footer */}
         <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex justify-between items-center z-20">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-indigo-500 rounded-full" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Compliance Node: <span className="text-slate-300">AUTH_SECURE_GATEWAY_309</span>
               </p>
            </div>
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
               Encrypted Session • {new Date().toLocaleDateString()}
            </div>
         </div>
      </div>
    </div>
  );
}
