import React, { useState } from 'react';
import axios from 'axios';
import { User, Shield, Pill, ArrowRight, Activity, HeartPulse, Mail, Lock, Phone } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [role, setRole] = useState('client'); // 'client' or 'admin'
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    
    if (role === 'admin') {
      if (email.toLowerCase() !== 'admin' || password !== 'admin') {
        setErrorMsg("Invalid Admin Credentials. Try 'admin' / 'admin'");
        setIsLoading(false);
        return;
      }
      onLogin({ id: 'admin', role: 'admin' });
      return;
    }

    try {
      if (isLoginView) {
        // Login API Call
        const res = await axios.post('http://localhost:8000/auth/login', {
          email: email,
          password: password
        });
        if (res.data.status === 'success') {
          onLogin({ id: res.data.user_id, role: 'client' });
        }
      } else {
        // Register API Call
        const res = await axios.post('http://localhost:8000/auth/register', {
          name: name,
          email: email,
          phone: phone,
          password: password,
          auth_provider: 'local'
        });
        if (res.data.status === 'success') {
          onLogin({ id: res.data.user_id, role: 'client' });
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let mockEmail = email.trim() ? email : "demo@google.com";
      let mockName = name.trim() ? name : "Google Demo User";
      
      try {
          // Attempt login via google
          const loginRes = await axios.post('http://localhost:8000/auth/login', {
            email: mockEmail,
            password: 'google_auth_mock'
          });
          onLogin({ id: loginRes.data.user_id, role: 'client' });
      } catch {
          // Unregistered, register them silently
          const regRes = await axios.post('http://localhost:8000/auth/register', {
            name: mockName,
            email: mockEmail,
            phone: '0000000000',
            password: 'google_auth_mock',
            auth_provider: 'google'
          });
          onLogin({ id: regRes.data.user_id, role: 'client' });
      }
    } catch (err) {
      setErrorMsg("Google Sign-In Failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Left Panel - Branding & Hero */}
      <div className="hidden lg:flex w-1/2 h-full bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 border-r border-blue-800/50 p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-30 mix-blend-overlay"></div>

        {/* Logo Area */}
        <div className="relative z-10 flex items-center gap-4">
          <img src="/logo.png" alt="MedAssist AI" className="w-14 h-14 rounded-2xl object-cover shadow-2xl border border-white/20" />
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
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white relative overflow-y-auto">
        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile Logo Only */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo.png" alt="MedAssist AI" className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-blue-600/20" />
          </div>

          <div className="text-center sm:text-left space-y-2 mb-8">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {isLoginView ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-500 text-lg">
              {isLoginView ? 'Enter your details to access your portal.' : 'Sign up to manage your prescriptions proactively.'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Role Selection Tabs */}
            <div className="p-1.5 bg-slate-100/80 rounded-2xl flex gap-1 border border-slate-200 shadow-inner overflow-hidden mb-6">
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

            {errorMsg && (
              <div className="p-3 mb-4 bg-red-50 text-red-600 font-medium text-sm rounded-xl border border-red-200 text-center">
                {errorMsg}
              </div>
            )}

            {/* Registration Fields */}
            {!isLoginView && role === 'client' && (
              <>
                <div className="group relative">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-blue-600">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 placeholder:font-normal outline-none"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                <div className="group relative">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-blue-600">
                    Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 placeholder:font-normal outline-none"
                      placeholder="e.g. +1 555-0198"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Base Fields Group (Email, Password) */}
            <div className="space-y-4">
               <div className="group relative">
                 <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-blue-600">
                   {role === 'client' ? 'Email Address' : 'Admin Username'}
                 </label>
                 <div className="relative flex items-center">
                   <div className="absolute left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                     {role === 'client' ? <Mail size={18} /> : <Shield size={18} />}
                   </div>
                   <input
                     type={role === 'client' ? 'email' : 'text'}
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 placeholder:font-normal outline-none"
                     placeholder={role === 'client' ? "you@example.com" : "e.g. admin"}
                   />
                 </div>
               </div>

               <div className="group relative">
                 <label className="block text-sm font-bold text-slate-700 mb-1.5 transition-colors group-focus-within:text-blue-600">
                   Password
                 </label>
                 <div className="relative flex items-center">
                   <div className="absolute left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                     <Lock size={18} />
                   </div>
                   <input
                     type="password"
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400 placeholder:font-normal outline-none"
                     placeholder="••••••••"
                   />
                 </div>
               </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 px-8 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden mt-6 disabled:opacity-70 disabled:pointer-events-none"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? 'Processing...' : (isLoginView ? 'Sign Into Portal' : 'Create Account')}
                {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />}
              </span>
            </button>
            
            {/* Google OAuth Mock - always rendered, invisible for admin to keep height stable */}
            <div className={`pt-2 transition-all duration-200 ${role !== 'client' ? 'invisible pointer-events-none' : ''}`}>
                <div className="relative flex items-center py-2">
                   <div className="flex-grow border-t border-slate-200"></div>
                   <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Or continue with</span>
                   <div className="flex-grow border-t border-slate-200"></div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 py-3 px-8 rounded-2xl font-bold hover:bg-slate-50 transition-all duration-300 active:scale-[0.98] mt-3 disabled:opacity-70"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
              </div>

            {/* Toggle View - always rendered, invisible for admin */}
            <p className={`text-center text-sm font-medium text-slate-500 pt-4 transition-all duration-200 ${role !== 'client' ? 'invisible pointer-events-none' : ''}`}>
                {isLoginView ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsLoginView(!isLoginView);
                    setErrorMsg('');
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-bold"
                >
                  {isLoginView ? 'Sign up' : 'Log in'}
                </button>
              </p>

            {/* Terms Links */}
            <p className="text-center text-xs font-medium text-slate-400 pt-2">
              By proceeding, you agree to our <a href="#" className="text-slate-500 hover:text-slate-700 hover:underline">Terms</a> and <a href="#" className="text-slate-500 hover:text-slate-700 hover:underline">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
