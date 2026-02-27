import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, ShoppingBag, BarChart2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function DashboardSummary() {
  const [data, setData] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, salesRes] = await Promise.all([
        axios.get('http://localhost:8000/api/dashboard/summary'),
        axios.get('http://localhost:8000/api/sales/analytics')
      ]);
      setData(summaryRes.data);
      // Use last 7 data points for sparklines
      setSalesTrend(salesRes.data.slice(-7));
    } catch (err) {
      console.error("Error fetching dashboard summary", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-[150px] bg-slate-200 rounded-lg animate-pulse" />
      ))}
    </div>
  );

  const profitTrend = salesTrend.map(d => ({ value: d.total_profit }));
  const revenueTrend = salesTrend.map(d => ({ value: d.total_sales }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
      <KPICard
        title="Total Medicines"
        value={data?.total_medicines ?? '—'}
        icon={<ShoppingBag size={24} className="text-blue-500" />}
        trend={`${data?.total_medicines ?? 0} SKUs tracked`}
        trendUp={true}
        colorClass="bg-[#E0F2FE]"
        strokeColor="#0EA5E9"
        textColor="text-[#0369A1]"
        sparkData={Array.from({ length: 7 }, (_, i) => ({ value: 40 + i * 2 }))}
      />
      <KPICard
        title="Low Stock Items"
        value={data?.low_stock_count ?? '—'}
        icon={<AlertCircle size={24} className="text-amber-600" />}
        trend={data?.low_stock_count > 0 ? "Requires attention" : "All stocked up"}
        trendUp={data?.low_stock_count === 0}
        colorClass="bg-[#FFEDD5]"
        strokeColor="#F97316"
        textColor="text-[#C2410C]"
        sparkData={Array.from({ length: 7 }, (_, i) => ({ value: Math.max(0, 5 - i) }))}
      />
      <KPICard
        title="Total Revenue"
        value={`₹${Number(data?.total_revenue ?? data?.today_revenue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
        icon={<TrendingUp size={24} className="text-emerald-500" />}
        trend={`From all orders`}
        trendUp={true}
        colorClass="bg-[#D1FAE5]"
        strokeColor="#10B981"
        textColor="text-[#047857]"
        sparkData={revenueTrend.length ? revenueTrend : Array.from({ length: 7 }, (_, i) => ({ value: 10 + i * 5 }))}
      />
      <KPICard
        title="Monthly Profit"
        value={`₹${Number(data?.monthly_profit ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
        icon={<BarChart2 size={24} className="text-purple-500" />}
        trend="This month (40% margin)"
        trendUp={true}
        colorClass="bg-[#F3E8FF]"
        strokeColor="#A855F7"
        textColor="text-[#7E22CE]"
        sparkData={profitTrend.length ? profitTrend : Array.from({ length: 7 }, (_, i) => ({ value: 5 + i * 3 }))}
      />
    </div>
  );
}

function KPICard({ title, value, icon, trend, trendUp, colorClass, strokeColor, textColor, sparkData }) {
  return (
    <div className={`rounded-lg p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all h-[150px] ${colorClass}`}>
      <div className="flex justify-between items-start z-10 w-full">
        <div className="flex-1">
          <p className={`text-sm font-semibold mb-1 opacity-80 ${textColor}`}>{title}</p>
          <h3 className={`text-2xl font-bold tracking-tight ${textColor}`}>{value}</h3>
        </div>
        <div className="p-2.5 rounded-lg bg-white/50 backdrop-blur-sm self-start ml-2 shadow-sm">
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
        <p className={`text-xs font-medium opacity-70 ${textColor} text-right max-w-[120px]`}>
          {trendUp ? '▲' : '▼'} {trend}
        </p>
      </div>
    </div>
  );
}