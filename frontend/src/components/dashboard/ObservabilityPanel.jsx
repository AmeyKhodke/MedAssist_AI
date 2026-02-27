import React from 'react';
import { Terminal, Code2 } from 'lucide-react';

export default function ObservabilityPanel() {
  return (
    <div className="mt-8 bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800 text-slate-300">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 text-indigo-400">
          <Terminal size={20} />
          <h2 className="text-lg font-bold text-white tracking-wide">Agent Observability Preview</h2>
        </div>
        <button className="flex items-center space-x-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md transition-colors border border-slate-700">
          <Code2 size={14} />
          <span>View Full Trace Logs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <TraceCard 
          step="Order validation" 
          status="passed"
          detail="Safety enforcement mechanism triggered 2s ago"
        />
        <TraceCard 
          step="Stock check result" 
          status="passed"
          detail="104 SKUs verified available in local cache"
        />
        <TraceCard 
          step="AI refill reasoning" 
          status="running"
          detail="Running predictive model on patient cohort A"
        />
         <TraceCard 
          step="Webhook dispatcher" 
          status="idle"
          detail="Listening for order confirmations..."
        />
      </div>
    </div>
  );
}

function TraceCard({ step, status, detail }) {
  const isPassed = status === 'passed';
  const isRunning = status === 'running';

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 font-mono text-sm relative overflow-hidden group">
      <div className="flex items-center space-x-2 mb-2">
        {isPassed && <span className="w-2 h-2 rounded bg-emerald-500"></span>}
        {isRunning && <span className="w-2 h-2 rounded bg-amber-500 animate-pulse"></span>}
        {!isPassed && !isRunning && <span className="w-2 h-2 rounded bg-slate-500"></span>}
        <strong className="text-slate-200">{step}</strong>
      </div>
      <p className="text-slate-400 text-xs leading-relaxed">{detail}</p>
    </div>
  );
}
