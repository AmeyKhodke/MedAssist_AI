import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, User, Bell } from 'lucide-react';
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden col-span-1 lg:col-span-4 flex flex-col h-96">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 sticky top-0">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">Prediction Data</h2>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 p-0 hide-scrollbar">
        {predictions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No predictions available</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {predictions.map((p, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50 transition-colors group flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1">
                  <User size={16} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{p.patient_id}</p>
                  <p className="text-sm text-slate-600 truncate">{p.medicine}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs font-medium text-slate-500">{p.predicted_refill_date}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                      p.risk_indicator === 'High' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {p.risk_indicator} Risk
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
        <button className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm">
          <Bell size={18} />
          <span>Notify Users</span>
        </button>
      </div>
    </div>
  );
}
