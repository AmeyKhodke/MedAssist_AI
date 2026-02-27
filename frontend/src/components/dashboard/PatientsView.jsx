import React, { useState } from 'react';
import { Search, MapPin, Phone, Mail, FileClock, Activity } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MOCK_PATIENTS = [
  { id: 'PAT-001', name: 'James Wilson', age: 64, status: 'Active', phone: '+1 555-0102', email: 'jwilson@example.com', lastVisit: '2026-02-15', condition: 'Hypertension' },
  { id: 'PAT-002', name: 'Sarah Connor', age: 34, status: 'Active', phone: '+1 555-0199', email: 's.connor@example.com', lastVisit: '2026-02-26', condition: 'General' },
  { id: 'PAT-003', name: 'Michael Chang', age: 45, status: 'Monitoring', phone: '+1 555-0123', email: 'mchang@example.com', lastVisit: '2026-02-20', condition: 'Type 2 Diabetes' },
  { id: 'PAT-004', name: 'Elena Rostova', age: 29, status: 'Active', phone: '+1 555-0144', email: 'elena.r@example.com', lastVisit: '2026-02-27', condition: 'Allergies' },
  { id: 'PAT-005', name: 'David Palmer', age: 52, status: 'Inactive', phone: '+1 555-0177', email: 'dp_pres@example.com', lastVisit: '2025-11-10', condition: 'Post-Surgery' },
];

export default function PatientsView() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = MOCK_PATIENTS.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patient Directory</h1>
        <p className="text-slate-500 mt-1">Manage patient profiles, medical history, and contact information.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex">
        {/* Left List */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search patients..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto w-full">
            {filtered.map((patient, idx) => (
              <div 
                key={patient.id} 
                className={cn(
                  "p-4 border-b border-slate-100 cursor-pointer transition-colors",
                  idx === 0 ? "bg-indigo-50 border-l-4 border-l-indigo-600" : "hover:bg-slate-50 border-l-4 border-l-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800">{patient.name}</h3>
                  <span className={cn(
                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                    patient.status === 'Active' ? "bg-emerald-100 text-emerald-700" :
                    patient.status === 'Monitoring' ? "bg-amber-100 text-amber-700" :
                    "bg-slate-200 text-slate-600"
                  )}>
                    {patient.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>{patient.id}</span>
                  <span>{patient.age} yrs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Detail Panel (Showing first item as mock active) */}
        <div className="w-2/3 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
            JW
          </div>
          <h2 className="text-2xl font-bold text-slate-800">James Wilson</h2>
          <p className="text-slate-500 font-medium mb-6">PAT-001 • 64 years old • Male</p>
          
          <div className="w-full max-w-md grid grid-cols-2 gap-4 text-left">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center"><Phone size={12} className="mr-1"/> Phone</p>
              <p className="text-sm font-medium text-slate-700">+1 555-0102</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center"><Mail size={12} className="mr-1"/> Email</p>
              <p className="text-sm font-medium text-slate-700">jwilson@example.com</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center"><Activity size={12} className="mr-1"/> Condition</p>
              <p className="text-sm font-medium text-slate-700">Hypertension</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center"><FileClock size={12} className="mr-1"/> Last Visit</p>
              <p className="text-sm font-medium text-slate-700">2026-02-15</p>
            </div>
          </div>
          
          <div className="mt-8 flex space-x-3">
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">View Full Medical Record</button>
            <button className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-lg font-medium hover:bg-slate-50 transition">Message Patient</button>
          </div>
        </div>
      </div>
    </div>
  );
}
