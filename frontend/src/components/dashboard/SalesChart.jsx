import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const FILTERS = [
  { label: '7 Days',     value: '7days' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year',  value: 'year'  },
];

function filterData(allData, filter) {
  if (!allData || allData.length === 0) return [];

  // Use the dataset's latest date as the reference point (not today),
  // so historical datasets still get meaningful filtering.
  const dates = allData.map(d => new Date(d.raw_date));
  const refDate = new Date(Math.max(...dates));

  return allData.filter(d => {
    const date = new Date(d.raw_date);
    if (filter === '7days') {
      const cutoff = new Date(refDate);
      cutoff.setDate(cutoff.getDate() - 7);
      return date >= cutoff;
    } else if (filter === 'month') {
      return date.getFullYear() === refDate.getFullYear() && date.getMonth() === refDate.getMonth();
    } else if (filter === 'year') {
      return date.getFullYear() === refDate.getFullYear();
    }
    return true;
  });
}

export default function SalesChart({ isDarkMode = false, onFilteredData }) {
  const [allData, setAllData] = useState([]);
  const [filter, setFilter]   = useState('year');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  // Re-notify parent whenever filter or data changes
  useEffect(() => {
    if (allData.length === 0) return;
    const filtered = filterData(allData, filter);
    if (onFilteredData) onFilteredData(filtered, filter);
  }, [allData, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/sales/analytics');
      setAllData(res.data.map(d => ({
        ...d,
        raw_date: d.order_date,
        order_date: new Date(d.order_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      })));
    } catch (err) {
      console.error("Error fetching sales analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const displayData = filterData(allData, filter);

  const card    = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
  const title   = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const sub     = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const tick    = isDarkMode ? '#94a3b8' : '#64748b';
  const grid    = isDarkMode ? '#334155' : '#f1f5f9';
  const ttStyle = isDarkMode
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }
    : { borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };

  if (loading) return <div className={`h-96 w-full animate-pulse rounded-2xl ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />;

  return (
    <div className={`p-6 rounded-2xl shadow-sm border col-span-1 lg:col-span-8 flex flex-col h-full transition-colors ${card}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-xl font-bold ${title}`}>Sales &amp; Profit Trend</h2>
          <p className={`text-sm ${sub}`}>Live feed from Sales Dataset</p>
        </div>

        {/* Filter pill tabs */}
        <div className={`flex rounded-xl overflow-hidden border text-sm font-semibold ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 transition-colors ${
                filter === f.value
                  ? 'bg-indigo-600 text-white'
                  : isDarkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full h-80 min-h-[300px]">
        {displayData.length === 0 ? (
          <div className={`w-full h-full flex items-center justify-center ${sub}`}>No sales data for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
              <XAxis dataKey="order_date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tick }} dy={10} />
              <YAxis yAxisId="left"  axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tick }} dx={-10} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tick }} dx={10} />
              <Tooltip contentStyle={ttStyle} labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }} />
              <Legend verticalAlign="top" height={36} />
              <Line yAxisId="left"  type="monotone" dataKey="total_sales"  name="Revenue (₹)" stroke={isDarkMode ? '#818cf8' : '#0f172a'} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="total_profit" name="Profit (₹)"  stroke="#10b981" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
