import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, MessageSquare } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function RefillPanel() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/refill/predictions');
      setPredictions(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching refill predictions", err);
      setLoading(false);
    }
  };

  if (loading) return <div className="h-64 bg-slate-100 animate-pulse rounded-2xl w-full"></div>;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden col-span-1 lg:col-span-6 xl:col-span-3 flex flex-col h-96">
      <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10 sticky top-0">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">AI Refill Predictor</h2>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 p-0 space-y-1 bg-slate-900/50">
        {predictions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No refill predictions available</div>
        ) : (
          predictions.map((p, idx) => (
            <div key={idx} className="p-4 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0 group cursor-default">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-medium text-sm line-clamp-1" title={p.medicine}>{p.medicine}</p>
                  <p className="text-xs text-slate-400">Patient: {p.patient_id}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center mb-1",
                    p.risk_indicator === 'High' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  )}>
                    {p.risk_indicator} Risk
                  </span>
                  <span className="text-xs text-indigo-300 font-mono">{p.confidence_score}% Conf</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mt-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Predicted Due</p>
                  <p className="text-sm font-medium text-slate-300">{p.predicted_refill_date}</p>
                </div>
                <button className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white px-3 py-1.5 rounded text-xs font-semibold shadow-sm">
                  <MessageSquare size={14} />
                  <span>Start Chat</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
