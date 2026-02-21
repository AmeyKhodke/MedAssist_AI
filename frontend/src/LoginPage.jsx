import React, { useState } from 'react';
import { User, Shield } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500">Sign in to access your pharmacy portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                role === 'client' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                role === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Admin
            </button>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">
               {role === 'client' ? 'Patient ID' : 'Admin Username'}
             </label>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 {role === 'client' ? <User size={18} className="text-slate-400" /> : <Shield size={18} className="text-slate-400" />}
               </div>
               <input
                 type="text"
                 value={userId}
                 onChange={(e) => setUserId(e.target.value)}
                 className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                 placeholder={role === 'client' ? "e.g., PAT001" : "e.g., admin"}
               />
             </div>
             {role === 'client' && (
               <p className="mt-1 text-xs text-slate-500">Try IDs: PAT001, PAT002, PAT003...</p>
             )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
