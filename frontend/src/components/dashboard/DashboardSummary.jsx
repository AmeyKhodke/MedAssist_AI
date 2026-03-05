import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, ShoppingBag, BarChart2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const FILTER_LABELS = {
  '7days': 'Last 7 days',
  'month': 'This month',
  'year':  'This year',
};

export default function DashboardSummary({ isDarkMode = false, salesData = null, activeFilter = 'year' }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const summaryRes = await axios.get('http://localhost:8000/api/dashboard/summary');
      setData(summaryRes.data);
    } catch (err) {
      console.error("Error fetching dashboard summary", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
      {[1,2,3,4].map(i => (
        <div key={i} className={`h-[150px] rounded-lg animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
      ))}
    </div>
  );

  // Compute revenue & profit from filtered sales data when available
  const filteredRevenue = salesData && salesData.length > 0
    ? salesData.reduce((sum, d) => sum + (d.total_sales  || 0), 0)
    : null;
  const filteredProfit = salesData && salesData.length > 0
    ? salesData.reduce((sum, d) => sum + (d.total_profit || 0), 0)
    : null;

  const displayRevenue = filteredRevenue !== null ? filteredRevenue : (data?.total_revenue ?? data?.today_revenue ?? 0);
  const displayProfit  = filteredProfit  !== null ? filteredProfit  : (data?.monthly_profit ?? 0);

  const sparkData    = (salesData && salesData.length > 0 ? salesData : []).slice(-7);
  const revenueTrend = sparkData.map(d => ({ value: d.total_sales  }));
  const profitTrend  = sparkData.map(d => ({ value: d.total_profit }));

  const filterLabel = FILTER_LABELS[activeFilter] || 'Selected period';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
      <KPICard isDarkMode={isDarkMode}
        title="Total Medicines" value={data?.total_medicines ?? '—'}
        icon={<ShoppingBag size={24} className="text-blue-500" />}
        trend={`${data?.total_medicines ?? 0} SKUs tracked`} trendUp={true}
        colorClass="bg-[#E0F2FE]" strokeColor="#0EA5E9" textColor="text-[#0369A1]"
        sparkData={Array.from({ length: 7 }, (_, i) => ({ value: 40 + i * 2 }))}
      />
      <KPICard isDarkMode={isDarkMode}
        title="Low Stock Items" value={data?.low_stock_count ?? '—'}
        icon={<AlertCircle size={24} className="text-amber-500" />}
        trend={data?.low_stock_count > 0 ? 'Requires attention' : 'All stocked up'}
        trendUp={data?.low_stock_count === 0}
        colorClass="bg-[#FFEDD5]" strokeColor="#F97316" textColor="text-[#C2410C]"
        sparkData={Array.from({ length: 7 }, (_, i) => ({ value: Math.max(0, 5 - i) }))}
      />
      <KPICard isDarkMode={isDarkMode}
        title="Revenue"
        value={`₹${Number(displayRevenue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
        icon={<TrendingUp size={24} className="text-emerald-500" />}
        trend={filterLabel} trendUp={true}
        colorClass="bg-[#D1FAE5]" strokeColor="#10B981" textColor="text-[#047857]"
        sparkData={revenueTrend.length ? revenueTrend : Array.from({ length: 7 }, (_, i) => ({ value: 10 + i * 5 }))}
      />
      <KPICard isDarkMode={isDarkMode}
        title="Profit"
        value={`₹${Number(displayProfit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
        icon={<BarChart2 size={24} className="text-purple-500" />}
        trend={`${filterLabel} (40% margin)`} trendUp={true}
        colorClass="bg-[#F3E8FF]" strokeColor="#A855F7" textColor="text-[#7E22CE]"
        sparkData={profitTrend.length ? profitTrend : Array.from({ length: 7 }, (_, i) => ({ value: 5 + i * 3 }))}
      />
    </div>
  );
}

function KPICard({ title, value, icon, trend, trendUp, colorClass, strokeColor, textColor, sparkData, isDarkMode = false }) {
  const cardBg   = isDarkMode ? 'bg-slate-800 border-slate-700' : `${colorClass} border-slate-100`;
  const titleCls = isDarkMode ? 'text-slate-400' : `${textColor} opacity-80`;
  const valueCls = isDarkMode ? 'text-white'     : textColor;
  const trendCls = isDarkMode ? 'text-slate-500' : `${textColor} opacity-70`;
  const iconWell = isDarkMode ? 'bg-slate-700'   : 'bg-white/50 backdrop-blur-sm';

  return (
    <div className={`rounded-lg p-5 shadow-sm border flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all h-[150px] ${cardBg}`}>
      <div className="flex justify-between items-start z-10 w-full">
        <div className="flex-1">
          <p className={`text-sm font-semibold mb-1 ${titleCls}`}>{title}</p>
          <h3 className={`text-2xl font-bold tracking-tight ${valueCls}`}>{value}</h3>
        </div>
        <div className={`p-2.5 rounded-lg self-start ml-2 shadow-sm ${iconWell}`}>
          {icon}
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between z-10 w-full relative">
        <div className="w-20 h-10 -ml-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className={`text-xs font-medium ${trendCls} text-right max-w-[120px]`}>
          {trendUp ? '▲' : '▼'} {trend}
        </p>
      </div>
    </div>
  );
}
