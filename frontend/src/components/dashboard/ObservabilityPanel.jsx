import React, { useState, useEffect } from 'react';
import { Terminal, Code2 } from 'lucide-react';

export default function ObservabilityPanel() {
  const [traces, setTraces] = useState([
    { step: "Agent A checking inventory", status: "passed", detail: "104 SKUs verified available... Approved" },
    { step: "Safety enforcement model", status: "passed", detail: "Dosage compliance check completed in 1.2s" },
    { step: "Predictive AI Engine", status: "running", detail: "Calculating refill probabilities for cohort B..." },
    { step: "Order Webhook Listener", status: "idle", detail: "Awaiting next payload..." }
  ]);

  useEffect(() => {
    const handleAddTrace = (e) => {
      const newTrace = {
        step: e.detail.step,
        status: "passed",
        detail: e.detail.detail
      };
      setTraces(prev => [newTrace, ...prev]);
    };

    window.addEventListener('add-trace', handleAddTrace);
    return () => window.removeEventListener('add-trace', handleAddTrace);
  }, []);
  return (
    <div className="mt-4 mb-12 bg-slate-900 rounded-xl p-0 shadow-lg border border-slate-800 text-slate-300 overflow-hidden col-span-1 lg:col-span-12">
      <div className="bg-slate-950 px-6 py-3 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center space-x-3 text-indigo-400">
          <Terminal size={18} />
          <h2 className="text-sm font-bold text-white tracking-widest uppercase">Agentic Trace Log</h2>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYSTEM LIVE</span>
          </span>
          <button className="flex items-center space-x-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-md transition-colors border border-slate-700">
            <Code2 size={12} />
            <span>Full Logs</span>
          </button>
        </div>
<<<<<<< Updated upstream
        <a 
          href="https://cloud.langfuse.com/project/cmlwf7thh00d4ad07x314oujq/traces"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md transition-colors border border-slate-700"
        >
          <Code2 size={14} />
          <span>View Full Trace Logs</span>
        </a>
=======
>>>>>>> Stashed changes
      </div>

      <div className="flex overflow-x-auto hide-scrollbar p-3 space-x-3 bg-slate-900/50">
        {traces.map((trace, idx) => (
          <TraceCard 
            key={idx}
            step={trace.step}
            status={trace.status}
            detail={trace.detail}
          />
        ))}
      </div>
    </div>
  );
}

function TraceCard({ step, status, detail }) {
  const isPassed = status === 'passed';
  const isRunning = status === 'running';

  return (
    <div className="bg-slate-800/40 px-4 py-3 rounded-lg border border-slate-700/50 font-mono text-xs relative flex-shrink-0 w-80 flex flex-col justify-center">
      <div className="flex items-center space-x-2 mb-1.5">
        {isPassed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
        {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
        {!isPassed && !isRunning && <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>}
        <strong className="text-slate-300 truncate">{step}</strong>
      </div>
      <p className="text-slate-500 text-[11px] truncate">{detail}</p>
    </div>
  );
}
