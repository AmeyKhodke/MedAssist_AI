import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Eye, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function PrescriptionsView() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/prescriptions');
      setPrescriptions(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching prescriptions", err);
      setLoading(false);
    }
  };

  const pending = prescriptions.filter(p => p.status === 'pending').length;
  const approved = prescriptions.filter(p => p.status === 'approved').length;
  const rejected = prescriptions.filter(p => p.status === 'rejected').length;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Prescription Queue</h1>
          <p className="text-slate-500 mt-1">Review and manage uploaded patient prescriptions.</p>
        </div>
        <button onClick={fetchPrescriptions} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center hover:bg-slate-50 transition-colors">
          <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin text-indigo-600' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
            <Clock className="text-amber-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Review</p>
            <p className="text-2xl font-bold text-slate-800">{pending}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
            <CheckCircle2 className="text-emerald-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Approved</p>
            <p className="text-2xl font-bold text-slate-800">{approved}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mr-4">
            <XCircle className="text-rose-600" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Rejected</p>
            <p className="text-2xl font-bold text-slate-800">{rejected}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Prescription ID</th>
              <th className="px-6 py-4">Date Submited</th>
              <th className="px-6 py-4">Patient Name</th>
              <th className="px-6 py-4">Prescribing Doctor</th>
              <th className="px-6 py-4">Medicine Requested</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Document</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {prescriptions.map(req => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-indigo-600 font-medium">RX-{req.id + 8840}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(req.timestamp).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-slate-800 font-medium">Patient {req.user_id.substring(0, 8)}</td>
                <td className="px-6 py-4 text-slate-500 italic">
                  {(req.doctor_name && req.doctor_name !== "Unknown Doctor" && req.doctor_name !== "Not Specified") 
                    ? <span className="text-slate-700 not-italic font-medium">{req.doctor_name}</span> 
                    : "Not Specified"}
                </td>
                <td className="px-6 py-4">{req.medicine}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex inline-flex items-center space-x-1 ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                        'bg-rose-100 text-rose-700'
                    }`}>
                    {req.status === 'approved' && <CheckCircle2 size={12} />}
                    {req.status === 'pending' && <Clock size={12} />}
                    {req.status === 'rejected' && <XCircle size={12} />}
                    <span className="capitalize">{req.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <a href={req.prescription_url || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Eye size={16} className="mr-1.5" /> View File
                  </a>
                </td>
              </tr>
            ))}
            {prescriptions.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                  No active prescriptions in queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
