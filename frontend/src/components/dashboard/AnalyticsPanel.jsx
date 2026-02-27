import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper to generate mock data based on timeframe
const generateData = (metric, timeframe) => {
  const data = [];
  let points = 7;
  let labelPrefix = 'Day ';
  let multiplier = 1;

  if (timeframe === '7D') {
    points = 7;
    labelPrefix = 'Day ';
    multiplier = 1;
  } else if (timeframe === '1M') {
    points = 30;
    labelPrefix = 'D';
    multiplier = 1.2;
  } else if (timeframe === '1Y') {
    points = 12;
    labelPrefix = 'M';
    multiplier = 30;
  } else if (timeframe === 'ALL') {
    points = 5;
    labelPrefix = 'Y';
    multiplier = 365;
  }

  for (let i = 1; i <= points; i++) {
    let baseValue = 1000;
    if (metric === 'sales') baseValue = 5000;
    if (metric === 'profit') baseValue = 1500;
    if (metric === 'orders') baseValue = 150;

    // Add some random variance
    const variance = (Math.random() - 0.5) * 0.4 * baseValue; 
    let value = Math.max(0, Math.floor((baseValue + variance) * multiplier));
    
    // Add upward trend
    value = Math.floor(value * (1 + (i * 0.05)));

    data.push({
      name: `${labelPrefix}${i}`,
      value: value
    });
  }
  return data;
};

export default function AnalyticsPanel() {
  const [activeMetric, setActiveMetric] = useState('sales'); // sales, profit, orders
  const [activeTimeframe, setActiveTimeframe] = useState('7D'); // 7D, 1M, 1Y, ALL

  const data = useMemo(() => generateData(activeMetric, activeTimeframe), [activeMetric, activeTimeframe]);

  const metrics = [
    { id: 'sales', label: 'Revenue', icon: <DollarSign size={16} />, color: '#6366F1' },
    { id: 'profit', label: 'Profit', icon: <TrendingUp size={16} />, color: '#10B981' },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag size={16} />, color: '#F59E0B' }
  ];

  const timeframes = [
    { id: '7D', label: 'Past 7 Days' },
    { id: '1M', label: 'This Month' },
    { id: '1Y', label: 'This Year' },
    { id: 'ALL', label: 'All Time' }
  ];

  const currentMetric = metrics.find(m => m.id === activeMetric);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden col-span-1 lg:col-span-12 flex flex-col mb-6">
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center bg-white gap-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">Analytics Deep-Dive</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Metric Selector */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {metrics.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id)}
                className={cn(
                  "flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm",
                  activeMetric === m.id 
                    ? "bg-white text-slate-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 shadow-none"
                )}
              >
                <span style={{ color: activeMetric === m.id ? m.color : undefined }}>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {timeframes.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTimeframe(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm",
                  activeTimeframe === t.id 
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-700 shadow-none border border-transparent"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {activeMetric === 'orders' ? '' : '₹'}
            {data.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
          </h3>
          <p className="text-sm font-medium text-emerald-600 flex items-center mt-1">
            <TrendingUp size={14} className="mr-1" />
            +12.5% vs previous period
          </p>
        </div>

        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === 'orders' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} width={60} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="value" fill={currentMetric.color} radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`color${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} width={60} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke={currentMetric.color} strokeWidth={3} fillOpacity={1} fill={`url(#color${activeMetric})`} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
