import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileCheck, Check, X } from 'lucide-react';

export default function ApprovalPanel() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/approvals');
      setApprovals(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching approvals", err);
      setLoading(false);
    }
  };

  const handleAction = async (approvalId, actionStr) => {
    // Optimistic UI update
    setApprovals(prev => prev.filter(a => a.id !== approvalId));
    try {
      await axios.post(`http://localhost:8000/api/approvals/${approvalId}`, { status: actionStr });
    } catch (err) {
      console.error(`Error updating approval ${approvalId}`, err);
      // Re-fetch on error to revert
      fetchApprovals();
    }
  };

  if (loading) return <div className="h-64 bg-slate-100 animate-pulse rounded-2xl w-full"></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden col-span-1 lg:col-span-6 xl:col-span-3 flex flex-col h-96">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 sticky top-0">
        <div className="flex items-center space-x-2">
          <FileCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-800">Approval Queue</h2>
        </div>
        <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">{approvals.length} Pending</span>
      </div>
      
      <div className="overflow-y-auto flex-1 p-0">
        {approvals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-1">No pending prescriptions to approve.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {approvals.map((req, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800" title={req.medicine}>{req.medicine}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Patient: {req.user_id}</p>
                  </div>
                  {req.prescription_url && (
                    <a href={req.prescription_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                      View Script
                    </a>
                  )}
                </div>
                
                <div className="flex space-x-2 mt-2">
                  <button 
                    onClick={() => handleAction(req.id, 'approved')}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    <Check size={14} />
                    <span>Approve</span>
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, 'rejected')}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <X size={14} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
