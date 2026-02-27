import React from 'react';
import { BellRing, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

const MOCK_ALERTS = [
  { id: 'ALT-101', type: 'critical', title: 'System Intrusion Attempt Blocked', time: '10 minutes ago', desc: 'AI agent successfully intercepted and blocked 4 irregular API requests originating from IP 192.168.1.105.' },
  { id: 'ALT-102', type: 'warning', title: 'High Volume Refill Spike detected', time: '2 hours ago', desc: 'Sertraline 50mg requests have increased by 45% compared to baseline. Recommend reviewing stock allocation.' },
  { id: 'ALT-103', type: 'info', title: 'Weekly AI Model Retraining Complete', time: '5 hours ago', desc: 'Refill prediction model successfully retrained on latest dataset. Confidence threshold accuracy improved by 1.2%.' },
  { id: 'ALT-104', type: 'warning', title: 'Webhook Delivery Delay', time: '1 day ago', desc: 'Delivery confirmation webhooks to partner logistics API are experiencing 2000ms latency.' },
];

export default function AlertsView() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">AI Insights & System Alerts</h1>
        <p className="text-slate-500 mt-1">Proactive intelligence and security notifications from the MedAssist agent.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="font-semibold text-slate-700 flex items-center">
            <BellRing size={18} className="mr-2 text-indigo-500" /> Recent Notifications
          </span>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Mark all as read</button>
        </div>
        
        <div className="divide-y divide-slate-100">
          {MOCK_ALERTS.map(alert => (
            <div key={alert.id} className="p-6 hover:bg-slate-50 transition-colors flex items-start">
              <div className="mr-4 mt-1">
                {alert.type === 'critical' && <ShieldAlert className="text-rose-500" size={24} />}
                {alert.type === 'warning' && <ShieldAlert className="text-amber-500" size={24} />}
                {alert.type === 'info' && <Cpu className="text-indigo-500" size={24} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-base font-bold text-slate-800">{alert.title}</h3>
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-4">{alert.time}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">{alert.desc}</p>
                <div className="flex space-x-3">
                  <button className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition">Investigate</button>
                  <button className="text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded transition flex items-center">
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
