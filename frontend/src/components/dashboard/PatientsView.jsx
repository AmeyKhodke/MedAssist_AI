import React, { useState, useEffect } from 'react';
import { Search, Phone, Mail, FileClock, Activity } from 'lucide-react';
import axios from 'axios';

export default function PatientsView({ isDarkMode = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/users');
      // Format the DB responses (which have user_id, age, gender, email, etc)
      const formatted = res.data.map(p => ({
        id: p.user_id,
        name: p.name || 'Unknown Patient',
        age: p.age || null,
        status: p.last_purchase_date ? 'Active' : 'Inactive',
        phone: p.phone || 'Not provided',
        email: p.email || 'Not provided',
        lastVisit: p.last_purchase_date ? p.last_purchase_date.split(' ')[0] : 'Never',
        condition: p.medicine || 'None'
      }));
      setPatients(formatted);
      if (formatted.length > 0) setSelected(formatted[0]);
    } catch (err) {
      console.error("Failed to load patients", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const title   = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const sub     = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const card    = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const sidebar = isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50/50 border-slate-200';
  const listItem= isDarkMode ? 'border-slate-700' : 'border-slate-100';
  const inp     = isDarkMode
    ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:ring-indigo-500'
    : 'border-slate-300 bg-white text-slate-800 focus:ring-indigo-500';
  const detCard = isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100';
  const detTxt  = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const btn2    = isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';

  const statusBadge = (status) =>
    status === 'Active'     ? 'bg-emerald-100 text-emerald-700' :
    status === 'Monitoring' ? 'bg-amber-100 text-amber-700' :
    isDarkMode              ? 'bg-slate-600 text-slate-400' : 'bg-slate-200 text-slate-600';

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold tracking-tight ${title}`}>Patient Directory</h1>
        <p className={`mt-1 ${sub}`}>Manage patient profiles, medical history, and contact information.</p>
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden h-[600px] flex transition-colors ${card}`}>
        {/* Left List */}
        <div className={`w-1/3 border-r flex flex-col ${sidebar}`}>
          <div className={`p-4 border-b ${listItem}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub}`} size={18} />
              <input
                type="text" placeholder="Search patients..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none focus:ring-2 ${inp}`}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto w-full">
            {loading ? (
               <div className={`p-8 text-center text-sm ${sub}`}>Loading patients...</div>
            ) : filtered.length === 0 ? (
               <div className={`p-8 text-center text-sm ${sub}`}>No patients found.</div>
            ) : (
               filtered.map((patient, idx) => (
              <div
                key={patient.id}
                onClick={() => setSelected(patient)}
                className={`p-4 border-b cursor-pointer transition-colors ${listItem} ${
                  selected?.id === patient.id
                    ? isDarkMode ? 'bg-indigo-900/40 border-l-4 border-l-indigo-500' : 'bg-indigo-50 border-l-4 border-l-indigo-600'
                    : isDarkMode ? 'hover:bg-slate-700/60 border-l-4 border-l-transparent' : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold ${title}`}>{patient.name}</h3>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${statusBadge(patient.status)}`}>{patient.status}</span>
                </div>
                <div className={`text-xs flex justify-between ${sub}`}>
                  <span>{patient.id}</span><span>{patient.age} yrs</span>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Right Detail */}
        {selected && (
          <div className="w-2/3 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
              {(() => {
                const nameStr = selected.name || '?';
                const parts = nameStr.split(' ').filter(Boolean);
                if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
                return parts[0][0].toUpperCase();
              })()}
            </div>
            <h2 className={`text-2xl font-bold ${title}`}>{selected.name || 'Unknown Patient'}</h2>
            <p className={`font-medium mb-6 ${sub}`}>{selected.id} • {selected.age ? `${selected.age} years old` : 'Age unknown'}</p>

            <div className="w-full max-w-md grid grid-cols-2 gap-4 text-left">
              {[
                { icon: Phone,     label: 'Phone',      value: selected.phone },
                { icon: Mail,      label: 'Email',      value: selected.email },
                { icon: Activity,  label: 'Condition',  value: selected.condition },
                { icon: FileClock, label: 'Last Visit',  value: selected.lastVisit },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className={`p-4 rounded-xl border transition-colors ${detCard}`}>
                  <p className={`text-xs font-semibold uppercase mb-1 flex items-center gap-1 ${sub}`}><Icon size={12} />{label}</p>
                  <p className={`text-sm font-medium truncate ${detTxt}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex space-x-3">
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">View Full Record</button>
              <button className={`border px-6 py-2 rounded-lg font-medium transition ${btn2}`}>Message Patient</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
