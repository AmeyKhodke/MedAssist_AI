import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, FileText, User } from 'lucide-react';
import axios from 'axios';

export default function Topbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchApprovals();
    // Poll every 5 seconds for new requests
    const interval = setInterval(fetchApprovals, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/approvals');
      // Map backend approvals to frontend format
      const approvals = res.data.map(app => ({
        id: app.id,
        user: app.user_id,
        medicine: app.medicine,
        hasScript: !!app.prescription_url
      }));
      setNotifications(approvals);
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    }
  };

  const handleApprove = async (notif) => {
    try {
      await axios.post(`http://localhost:8000/api/approvals/${notif.id}`, { status: "approved" });
      
      // Remove from local state immediately for UX
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      
      // Dispatch the system event for ObservabilityPanel
      const event = new CustomEvent('add-trace', { 
        detail: { 
          step: "Manual Admin Override", 
          detail: `Prescription Validated for ${notif.user} (${notif.medicine}). Order executed via AI Executor.` 
        } 
      });
      window.dispatchEvent(event);
      
    } catch (err) {
      console.error("Error approving request:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`http://localhost:8000/api/approvals/${id}`, { status: "rejected" });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };
  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-40">
      <div className="flex-1 flex items-center">
        {/* Search removed from top bar, now isolated to specific modules */}
      </div>
      
      <div className="flex items-center space-x-4 relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors relative"
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white"></span>
            </span>
          )}
        </button>

        {/* Glassmorphism Notification Dropdown */}
        {showNotifications && (
          <div className="absolute top-12 right-0 w-96 max-w-sm rounded-xl shadow-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl overflow-hidden z-50 transform transition-all duration-200 origin-top-right">
            <div className="px-4 py-3 border-b border-slate-200/50 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Pending Med-Requests</h3>
              <p className="text-xs text-slate-500">From User Chat Interface</p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center px-4">
                  <div className="inline-flex h-12 w-12 rounded-full bg-emerald-50 items-center justify-center mb-3">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-800">All caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">No pending medical requests.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100/80">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <User size={14} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{notif.user}</p>
                            <p className="text-xs font-medium text-slate-600 mt-0.5">{notif.medicine}</p>
                            {notif.hasScript && (
                              <button className="flex items-center text-xs text-indigo-600 font-semibold mt-1.5 hover:text-indigo-800 transition-colors group">
                                <FileText size={12} className="mr-1 group-hover:scale-110 transition-transform" />
                                View Script PDF
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-3 ml-11">
                        <button 
                          onClick={() => handleApprove(notif)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors shadow-sm flex items-center justify-center"
                        >
                          <CheckCircle size={14} className="mr-1.5" /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(notif.id)}
                          className="flex-1 bg-transparent hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold py-1.5 px-3 rounded-md transition-colors flex items-center justify-center"
                        >
                          <XCircle size={14} className="mr-1.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
