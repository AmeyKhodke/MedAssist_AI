import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Filter, Share2, Download, Zap } from 'lucide-react';
import api from '../../api';

export default function SalesChart({ isDarkMode = true, onFilteredData }) {
  const [allData, setAllData] = useState([]);
  const [filter, setFilter]   = useState('year');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  useEffect(() => {
    if (allData.length === 0) return;
    const filtered = filterData(allData, filter);
    if (onFilteredData) onFilteredData(filtered, filter);
  }, [allData, filter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/sales/analytics`);
      setAllData(res.data.map(d => ({
        ...d,
        raw_date: d.order_date,
        order_date: new Date(d.order_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      })));
    } catch (err) {
      console.error("Critical: Analytics sync failure.", err);
    } finally {
      setLoading(false);
    }
  };

  const displayData = filterData(allData, filter);

  if (loading) return (
     <div className="col-span-1 lg:col-span-8 h-[450px] glass-card border border-white/5 rounded-[40px] bg-white/[0.01] animate-pulse" />
  );

  return (
    <div className="col-span-1 lg:col-span-8 group glass-card border border-white/5 p-10 rounded-[40px] bg-white/[0.01] flex flex-col h-[450px] relative overflow-hidden transition-all hover:bg-white/[0.02]">
      
      {/* Background Accent Gear */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Zap size={14} className="text-emerald-400" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Market Dynamics</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Financial <span className="text-indigo-500">Vector</span></h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Live Economic Cluster Feed</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
             {FILTERS.map(f => (
               <button
                 key={f.value}
                 onClick={() => setFilter(f.value)}
                 className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   filter === f.value 
                     ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                     : 'text-slate-500 hover:text-slate-300'
                 }`}
               >
                 {f.label}
               </button>
             ))}
           </div>
           
           <div className="hidden md:flex items-center gap-2 ml-4">
              <button className="p-3 text-slate-500 hover:text-white bg-white/5 border border-white/10 rounded-xl transition-all"><Download size={18} /></button>
              <button className="p-3 text-slate-500 hover:text-white bg-white/5 border border-white/10 rounded-xl transition-all"><Share2 size={18} /></button>
           </div>
        </div>
      </div>

      <div className="flex-1 w-full relative z-10 overflow-hidden">
        {displayData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
             <Filter size={48} className="opacity-20" />
             <p className="font-black uppercase tracking-widest text-xs">Void: No Parameters Found</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                 <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                 </linearGradient>
                 <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                 </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis 
                dataKey="order_date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                dy={15} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="total_sales"  
                name="Revenue" 
                stroke="#6366f1" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorRev)" 
                animationDuration={2000}
              />
              <Area 
                type="monotone" 
                dataKey="total_profit" 
                name="Profit"  
                stroke="#10b981" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorProfit)" 
                animationDuration={2500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{label}</p>
        <div className="space-y-2">
           <div className="flex items-center justify-between gap-8">
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Revenue
              </span>
              <span className="text-sm font-black text-white">₹{payload[0].value.toLocaleString()}</span>
           </div>
           <div className="flex items-center justify-between gap-8">
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Net Profit
              </span>
              <span className="text-sm font-black text-emerald-400">₹{payload[1].value.toLocaleString()}</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};
