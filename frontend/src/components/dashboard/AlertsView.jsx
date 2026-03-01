import React from 'react';
import { BellRing, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

const MOCK_ALERTS = [
  { id: 'ALT-101', type: 'critical', title: 'System Intrusion Attempt Blocked',    time: '10 minutes ago', desc: 'AI agent successfully intercepted and blocked 4 irregular API requests originating from IP 192.168.1.105.' },
  { id: 'ALT-102', type: 'warning',  title: 'High Volume Refill Spike Detected',   time: '2 hours ago',    desc: 'Sertraline 50mg requests have increased by 45% compared to baseline. Recommend reviewing stock allocation.' },
  { id: 'ALT-103', type: 'info',     title: 'Weekly AI Model Retraining Complete', time: '5 hours ago',    desc: 'Refill prediction model successfully retrained on latest dataset. Confidence threshold accuracy improved by 1.2%.' },
  { id: 'ALT-104', type: 'warning',  title: 'Webhook Delivery Delay',              time: '1 day ago',      desc: 'Delivery confirmation webhooks to partner logistics API are experiencing 2000ms latency.' },
];

export default function AlertsView({ isDarkMode = false }) {
  const title   = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const sub     = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const card    = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const toolbar = isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200';
  const divider = isDarkMode ? 'divide-slate-700' : 'divide-slate-100';
  const rowHov  = isDarkMode ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50';
  const rowTxt  = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const invBtn  = isDarkMode ? 'text-indigo-400 bg-indigo-900/40 hover:bg-indigo-900/60' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100';
  const dimBtn  = isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100';

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold tracking-tight ${title}`}>AI Insights &amp; System Alerts</h1>
        <p className={`mt-1 ${sub}`}>Proactive intelligence and security notifications from the MedAssist agent.</p>
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden max-w-4xl transition-colors ${card}`}>
        <div className={`p-4 border-b flex justify-between items-center ${toolbar}`}>
          <span className={`font-semibold flex items-center ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            <BellRing size={18} className="mr-2 text-indigo-500" /> Recent Notifications
          </span>
          <button className="text-sm font-medium text-indigo-500 hover:text-indigo-400 transition-colors">Mark all as read</button>
        </div>

        <div className={`divide-y ${divider}`}>
          {MOCK_ALERTS.map(alert => (
            <div key={alert.id} className={`p-6 transition-colors flex items-start ${rowHov}`}>
              <div className="mr-4 mt-1 flex-shrink-0">
                {alert.type === 'critical' && <ShieldAlert className="text-rose-500"   size={24} />}
                {alert.type === 'warning'  && <ShieldAlert className="text-amber-500"  size={24} />}
                {alert.type === 'info'     && <Cpu         className="text-indigo-500" size={24} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-base font-bold ${title}`}>{alert.title}</h3>
                  <span className={`text-xs font-medium whitespace-nowrap ml-4 ${sub}`}>{alert.time}</span>
                </div>
                <p className={`text-sm leading-relaxed mb-3 ${rowTxt}`}>{alert.desc}</p>
                <div className="flex space-x-3">
                  <button className={`text-xs font-semibold px-3 py-1.5 rounded transition ${invBtn}`}>Investigate</button>
                  <button className={`text-xs font-semibold px-3 py-1.5 rounded transition flex items-center ${dimBtn}`}>
                    <CheckCircle size={14} className="mr-1" /> Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
