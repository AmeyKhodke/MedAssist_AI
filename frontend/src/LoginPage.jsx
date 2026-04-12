import React, { useState } from 'react';
import api from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, ArrowRight, Activity, HeartPulse, Mail, Lock, Phone, Sparkles } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [role, setRole] = useState('client'); 
  
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
    
    try {
      if (isLoginView) {
        const res = await api.post(`/auth/login`, {
          email,
          password
        });
        if (res.data.status === 'success') {
          const { access_token, user_id, role: userRole } = res.data;
          localStorage.setItem('token', access_token);
          localStorage.setItem('user_id', user_id);
          onLogin({ id: user_id, role: userRole, token: access_token });
        }
      } else {
        const res = await api.post(`/auth/register`, {
          name,
          email,
          phone,
          password,
          auth_provider: 'local'
        });
        if (res.data.status === 'success') {
          const { access_token, user_id, role: userRole } = res.data;
          localStorage.setItem('token', access_token);
          localStorage.setItem('user_id', user_id);
          onLogin({ id: user_id, role: userRole, token: access_token });
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0f172a] overflow-hidden text-slate-200">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Left Panel - Hero */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 h-full p-16 flex-col justify-between relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <HeartPulse className="text-white" size={28} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            MedAssist <span className="text-indigo-400 font-medium">AI</span>
          </span>
        </div>

        <div className="max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md"
          >
            <Sparkles size={14} className="text-indigo-400" /> Powered by Hindsight™ Memory
          </motion.div>
          <h1 className="text-6xl font-extrabold text-white leading-[1.1] mb-8 tracking-tighter">
            Healthcare that <br />
            <span className="glow-text">remembers you.</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed font-medium mb-10">
            Our AI-powered pharmacy agent learns your preferences, recalls your history, and ensures your safety with every interaction.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 glass-card group">
              <Shield className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform" size={24} />
              <h4 className="font-bold text-white mb-2">Secure Memory</h4>
              <p className="text-sm text-slate-500 leading-snug">Encrypted longitudinal patient data storage.</p>
            </div>
            <div className="p-6 glass-card group">
              <Activity className="text-purple-400 mb-4 group-hover:scale-110 transition-transform" size={24} />
              <h4 className="font-bold text-white mb-2">Proactive Care</h4>
              <p className="text-sm text-slate-500 leading-snug">Automatic refill alerts and safety monitoring.</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-600 font-medium">
          &copy; {new Date().getFullYear()} MedAssist Technologies. Secure Health Systems.
        </div>
      </motion.div>

      {/* Right Panel - Auth Form */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 relative z-10"
      >
        <div className="w-full max-w-md glass-card p-10 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">
              {isLoginView ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-slate-500">
              {isLoginView ? 'Access your health concierge' : 'Join our smart pharmacy platform'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Toggle */}
            <div className="flex p-1 bg-black/20 rounded-2xl mb-8">
              {['client', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                    role === r ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl text-center font-medium"
                >
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {!isLoginView && role === 'client' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 overflow-hidden"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 shadow-sm" size={18} />
                    <input
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      className="premium-input pl-12" placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 shadow-sm" size={18} />
                    <input
                      type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="premium-input pl-12" placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="premium-input pl-12" placeholder="name@company.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="premium-input pl-12" placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="premium-button w-full"
            >
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? 'Processing...' : (isLoginView ? 'Sign Into Account' : 'Create My Account')}
                {!isLoading && <ArrowRight size={20} />}
              </span>
            </button>

            {role === 'client' && (
              <div className="text-center pt-4">
                <p className="text-sm text-slate-500 font-medium">
                  {isLoginView ? "New here? " : "Already registered? "}
                  <button 
                    type="button" 
                    onClick={() => setIsLoginView(!isLoginView)}
                    className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors ml-1"
                  >
                    {isLoginView ? 'Join Now' : 'Sign In'}
                  </button>
                </p>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
