import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Search, Package, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import api from '../../api';

export default function InventoryTable({ isDarkMode = true }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/inventory`);
      setInventory(res.data);
    } catch (err) { 
      console.error("Critical: Inventory sync protocols failed.", err); 
    } finally { 
      setLoading(false); 
    }
  };

  if (loading) return (
     <div className="col-span-1 lg:col-span-12 h-96 glass-card border border-white/5 rounded-[32px] bg-white/[0.01] animate-pulse" />
  );

  const filtered = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="col-span-1 lg:col-span-12 glass-card border border-white/5 rounded-[32px] overflow-hidden flex flex-col h-[500px] bg-white/[0.01] relative transition-all group">
      
      {/* Table Header */}
      <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row justify-between items-start sm:items-center sticky top-0 z-30 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Terminal size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Inventory Management Unit</span>
           </div>
           <h2 className="text-xl font-black text-white tracking-tight">Resource <span className="text-indigo-500">Registry</span></h2>
        </div>

        <div className="relative w-full sm:w-80 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600"
            placeholder="Search active clusters..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="overflow-auto custom-scrollbar flex-1 relative">
        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
          <thead className="sticky top-0 z-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Identity</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Security Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Unit Liquidity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {filtered.map((item, idx) => (
              <motion.tr 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.01 }}
                className="group/row hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-8 py-5">
                   <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 group-hover/row:text-indigo-400 group-hover/row:border-indigo-500/20 transition-all`}>
                         <Package size={18} />
                      </div>
                      <p className="font-bold text-white tracking-tight">{item.name}</p>
                   </div>
                </td>
                <td className="px-8 py-5 text-center">
                   <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 w-32 mx-auto ${
                     item.status === 'In Stock'  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                     item.status === 'Low Stock' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                     'bg-rose-500/10 text-rose-400 border-rose-500/20'
                   }`}>
                     {item.status === 'In Stock'  && <CheckCircle2 size={12} />}
                     {item.status === 'Low Stock' && <AlertTriangle size={12} />}
                     {item.status === 'Out of Stock' && <Activity size={12} />}
                     {item.status}
                   </span>
                </td>
                <td className="px-8 py-5 text-right">
                   <span className="text-lg font-black text-white">{item.stock}</span>
                   <span className="text-[10px] font-black text-slate-600 ml-1 uppercase">Units</span>
                </td>
              </motion.tr>
            ))}
            
            {filtered.length === 0 && (
              <tr>
                <td colSpan="3" className="px-8 py-20 text-center opacity-30">
                   <Search size={48} className="mx-auto mb-4" />
                   <p className="text-xl font-black text-white">No Clusters Synced</p>
                   <p className="text-sm font-medium text-slate-500">Search parameters yielded zero active matches.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-white/5 bg-white/[0.02] flex justify-between items-center z-30">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
               Local Node Access: <span className="text-slate-300">AUTHORIZED_SECURE</span>
            </p>
         </div>
         <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
            {inventory.length} Global Units Active
         </div>
      </div>
    </div>
  );
}
