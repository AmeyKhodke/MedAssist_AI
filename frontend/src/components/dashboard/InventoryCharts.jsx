import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis as BarYAxis, CartesianGrid, Tooltip as BarTooltip } from 'recharts';
import { Layers, Activity, Star, ClipboardList } from 'lucide-react';
import axios from 'axios';

const API_BASE = "http://localhost:8000";

export default function InventoryCharts({ isDarkMode = true }) {
  const [stockStatusData, setStockStatusData] = useState([]);
  const [topSellingData,  setTopSellingData]  = useState([]);
  const [loading, setLoading]                 = useState(true);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const invRes = await axios.get(`${API_BASE}/api/inventory`, authHeader);
      const inv = invRes.data;
      let inStock = 0, lowStock = 0, outOfStock = 0;
      inv.forEach(item => {
        if (item.status === 'In Stock') inStock++;
        else if (item.status === 'Low Stock') lowStock++;
        else outOfStock++;
      });
      
      setStockStatusData([
        { name: 'Optimal',  value: inStock,     color: '#10b981' },
        { name: 'Warning',  value: lowStock,    color: '#f59e0b' },
        { name: 'Critical', value: outOfStock,  color: '#f43f5e' },
      ].filter(d => d.value > 0));

      setTopSellingData(
        [...inv].sort((a, b) => b.unit_price - a.unit_price).slice(0, 5)
          .map(i => ({ 
            name: i.name.split(' ')[0], 
            revenue: Math.round(i.unit_price * 150),
            full_name: i.name
          }))
      );
    } catch (err) {
      console.error('Critical: Inventory analytics sync failure.', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="col-span-1 lg:col-span-4 flex flex-col gap-8">
      <div className="h-[250px] rounded-[32px] bg-white/[0.01] border border-white/5 animate-pulse" />
      <div className="h-[250px] rounded-[32px] bg-white/[0.01] border border-white/5 animate-pulse" />
    </div>
  );

  return (
    <div className="col-span-1 lg:col-span-4 flex flex-col gap-8 h-full">
      
      {/* Distribution Donut */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="glass-card border border-white/5 p-8 rounded-[32px] bg-white/[0.01] flex flex-col h-[280px] group relative overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-1">
           <Layers size={14} className="text-indigo-400" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Stock Topology</span>
        </div>
        <h3 className="text-xl font-black text-white mb-6">Inventory <span className="text-indigo-500">Spread</span></h3>
        
        <div className="flex-1 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={stockStatusData} 
                cx="50%" cy="50%" 
                innerRadius={60} 
                outerRadius={80} 
                paddingAngle={8} 
                dataKey="value"
                animationDuration={2000}
              >
                {stockStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <PieTooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-3xl font-black text-white">{stockStatusData.reduce((a, c) => a + c.value, 0)}</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global SKUs</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          {stockStatusData.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: d.color }} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Assets */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="glass-card border border-white/5 p-8 rounded-[32px] bg-white/[0.01] flex flex-col h-[280px] group relative overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-1">
           <Star size={14} className="text-amber-400" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Yield Leaders</span>
        </div>
        <h3 className="text-xl font-black text-white mb-6">Top <span className="text-indigo-500">Assets</span></h3>

        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSellingData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis type="number" hide />
              <BarYAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                width={70} 
              />
              <BarTooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<CustomBarTooltip />} />
              <Bar 
                dataKey="revenue" 
                fill="#6366f1" 
                radius={[0, 8, 8, 0]} 
                barSize={12} 
                animationDuration={2500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: data.color }}>{data.name} Status</p>
        <p className="text-lg font-black text-white">{data.value} Items</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{data.full_name}</p>
        <p className="text-lg font-black text-white">₹{data.revenue.toLocaleString()}</p>
        <p className="text-[10px] font-medium text-emerald-400 mt-1 uppercase tracking-tighter">Derived Yield Index</p>
      </div>
    );
  }
  return null;
};
