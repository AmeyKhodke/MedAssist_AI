import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Eye, RefreshCw, CheckCheck, X } from 'lucide-react';
import axios from 'axios';

export default function PrescriptionsView({ isDarkMode = false }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // approval id being actioned

  useEffect(() => { fetchPrescriptions(); }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      // Correct route: GET /api/approvals
      const res = await axios.get('http://localhost:8000/api/approvals');
      setPrescriptions(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAction = async (id, status) => {
    setActionLoading(id);
    try {
      // Correct route: POST /api/approvals/{id}
      await axios.post(`http://localhost:8000/api/approvals/${id}`, { status });
      await fetchPrescriptions(); // refresh
    } catch (err) {
      console.error('Approval action failed', err);
      alert(`Action failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const pending  = prescriptions.filter(p => p.status === 'pending').length;
  const approved = prescriptions.filter(p => p.status === 'approved').length;
  const rejected = prescriptions.filter(p => p.status === 'rejected').length;

  // Theme tokens
  const title   = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const sub     = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const card    = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const thead   = isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-600';
  const rowHov  = isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50';
  const divider = isDarkMode ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700';
  const btn     = isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${title}`}>Prescription Queue</h1>
          <p className={`mt-1 ${sub}`}>Review and approve or reject patient prescription requests.</p>
        </div>
        <button onClick={fetchPrescriptions} className={`border px-4 py-2 rounded-lg font-medium flex items-center transition-colors ${btn}`}>
          <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin text-indigo-500' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Pending Review', count: pending,  Icon: Clock,        bg: isDarkMode ? 'bg-amber-900/40' : 'bg-amber-100',   ic: 'text-amber-500'  },
          { label: 'Approved',       count: approved, Icon: CheckCircle2, bg: isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-100', ic: 'text-emerald-500'},
          { label: 'Rejected',       count: rejected, Icon: XCircle,      bg: isDarkMode ? 'bg-rose-900/40' : 'bg-rose-100',     ic: 'text-rose-500'   },
        ].map(({ label, count, Icon, bg, ic }) => (
          <div key={label} className={`p-6 rounded-xl border shadow-sm flex items-center transition-colors ${card}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${bg}`}>
              <Icon className={ic} size={24} />
            </div>
            <div>
              <p className={`text-sm font-medium ${sub}`}>{label}</p>
              <p className={`text-2xl font-bold ${title}`}>{count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={`rounded-xl shadow-sm border overflow-hidden transition-colors ${card}`}>
        {loading ? (
          <div className={`p-12 text-center ${sub}`}>Loading prescriptions...</div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={`font-semibold text-xs uppercase tracking-wider ${thead}`}>
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Medicine</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Document</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {prescriptions.map(req => (
                <tr key={req.id} className={`transition-colors ${rowHov}`}>
                  <td className="px-6 py-4 font-mono text-indigo-500 font-medium">RX-{req.id + 8840}</td>
                  <td className={`px-6 py-4 ${sub}`}>{new Date(req.timestamp).toLocaleDateString()}</td>
                  <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {req.user_id?.substring(0, 10)}…
                  </td>
                  <td className={`px-6 py-4 italic ${sub}`}>
                    {(req.doctor_name && req.doctor_name !== 'Unknown Doctor' && req.doctor_name !== 'Not Specified')
                      ? <span className={`not-italic font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{req.doctor_name}</span>
                      : 'Not specified'}
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate">{req.medicine}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                      req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                      req.status === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {req.status === 'approved' && <CheckCircle2 size={12} />}
                      {req.status === 'pending'  && <Clock size={12} />}
                      {req.status === 'rejected' && <XCircle size={12} />}
                      <span className="capitalize">{req.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {req.prescription_url ? (
                      <a href={req.prescription_url} target="_blank" rel="noopener noreferrer"
                        className={`inline-flex items-center text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          isDarkMode ? 'text-indigo-400 bg-indigo-900/40 hover:bg-indigo-900/60' : 'text-indigo-600 bg-indigo-50 hover:text-indigo-800'
                        }`}>
                        <Eye size={14} className="mr-1.5" /> View
                      </a>
                    ) : <span className={`text-xs ${sub}`}>—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {req.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={actionLoading === req.id}
                          onClick={() => handleAction(req.id, 'approved')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition disabled:opacity-50"
                        >
                          <CheckCheck size={13} /> Approve
                        </button>
                        <button
                          disabled={actionLoading === req.id}
                          onClick={() => handleAction(req.id, 'rejected')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 transition disabled:opacity-50"
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs italic ${sub}`}>{req.status}</span>
                    )}
                  </td>
                </tr>
              ))}
              {prescriptions.length === 0 && !loading && (
                <tr><td colSpan="8" className={`px-6 py-12 text-center ${sub}`}>No prescriptions in queue.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
