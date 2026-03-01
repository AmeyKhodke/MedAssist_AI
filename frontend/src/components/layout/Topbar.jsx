import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, FileText, User, Sun, Moon } from 'lucide-react';
import axios from 'axios';

export default function Topbar({ isDarkMode = false, toggleDarkMode }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/approvals');
      const approvals = res.data
        .filter(app => app.status === 'pending' || app.status === 'uploaded')
        .map(app => ({
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
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
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

  const topbarBg = isDarkMode
    ? 'bg-[#0D1017]/95 border-slate-700/60 text-slate-200'
    : 'bg-white border-slate-200 text-slate-800';

  const dropdownBg = isDarkMode
    ? 'bg-slate-800/95 border-slate-700'
    : 'bg-white/80 border-slate-200/60';

  const dropdownHeader = isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50/50';
  const dropdownText = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const dropdownSubtext = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const dropdownItemHover = isDarkMode ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50/50';
  const dividerColor = isDarkMode ? 'divide-slate-700/50' : 'divide-slate-100/80';

  return (
    <header className={`fixed top-0 left-0 md:left-64 right-0 h-16 shadow-sm border-b flex items-center justify-between px-4 md:px-8 z-40 transition-colors duration-300 ${topbarBg}`}>
      <div className="flex-1 flex items-center">
        {/* Placeholder for breadcrumb or title */}
      </div>

      <div className="flex items-center space-x-2 relative">
        {/* Theme Toggle Button */}
        {toggleDarkMode && (
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode
                ? 'text-yellow-400 hover:bg-yellow-400/10'
                : 'text-indigo-500 hover:bg-indigo-50'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`p-2 rounded-full transition-colors relative ${
            isDarkMode ? 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white"></span>
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className={`absolute top-12 right-0 w-96 max-w-sm rounded-xl shadow-2xl border overflow-hidden z-50 backdrop-blur-xl transition-all duration-200 origin-top-right ${dropdownBg}`}>
            <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200/50'} ${dropdownHeader}`}>
              <h3 className={`text-sm font-bold ${dropdownText}`}>Pending Med-Requests</h3>
              <p className={`text-xs ${dropdownSubtext}`}>From User Chat Interface</p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center px-4">
                  <div className="inline-flex h-12 w-12 rounded-full bg-emerald-50 items-center justify-center mb-3">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className={`text-sm font-medium ${dropdownText}`}>All caught up!</p>
                  <p className={`text-xs mt-1 ${dropdownSubtext}`}>No pending medical requests.</p>
                </div>
              ) : (
                <div className={`divide-y ${dividerColor}`}>
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 transition-colors ${dropdownItemHover}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
                            <User size={14} className="text-indigo-500" />
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${dropdownText}`}>{notif.user}</p>
                            <p className={`text-xs font-medium mt-0.5 ${dropdownSubtext}`}>{notif.medicine}</p>
                            {notif.hasScript && (
                              <button className="flex items-center text-xs text-indigo-500 font-semibold mt-1.5 hover:text-indigo-400 transition-colors group">
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
                          className={`flex-1 text-rose-500 border text-xs font-bold py-1.5 px-3 rounded-md transition-colors flex items-center justify-center ${
                            isDarkMode ? 'border-slate-600 hover:bg-rose-500/10' : 'border-slate-200 hover:bg-rose-50 hover:border-rose-200'
                          }`}
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
