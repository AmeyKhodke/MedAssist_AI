import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, MoreVertical, Package, RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import api from '../../api';

export default function InventoryView({ isDarkMode = true }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMedicine, setNewMedicine] = useState({ name: '', category: 'General', price: 0, stock: 0 });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/inventory`);
      setInventory(res.data);
    } catch (err) {
      console.error("Critical: Inventory sync failed.", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/inventory/add`, newMedicine);
      setIsAddModalOpen(false);
      setNewMedicine({ name: '', category: 'General', price: 0, stock: 0 });
      fetchInventory();
    } catch (err) {
      // api handles toast
    }
  };

  const filtered = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All Categories', ...new Set(inventory.map(item => item.category))];

  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Inventory Management</span>
           </div>
           <h1 className="text-4xl font-black tracking-tight text-white mb-2">Master <span className="text-indigo-500">Inventory</span></h1>
           <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
              Real-time synchronization with centralized pharmaceutical stock. Monitored for stock-outs and expiry alerts.
           </p>
        </div>
        
        <div className="flex items-center gap-4">
           <button onClick={fetchInventory} className="glass-card flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition-all font-bold text-sm">
              <RefreshCw size={18} className={loading ? 'animate-spin text-indigo-500' : ''} />
              <span>Sync Mesh</span>
           </button>
           <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
              <Plus size={20} />
              <span>Add Resource</span>
           </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search resource protocols, ID codes, or classification..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
            <Filter size={18} className="text-slate-500" />
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-300 cursor-pointer pr-4"
            >
               {categories.map(cat => (
                 <option key={cat} value={cat} className="bg-[#0f172a]">{cat}</option>
               ))}
            </select>
         </div>
      </div>

      {/* Inventory Table */}
      <div className="flex-1 glass-card border border-white/5 rounded-3xl overflow-hidden flex flex-col relative bg-white/[0.01]">
         <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
               <thead className="sticky top-0 z-20 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5">
                  <tr>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Resource Profile</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Classification</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Stock Status</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Valuation</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Action Hash</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.02]">
                  {filtered.map((item, idx) => (
                    <motion.tr 
                      key={item.name} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all text-indigo-400">
                                <Package size={18} />
                             </div>
                             <div>
                                <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{item.name}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID: MED-{item.name.substring(0,3).toUpperCase()}{idx + 101}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                             {item.category}
                          </span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                             <div className="flex justify-between w-40 mb-1">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                  item.stock <= 20 ? 'text-rose-400' : 'text-slate-400'
                                }`}>
                                   {item.stock} Units
                                </span>
                                <span className="text-[10px] font-bold text-slate-600">CAP: 500</span>
                             </div>
                             <div className="w-40 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (item.stock / 500) * 100)}%` }}
                                  className={`h-full rounded-full ${
                                    item.stock <= 20 ? 'bg-rose-500' : 'bg-indigo-500'
                                  }`} 
                                />
                             </div>
                             {item.stock <= 20 && (
                                <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase tracking-tighter">
                                   <AlertTriangle size={10} /> Critical Low Stock
                                </span>
                             )}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-base font-black text-white">₹{item.unit_price.toFixed(2)}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Per Base Unit</p>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <button className="p-3 text-slate-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                             <MoreVertical size={20} />
                          </button>
                       </td>
                    </motion.tr>
                  ))}
               </tbody>
            </table>
            {filtered.length === 0 && !loading && (
               <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-50">
                  <Package size={64} className="text-slate-600 mb-2" />
                  <p className="text-lg font-bold text-white">No Inventory Metrics Detected</p>
                  <p className="text-sm text-slate-500">Your search parameters did not match any resource profile in the mesh.</p>
               </div>
            )}
         </div>

         {/* Pagination / Footer */}
         <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex justify-between items-center z-20">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Active Database: <span className="text-slate-300">PHARMACY_MESH_NODE_01</span>
               </p>
            </div>
            <div className="flex items-center gap-3">
               <button disabled className="p-2 text-slate-600 hover:text-white disabled:opacity-30"><X size={16}/></button>
               <span className="text-xs font-black text-indigo-400">PAGE 01 / 01</span>
               <button disabled className="p-2 text-slate-600 hover:text-white disabled:opacity-30"><X size={16} className="rotate-180"/></button>
            </div>
         </div>
      </div>

      {/* Side Alerts Overlay (Simulated) */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-4 pointer-events-none z-50">
         <AnimatePresence>
            {inventory.some(i => i.stock <= 5) && (
              <motion.div 
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="glass-card bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4 pointer-events-auto"
              >
                  <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white">
                     <AlertTriangle size={20} />
                  </div>
                  <div>
                     <p className="text-xs font-black text-white uppercase tracking-widest">Stock Alert</p>
                     <p className="text-xs text-rose-300">Supplies reaching critical threshold.</p>
                  </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* Add Resource Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-card border border-white/10 p-10 rounded-[40px] shadow-2xl overflow-hidden bg-[#0f172a]"
            >
               <div className="absolute top-0 right-0 p-8">
                  <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
               </div>
               
               <div className="mb-10 text-center">
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mx-auto mb-6">
                     <Plus size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-white">New Resource</h2>
                  <p className="text-slate-500 text-sm font-medium mt-2">Initialize a new medicine profile in the mesh.</p>
               </div>

               <form onSubmit={handleAddMedicine} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-2">Protocol Name</label>
                     <input required type="text" value={newMedicine.name} onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all" placeholder="e.g. AMX-700 High Potency" />
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-2">Classification</label>
                     <input required type="text" value={newMedicine.category} onChange={e => setNewMedicine({...newMedicine, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all" placeholder="e.g. NEURO_PHARMA" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-2">Base Valuation (₹)</label>
                        <input required type="number" step="0.01" min="0" value={newMedicine.price} onChange={e => setNewMedicine({...newMedicine, price: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-2">Static Units</label>
                        <input required type="number" min="0" value={newMedicine.stock} onChange={e => setNewMedicine({...newMedicine, stock: parseInt(e.target.value, 10)})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all" />
                     </div>
                  </div>

                  <button type="submit" className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-[24px] text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] mt-4">
                     Confirm Initialization
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
