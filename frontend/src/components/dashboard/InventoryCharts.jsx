import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis as BarYAxis, CartesianGrid, Tooltip as BarTooltip } from 'recharts';
import axios from 'axios';

export default function InventoryCharts({ isDarkMode = false }) {
  const [stockStatusData, setStockStatusData] = useState([]);
  const [topSellingData,  setTopSellingData]  = useState([]);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const invRes = await axios.get('http://localhost:8000/api/inventory');
      const inv = invRes.data;
      let inStock = 0, lowStock = 0, outOfStock = 0;
      inv.forEach(item => {
        if (item.status === 'In Stock') inStock++;
        else if (item.status === 'Low Stock') lowStock++;
        else outOfStock++;
      });
      setStockStatusData([
        { name: 'In Stock',     value: inStock,     color: '#10b981' },
        { name: 'Low Stock',    value: lowStock,     color: '#f59e0b' },
        { name: 'Out of Stock', value: outOfStock,   color: '#ef4444' },
      ].filter(d => d.value > 0));

      setTopSellingData(
        [...inv].sort((a, b) => b.unit_price - a.unit_price).slice(0, 5)
          .map(i => ({ name: i.name.split(' ')[0], revenue: Math.round(i.unit_price * 150) }))
      );
    } catch (err) {
      console.error('Error fetching inventory charts', err);
    } finally {
      setLoading(false);
    }
  };

  const card  = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
  const title = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const sub   = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const tick  = isDarkMode ? '#94a3b8' : '#64748b';
  const grid  = isDarkMode ? '#334155' : '#f1f5f9';
  const ttStyle = isDarkMode
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }
    : { borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };
  const center = isDarkMode ? 'text-slate-100' : 'text-slate-800';

  if (loading) return (
    <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
      <div className={`h-48 rounded-2xl animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />
      <div className={`h-48 rounded-2xl animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />
    </div>
  );

  return (
    <div className="col-span-1 lg:col-span-4 flex flex-col gap-6 h-full">
      {/* Stock Distribution Donut */}
      <div className={`p-6 rounded-2xl shadow-sm border flex-1 flex flex-col transition-colors ${card}`}>
        <h3 className={`font-bold mb-1 ${title}`}>Stock Distribution</h3>
        <p className={`text-xs mb-4 ${sub}`}>By status category</p>
        <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
          {stockStatusData.length === 0 ? (
            <div className={`text-sm ${sub}`}>No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                    {stockStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <PieTooltip contentStyle={ttStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className={`text-2xl font-bold ${center}`}>{stockStatusData.reduce((a, c) => a + c.value, 0)}</span>
                <span className={`text-xs ${sub}`}>Total SKUs</span>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {stockStatusData.map(d => (
            <div key={d.name} className={`flex items-center text-xs ${sub}`}>
              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: d.color }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Medicines Bar Chart */}
      <div className={`p-6 rounded-2xl shadow-sm border flex-1 flex flex-col transition-colors ${card}`}>
        <h3 className={`font-bold mb-1 ${title}`}>Top 5 Medicines</h3>
        <p className={`text-xs mb-4 ${sub}`}>Ranked by derived revenue</p>
        <div className="flex-1 min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSellingData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={grid} />
              <XAxis type="number" hide />
              <BarYAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tick }} width={80} />
              <BarTooltip cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }} contentStyle={ttStyle} />
              <Bar dataKey="revenue" name="Rev (₹)" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
