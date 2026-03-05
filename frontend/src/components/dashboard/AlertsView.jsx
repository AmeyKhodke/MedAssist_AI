import React, { useState, useEffect } from 'react';
import { BellRing, ShieldAlert, Cpu, CheckCircle, RefreshCcw, XCircle } from 'lucide-react';
import axios from 'axios';

export default function AlertsView({ isDarkMode = false }) {
  const [restocks, setRestocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const title   = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const sub     = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const card    = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const toolbar = isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200';
  const divider = isDarkMode ? 'divide-slate-700' : 'divide-slate-100';
  const rowHov  = isDarkMode ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50';
  const rowTxt  = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const approveBtn = 'text-white bg-emerald-600 hover:bg-emerald-700';
  const rejectBtn = 'text-white bg-rose-600 hover:bg-rose-700';

  const fetchRestocks = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/restocks');
      setRestocks(res.data);
    } catch (e) { console.error('Failed to fetch restocks', e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRestocks();
    // Simple polling for new requests every 10s
    const interval = setInterval(fetchRestocks, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id, name, requestedQty) => {
    try {
      // Approve and inject enough stock to satisfy the order + 50 extra
      const addAmount = Math.max(50, requestedQty * 2); 
      await axios.post(`http://localhost:8000/api/restocks/${id}/approve`, { amount_to_add: addAmount });
      setRestocks(prev => prev.filter(r => r.id !== id));
      alert(`Successfully added ${addAmount} units of ${name} to Inventory!`);
    } catch (e) {
      alert("Failed to approve restock.");
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`http://localhost:8000/api/restocks/${id}/reject`);
      setRestocks(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert("Failed to reject restock.");
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${title}`}>Admin Action Center</h1>
          <p className={`mt-1 ${sub}`}>Manage critical system alerts and fulfill out-of-stock patient constraints.</p>
        </div>
        <button onClick={fetchRestocks} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-lg transition-colors ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden max-w-4xl transition-colors ${card}`}>
        <div className={`p-4 border-b flex justify-between items-center ${toolbar}`}>
          <span className={`font-semibold flex items-center ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            <BellRing size={18} className="mr-2 text-rose-500" /> Pending Restock Approvals
          </span>
          <span className="text-sm font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{restocks.length} Active</span>
        </div>

        <div className={`divide-y ${divider}`}>
          {restocks.length === 0 ? (
            <div className={`p-10 text-center ${rowTxt}`}>
              <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3" />
              <p className="font-semibold text-lg">All caught up!</p>
              <p className={`text-sm ${sub}`}>There are no pending restock orders required.</p>
            </div>
          ) : (
            restocks.map(req => (
              <div key={req.id} className={`p-6 transition-colors flex items-start ${rowHov}`}>
                <div className="mr-4 mt-1 flex-shrink-0">
                  <ShieldAlert className="text-rose-500" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-base font-bold ${title}`}>Out of Stock: {req.medicine}</h3>
                    <span className={`text-xs font-medium whitespace-nowrap ml-4 ${sub}`}>
                      {new Date(req.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed mb-3 ${rowTxt}`}>
                    Patient <b>{req.user_id}</b> attempted to order <b>{req.requested_qty}</b> units of {req.medicine}, but the inventory only has <b>{req.current_stock}</b> items available. Do you want to approve an automatic restock?
                  </p>
                  <div className="flex space-x-3">
                    <button onClick={() => handleApprove(req.id, req.medicine, req.requested_qty)} className={`text-xs font-semibold px-4 py-2 rounded shadow-sm transition flex items-center justify-center gap-1 ${approveBtn}`}>
                      <CheckCircle size={14} /> Approve & Restock
                    </button>
                    <button onClick={() => handleReject(req.id)} className={`text-xs font-semibold px-4 py-2 rounded shadow-sm transition flex items-center justify-center gap-1 ${rejectBtn}`}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
