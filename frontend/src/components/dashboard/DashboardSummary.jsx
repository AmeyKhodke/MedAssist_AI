import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function DashboardSummary() {
  const [data, setData] = useState({
    total_medicines: 0,
    low_stock_count: 0,
    today_revenue: 0,
    monthly_profit: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/dashboard/summary');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard summary", err);
      setLoading(false);
    }
  };

  if (loading) return <div className="grid grid-cols-4 gap-6 animate-pulse mb-8"><div className="h-32 bg-slate-200 rounded-2xl"></div><div className="h-32 bg-slate-200 rounded-2xl"></div><div className="h-32 bg-slate-200 rounded-2xl"></div><div className="h-32 bg-slate-200 rounded-2xl"></div></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
      <KPICard 
        title="Total Medicines" 
        value={data.total_medicines}
        icon={<Package size={24} className="text-indigo-600" />}
        trend="+12 this week"
        trendUp={true}
        colorClass="bg-indigo-50"
      />
      <KPICard 
        title="Low Stock Items" 
        value={data.low_stock_count}
        icon={<AlertCircle size={24} className="text-amber-600" />}
        trend="Requires action"
        trendUp={false}
        colorClass="bg-amber-50"
      />
      <KPICard 
        title="Today's Revenue" 
        value={`₹${data.today_revenue}`}
        icon={<DollarSign size={24} className="text-emerald-600" />}
        trend="+8.2% vs yesterday"
        trendUp={true}
        colorClass="bg-emerald-50"
      />
      <KPICard 
        title="Monthly Profit" 
        value={`₹${data.monthly_profit}`}
        icon={<TrendingUp size={24} className="text-teal-600" />}
        trend="+14% this month"
        trendUp={true}
        colorClass="bg-teal-50"
      />
    </div>
  );
}

function KPICard({ title, value, icon, trend, trendUp, colorClass }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-50 transition-transform group-hover:scale-110", colorClass)}></div>
      
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl", colorClass)}>
          {icon}
        </div>
      </div>
      
      <div className="mt-4 flex items-center z-10">
        <span className={cn(
          "text-xs font-semibold px-2 py-1 rounded-md",
          trendUp ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        )}>
          {trend}
        </span>
      </div>
    </div>
  );
}
