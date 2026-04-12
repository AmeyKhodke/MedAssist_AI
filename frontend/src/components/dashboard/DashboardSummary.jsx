import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, ShoppingBag, BarChart2, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import api from '../../api';

export default function DashboardSummary({ isDarkMode = true, salesData = null, activeFilter = 'year' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const summaryRes = await api.get(`/api/dashboard/summary`);
      setData(summaryRes.data);
    } catch (err) {
      console.error("Critical: Summary sync failure.", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-40 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
      ))}
    </div>
  );

  const displayRevenue = salesData && salesData.length > 0
    ? salesData.reduce((sum, d) => sum + (d.total_sales  || 0), 0)
    : (data?.total_revenue ?? data?.today_revenue ?? 0);

  const displayProfit = salesData && salesData.length > 0
    ? salesData.reduce((sum, d) => sum + (d.total_profit || 0), 0)
    : (data?.monthly_profit ?? 0);

  const sparkData = (salesData && salesData.length > 0 ? salesData : []).slice(-7);
  const revenueTrend = sparkData.map(d => ({ value: d.total_sales  }));
  const profitTrend  = sparkData.map(d => ({ value: d.total_profit }));

  const FILTER_LABELS = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year'
  };

  const filterLabel = FILTER_LABELS[activeFilter] || 'Selected period';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
      <KPICard 
        title="Resource Inventory" 
        value={data?.total_medicines ?? '0'}
        icon={<ShoppingBag size={20} />}
        trend={`${data?.total_medicines ?? 0} Global SKUs`} 
        trendUp={true}
        color="indigo"
        sparkData={Array.from({ length: 7 }, (_, i) => ({ value: 40 + i * 2 }))}
      />
      <KPICard 
        title="Critical Deficits" 
        value={data?.low_stock_count ?? '0'}
        icon={<AlertCircle size={20} />}
        trend={data?.low_stock_count > 0 ? 'High Risk Delta' : 'No Risks Detected'}
        trendUp={data?.low_stock_count === 0}
        color="rose"
        sparkData={Array.from({ length: 7 }, (_, i) => ({ value: Math.max(0, 15 - i * 2) }))}
      />
      <KPICard 
        title="Yield Volume"
        value={`₹${Number(displayRevenue).toLocaleString('en-IN')}`}
        icon={<TrendingUp size={20} />}
        trend={filterLabel} 
        trendUp={true}
        color="emerald"
        sparkData={revenueTrend.length ? revenueTrend : Array.from({ length: 7 }, (_, i) => ({ value: 10 + Math.sin(i) * 5 }))}
      />
      <KPICard 
        title="Operational Margin"
        value={`₹${Number(displayProfit).toLocaleString('en-IN')}`}
        icon={<BarChart2 size={20} />}
        trend="Estimated 42% Net" 
        trendUp={true}
        color="purple"
        sparkData={profitTrend.length ? profitTrend : Array.from({ length: 7 }, (_, i) => ({ value: 5 + i * 3 }))}
      />
    </div>
  );
}

function KPICard({ title, value, icon, trend, trendUp, color, sparkData }) {
  const colorMap = {
    indigo: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
    rose: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/10",
  };

  const accentColor = {
    indigo: "#6366f1",
    rose: "#f43f5e",
    emerald: "#10b981",
    purple: "#a855f7",
  }[color];

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card border border-white/5 p-8 rounded-[32px] bg-white/[0.01] relative overflow-hidden group transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="w-24 h-12 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={accentColor} 
                strokeWidth={3} 
                dot={false} 
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-right">
           <div className={`flex items-center justify-end gap-1 text-[10px] font-black uppercase tracking-widest ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trend}</span>
           </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className={`absolute -right-4 -bottom-4 w-20 h-20 blur-[60px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 rounded-full bg-${color}-500`} />
    </motion.div>
  );
}
