import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
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
        title="Total medicines" 
        value="52"
        icon={<TrendingUp size={24} className="text-emerald-500" />}
        trend="+12 this week"
        trendUp={true}
        colorClass="bg-[#E0F2FE]" // Blue background
        strokeColor="#0EA5E9"
        textColor="text-[#0369A1]"
      />
      <KPICard 
        title="Low Stock items" 
        value="0"
        icon={<AlertCircle size={24} className="text-amber-600" />}
        trend="Requires action"
        trendUp={false}
        colorClass="bg-[#FFEDD5]" // Orange background
        strokeColor="#F97316"
        textColor="text-[#C2410C]"
      />
      <KPICard 
        title="Total revenue" 
        value="₹29"
        icon={<TrendingUp size={24} className="text-emerald-500" />}
        trend="+8.2% vs yesterday"
        trendUp={true}
        colorClass="bg-[#D1FAE5]" // Green background
        strokeColor="#10B981"
        textColor="text-[#047857]"
      />
      <KPICard 
        title="Monthly Profit" 
        value="₹1251.92"
        icon={<TrendingUp size={24} className="text-emerald-500" />}
        trend="+14% this month"
        trendUp={true}
        colorClass="bg-[#F3E8FF]" // Purple background
        strokeColor="#A855F7"
        textColor="text-[#7E22CE]"
      />
    </div>
  );
}

function KPICard({ title, value, icon, trend, trendUp, colorClass, strokeColor, textColor }) {
  // Generate random trend data for visual purposes
  const mockTrendData = Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 50) + 10 }));

  return (
    <div className={cn("rounded-lg p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all h-[150px]", colorClass)}>
      <div className="flex justify-between items-start z-10 w-full">
        <div className="flex-1">
          <p className={cn("text-sm font-semibold mb-1 opacity-80", textColor)}>{title}</p>
          <h3 className={cn("text-2xl font-bold tracking-tight", textColor)}>{value}</h3>
        </div>
        <div className="p-2.5 rounded-lg bg-white/50 backdrop-blur-sm self-start ml-2 shadow-sm">
          {icon}
        </div>
      </div>
      
      <div className="mt-auto flex items-end justify-between z-10 w-full relative">
        <div className="w-20 h-10 -ml-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockTrendData}>
              <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
