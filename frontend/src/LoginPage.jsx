import React, { useState } from 'react';
import { User, Shield, Pill, ArrowRight, Activity, HeartPulse } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('client'); // 'client' or 'admin'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userId.trim()) return;
    
    // Simple mock validation
    if (role === 'admin' && userId.toLowerCase() !== 'admin') {
      alert("Invalid Admin ID. Try 'admin'");
      return;
    }
    
    // Call parent handler
    onLogin({ 
      id: userId, 
      role: role 
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Panel - Branding & Hero */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 border-r border-blue-800/50 p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-30 mix-blend-overlay"></div>

        {/* Logo Area */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
            <Pill className="text-white w-8 h-8" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            MedAssist <span className="text-blue-400 font-light">AI</span>
          </span>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium mb-6 backdrop-blur-sm">
            <Activity size={16} /> Autonomous Pharmacy System v2.0
          </div>
          <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
            The intelligent way to manage your healthcare.
          </h1>
          <p className="text-xl text-blue-200/90 leading-relaxed font-light">
            Experience seamless prescription fulfillment, proactive refill alerts, and AI-powered support in one centralized platform.
          </p>
          
          {/* Feature Highlights */}
          <div className="mt-12 flex flex-col gap-4">
            <div className="flex items-center gap-4 text-blue-100">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                 <Shield size={20} className="text-blue-300" />
               </div>
               <div>
                 <h4 className="font-semibold text-white">Bank-Grade Security</h4>
                 <p className="text-sm text-blue-200/70">Your health data is encrypted and strictly protected.</p>
               </div>
            </div>
            <div className="flex items-center gap-4 text-blue-100 mt-2">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                 <HeartPulse size={20} className="text-blue-300" />
               </div>
               <div>
                 <h4 className="font-semibold text-white">24/7 AI Pharmacist</h4>
                 <p className="text-sm text-blue-200/70">Instant answers regarding medications and interactions.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-blue-300/60 font-medium">
          &copy; {new Date().getFullYear()} MedAssist Technologies Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Mobile Logo Only Logo */}
          <div className="lg:hidden flex justify-center mb-8">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
                <Pill size={32} />
             </div>
          </div>

          <div className="text-center sm:text-left space-y-2 mb-10">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-lg">Enter your details to access your portal.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Selection Tabs */}
            <div className="p-1.5 bg-slate-100/80 rounded-2xl flex gap-1 border border-slate-200 shadow-inner overflow-hidden">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative ${
                  role === 'client' 
                    ? 'bg-white text-blue-600 shadow-md shadow-slate-200 ring-1 ring-slate-900/5 z-10 scale-[1.02]' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <User size={18} className={role === 'client' ? 'text-blue-500' : 'text-slate-400'} /> Patient
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative ${
                  role === 'admin' 
                    ? 'bg-white text-blue-600 shadow-md shadow-slate-200 ring-1 ring-slate-900/5 z-10 scale-[1.02]' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <Shield size={18} className={role === 'admin' ? 'text-blue-500' : 'text-slate-400'} /> Admin
              </button>
            </div>

            {/* Input Field Group */}
            <div className="space-y-4">
               <div className="group relative">
                 <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-blue-600">
                   {role === 'client' ? 'Patient ID' : 'Admin Username'}
                 </label>
                 <div className="relative flex items-center">
                   <div className="absolute left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                     {role === 'client' ? <User size={20} /> : <Shield size={20} />}
                   </div>
                   <input
                     type="text"
                     value={userId}
                     onChange={(e) => setUserId(e.target.value)}
                     className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium placeholder:text-slate-400 placeholder:font-normal outline-none"
                     placeholder={role === 'client' ? "e.g., PAT001" : "e.g., admin"}
                   />
                 </div>
               </div>

               {/* Hint Text */}
               <div className="h-6 flex items-center">
                 {role === 'client' && (
                   <p className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-2.5 py-1 rounded-md border border-slate-200">
                     ✨ Helper: Try IDs <strong className="text-slate-700">PAT001</strong>, <strong className="text-slate-700">PAT002</strong>...
                   </p>
                 )}
               </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="group relative w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                Continue to Portal 
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>

            {/* Terms Links */}
            <p className="text-center text-sm font-medium text-slate-500 pt-6">
              By proceeding, you agree to our <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
