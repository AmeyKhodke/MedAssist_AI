import React from 'react';
import {
  LineChart, Line,
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// P1 Data
const salesData = [
  { time: '08:00', sales: 120 },
  { time: '10:00', sales: 250 },
  { time: '12:00', sales: 410 },
  { time: '14:00', sales: 380 },
  { time: '16:00', sales: 520 },
  { time: '18:00', sales: 600 },
];

// P2 Data
const inventoryTurnoverData = [
  { name: 'Fast Moving', value: 65 },
  { name: 'Slow Moving', value: 25 },
  { name: 'Stagnant', value: 10 },
];
const pieColors = ['#10B981', '#F59E0B', '#F43F5E'];

// P3 Data (Gauge)
// Representing 92% accuracy
const gaugeData = [
  { name: 'Accuracy', value: 92, fill: '#6366F1' },
  { name: 'Remaining', value: 8, fill: '#E2E8F0' }
];

// P4 Data
const engagementData = [
  { day: 'Mon', active: 400 },
  { day: 'Tue', active: 450 },
  { day: 'Wed', active: 520 },
  { day: 'Thu', active: 480 },
  { day: 'Fri', active: 600 },
];

export default function ExecutiveCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      
      {/* P1: Real-time sales trend */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col h-[280px]">
        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">P1: Real-Time Sales</h3>
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
              />
              <Line type="monotone" dataKey="sales" stroke="#6366F1" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* P2: Inventory Turnover */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col h-[280px]">
        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">P2: Inventory Turnover</h3>
        <div className="flex-1 w-full relative -mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={inventoryTurnoverData}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {inventoryTurnoverData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pt-4">
            <span className="text-2xl font-bold text-slate-800">4.2x</span>
            <span className="text-[10px] text-slate-400 font-medium">Monthly Rate</span>
          </div>
        </div>
      </div>

      {/* P3: Prediction Accuracy (Gauge) */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col h-[280px]">
        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">P3: Prediction Accuracy</h3>
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius={70}
                outerRadius={90}
                dataKey="value"
                stroke="none"
              >
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pt-12">
            <span className="text-3xl font-bold text-slate-800">92%</span>
            <span className="text-[10px] text-emerald-500 font-medium">+2.1% this week</span>
          </div>
        </div>
      </div>

      {/* P4: Patient Engagement */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col h-[280px]">
        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">P4: Patient Engagement</h3>
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engagementData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#F1F5F9' }}
              />
              <Bar dataKey="active" fill="#38BDF8" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
