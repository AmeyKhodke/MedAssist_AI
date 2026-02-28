import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from './components/ChatInterface';
import { 
  MessageSquare, ShoppingBag, Bell, AlertCircle, Calendar, Package, 
  ArrowRight, ShieldCheck, ShoppingCart, CheckCircle,
  LogOut, User, Menu, X, Plus, Clock, FileText, MoreHorizontal, Trash2, Share2, Edit2, Moon, Sun, Camera
} from 'lucide-react';
import axios from 'axios';

const ClientDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('chat'); // chat, orders, alerts, cart
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // New Features
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'alerts') fetchNotifications();
    if (activeTab === 'cart') fetchCart();
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/orders/${user.id}`);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Fetch explicit notifications + Proactive alerts for this user
      const [notifRes, alertRes] = await Promise.all([
        axios.get(`http://localhost:8000/notifications/${user.id}`),
        axios.get(`http://localhost:8000/agent/alerts?user_id=${user.id}`)
      ]);
      setNotifications(notifRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/cart/${user.id}`);
      setCartItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkoutCart = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:8000/cart/${user.id}/checkout`);
      setActiveTab('orders'); // switch to orders on success
    } catch (err) {
      console.error(err);
      alert("Checkout failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`http://localhost:8000/cart/${user.id}`);
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessions = () => {
    if (user && user.id !== "GUEST_WEB") {
      axios.get(`http://localhost:8000/api/chat/sessions/${user.id}`)
        .then(res => setChatSessions(res.data))
        .catch(console.error);
    }
  };

  const fetchUserProfile = async () => {
    if (user && user.id) {
       try {
         const res = await axios.get(`http://localhost:8000/api/users/${user.id}`);
         setUserProfile(res.data);
       } catch (err) {
         console.error("Failed to fetch profile", err);
       }
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchUserProfile();
  }, [user]);

  const handleDeleteSession = async (e, sessionId) => {
     e.stopPropagation();
     if(window.confirm('Are you sure you want to delete this chat session?')) {
         try {
             await axios.delete(`http://localhost:8000/api/chat/sessions/${sessionId}`);
             if (activeSessionId === sessionId) setActiveSessionId(null);
             fetchSessions();
             setActiveDropdown(null);
         } catch(err) { console.error(err); }
     }
  };

  const handleRenameSubmit = async (sessionId) => {
      if (!newTitle.trim()) { setEditingSessionId(null); return; }
      try {
          await axios.put(`http://localhost:8000/api/chat/sessions/${sessionId}`, { title: newTitle });
          setEditingSessionId(null);
          fetchSessions();
      } catch (err) { console.error(err); }
  };

  const handleShareSession = (e, sessionId) => {
     e.stopPropagation();
     navigator.clipboard.writeText(`Check out my MedAssist Chat: http://localhost:5173/chat/${sessionId}`);
     alert("Chat link copied to clipboard!");
     setActiveDropdown(null);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post(`http://localhost:8000/api/users/${user.id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchUserProfile();
    } catch (err) {
      console.error("Avatar upload failed", err);
      alert("Failed to upload avatar");
    }
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-300 overflow-hidden font-sans ${isDarkMode ? 'dark text-slate-100 bg-slate-900' : 'text-slate-800 bg-[#F8F9FB]'}`}>
      
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1A1C2E] dark:bg-slate-950 border-b border-white/5 text-white flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 font-bold">
          <ShieldCheck size={20} className="text-blue-400" />
          MedAssist AI
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- COLUMN 1: Primary Navy Sidebar --- */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 md:w-20 lg:w-64 bg-[#1A1C2E] dark:bg-slate-950 border-r border-white/5 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} md:relative`}>
        
        {/* Logo / Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-white/10 hidden md:flex">
          <div className="w-8 h-8 rounded-lg bg-[#0061FF] flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-wide text-lg hidden lg:block">MedAssist</span>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          
          <button
            onClick={() => { setActiveTab('chat'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${activeTab === 'chat' ? 'bg-[#0061FF] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <MessageSquare size={20} className="flex-shrink-0" />
            <span className="font-medium lg:block md:hidden">AI Chat</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-[#0061FF] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <ShoppingBag size={20} className="flex-shrink-0" />
            <span className="font-medium lg:block md:hidden">My Orders</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('cart'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors relative ${activeTab === 'cart' ? 'bg-[#0061FF] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <ShoppingCart size={20} className="flex-shrink-0" />
            <span className="font-medium flex-1 text-left lg:block md:hidden">My Cart</span>
            {cartItems.length > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center lg:block md:hidden border-2 border-[#1A1C2E] absolute right-3 lg:static">
                {cartItems.length}
              </span>
            )}
            {/* Dot for compacted sidebar */}
            {cartItems.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full lg:hidden hidden md:block border border-[#1A1C2E]"></span>}
          </button>
          
          <button
            onClick={() => { setActiveTab('alerts'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors relative ${activeTab === 'alerts' ? 'bg-[#0061FF] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Bell size={20} className="flex-shrink-0" />
            <span className="font-medium flex-1 text-left lg:block md:hidden">Alerts</span>
            {(alerts.length > 0 || notifications.length > 0) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 animate-pulse rounded-full lg:hidden hidden md:block border border-[#1A1C2E]"></span>
            )}
            {(alerts.length > 0 || notifications.length > 0) && (
               <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse lg:block md:hidden absolute right-3 lg:static"></div>
            )}
          </button>
          
          <button
            onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-[#0061FF] text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <User size={20} className="flex-shrink-0" />
            <span className="font-medium lg:block md:hidden">My Profile</span>
          </button>
        </div>

        {/* User Profile, Theme Toggle & Sign Out */}
        <div className="p-4 border-t border-white/10 space-y-2">
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-amber-400 hover:bg-white/5 transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={20} className="flex-shrink-0" /> : <Moon size={20} className="flex-shrink-0 text-slate-400" />}
            <span className={`font-medium text-sm lg:block md:hidden ${isDarkMode ? 'text-amber-400' : 'text-slate-400'}`}>
               {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          
          <div className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-slate-300">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-600 overflow-hidden">
               {userProfile?.avatar ? <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User size={16} />}
             </div>
             <div className="lg:block md:hidden overflow-hidden">
               <p className="text-sm font-bold truncate text-white">{userProfile?.name || user.id}</p>
               <p className="text-[10px] text-slate-400 tracking-widest leading-none mt-0.5 truncate">{userProfile?.email || user.role}</p>
             </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            title="Sign Out"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className="font-medium text-sm lg:block md:hidden">Sign Out</span>
          </button>
        </div>
      </div>

      {/* --- COLUMN 2: Secondary History Sidebar (Only visible when tab = chat) --- */}
      {activeTab === 'chat' && (
        <div className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex-shrink-0 overflow-hidden ${isHistoryOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 border-r-0'}`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between w-72">
            <button 
              onClick={() => setActiveSessionId(null)}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-sm transition-all active:scale-[0.98]">
              <Plus size={16} /> New Chat
            </button>
            <button onClick={() => setIsHistoryOpen(false)} className="ml-2 p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg">
              <Menu size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar w-72">
            {/* Group: All Sessions */}
            <div>
              <p className="px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Recent Sessions</p>
              <div className="space-y-1" ref={dropdownRef}>
                {chatSessions.length === 0 && (
                  <p className="px-3 text-sm text-slate-400 dark:text-slate-600 italic">No past sessions yet.</p>
                )}
                {chatSessions.map((chat) => (
                  <div key={chat.id} className="relative group">
                    {editingSessionId === chat.id ? (
                        <div className={`w-full text-left px-3 py-2.5 rounded-lg border border-blue-400 bg-white dark:bg-slate-800 flex items-center gap-2.5`}>
                           <MessageSquare size={16} className="text-[#0061FF]" />
                           <input 
                              type="text" 
                              autoFocus
                              value={newTitle} 
                              onChange={(e) => setNewTitle(e.target.value)}
                              onBlur={() => handleRenameSubmit(chat.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(chat.id); if (e.key === 'Escape') setEditingSessionId(null); }}
                              className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100"
                           />
                        </div>
                    ) : (
                        <button 
                          onClick={() => setActiveSessionId(chat.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2.5 transition-colors pr-8 ${activeSessionId === chat.id ? 'bg-[#F8F9FB] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0061FF] dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'}`}>
                          <MessageSquare size={16} className={activeSessionId === chat.id ? 'text-[#0061FF] dark:text-blue-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-blue-400'} />
                          <span className="truncate flex-1">{chat.title}</span>
                        </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === chat.id ? null : chat.id) }}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ${activeDropdown === chat.id ? 'opacity-100 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : ''}`}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    
                    {activeDropdown === chat.id && (
                       <div className="absolute right-0 top-10 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                          <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(chat.id); setNewTitle(chat.title); setActiveDropdown(null); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md flex items-center gap-2"><Edit2 size={14}/> Rename</button>
                          <button onClick={(e) => handleShareSession(e, chat.id)} className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md flex items-center gap-2"><Share2 size={14}/> Share</button>
                          <button onClick={(e) => handleDeleteSession(e, chat.id)} className="w-full text-left px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md flex items-center gap-2"><Trash2 size={14}/> Delete</button>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- COLUMN 3: Main Workspace (Flexible Width) --- */}
      <div className="flex-1 flex flex-col relative bg-[#F8F9FB] h-screen overflow-hidden pt-14 md:pt-0">
        
        {/* Toggle History Sidebar Button (if closed) */}
        {activeTab === 'chat' && !isHistoryOpen && (
           <button 
             onClick={() => setIsHistoryOpen(true)} 
             className="hidden lg:flex absolute top-4 left-4 z-20 p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded-lg shadow-sm"
           >
             <Menu size={20} />
           </button>
        )}

        {/* Content Render */}
        <div className={`flex-1 overflow-y-auto ${activeTab !== 'chat' ? 'p-6 md:p-10' : ''}`}>

        {/* Chat Tab - Full Width Height now! */}
        {activeTab === 'chat' && (
          <div className="h-full w-full">
            <ChatInterface 
               userId={user.id} 
               sessionId={activeSessionId} 
               onSessionCreated={(id) => { setActiveSessionId(id); fetchSessions(); }}
            />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && userProfile && (
           <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 fade-in">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden flex-shrink-0 relative group">
                    {userProfile.avatar && !userProfile.avatar.includes('http://localhost:8000/static') ? 
                        <img src={userProfile.avatar} alt="Profile Avatar" className="w-full h-full object-cover bg-slate-100" /> : 
                        (userProfile.avatar ? <img src={userProfile.avatar} alt="Profile Avatar" className="w-full h-full object-cover" /> : <User size={40} className="m-auto text-slate-400 h-full"/>)
                    }
                    <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-xs font-bold gap-1 pb-1">
                        <Camera size={20} />
                        <span className="hidden group-hover:block">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100">{userProfile.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{userProfile.email}</p>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                        <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-1"><User size={14}/> ID: {userProfile.user_id}</span>
                    </div>
                </div>
             </div>
             <div className="p-8">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Medical & Demographic Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-start gap-4 hover:shadow-sm transition-shadow">
                         <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-blue-500"><Calendar size={20}/></div>
                         <div>
                             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Age / Gender</p>
                             <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{userProfile.age || 'N/A'} yrs • {userProfile.gender || 'N/A'}</p>
                         </div>
                     </div>
                     <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-start gap-4 hover:shadow-sm transition-shadow">
                         <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-indigo-500"><Clock size={20}/></div>
                         <div>
                             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dosage Frequency</p>
                             <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{userProfile.dosage_frequency || 'Not specified'}</p>
                         </div>
                     </div>
                     <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-start gap-4 hover:shadow-sm transition-shadow">
                         <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-emerald-500"><Package size={20}/></div>
                         <div>
                             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avg Monthly Usage</p>
                             <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{userProfile.avg_monthly_usage || 0} units</p>
                         </div>
                     </div>
                     <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-start gap-4 hover:shadow-sm transition-shadow">
                         <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-rose-500"><ShoppingBag size={20}/></div>
                         <div>
                             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Primary Medication</p>
                             <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{userProfile.medicine || 'None on record'}</p>
                         </div>
                     </div>
                 </div>
             </div>
           </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100/50 dark:border-blue-500/20">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Order History</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">View and track your previous medications</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4 border-t border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium font-sm">Loading your orders...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-medium text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Medication</th>
                      <th className="px-8 py-5">Quantity</th>
                      <th className="px-8 py-5 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-16 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-500">
                            <Package size={48} strokeWidth={1} />
                            <p className="font-medium">You don't have any past orders yet.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-8 py-5 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                            {new Date(order.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-8 py-5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{order.medicine}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700">
                              x{order.quantity}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right font-bold text-slate-800 dark:text-slate-200">
                            ₹{order.total_price}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Cart Tab */}
        {activeTab === 'cart' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-500/20 shadow-inner">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your Shopping Cart</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Review your medications before confirming</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4 border-t border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-500 animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium font-sm">Loading your cart...</p>
              </div>
            ) : (
              <div className="p-6 sm:p-8 space-y-6">
                {cartItems.length === 0 ? (
                  <div className="p-16 text-center flex flex-col items-center justify-center gap-4 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-dashed">
                    <ShoppingCart size={48} strokeWidth={1} />
                    <p className="font-medium">Your cart is empty.</p>
                    <button onClick={() => setActiveTab('chat')} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Ask AI Pharmacist to add items</button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cartItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                              <Package size={18} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{item.medicine}</h4>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-slate-900 dark:text-slate-100">₹{(item.price || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-6 px-2">
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Estimated Total</span>
                        <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                          ₹{cartItems.reduce((acc, curr) => acc + (curr.price || 0), 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            checkoutCart();
                            window.open('https://www.upilinks.in/payment-link/upi1175539430', '_blank');
                          }}
                          className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                        >
                          <CheckCircle size={20} /> Secure Checkout
                        </button>
                        <button
                          onClick={clearCart}
                          className="py-4 px-8 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all active:scale-[0.98]"
                        >
                          Clear Cart
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">

            <div className="flex items-center gap-3 px-2 mb-2">
              <Bell className="text-slate-800 dark:text-slate-200" strokeWidth={2.5} />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Your Health Alerts</h3>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium font-sm">Syncing your alerts...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Proactive Refill Alerts */}
              {alerts.map((alert, i) => (
                <div key={`alert-${i}`} className="bg-white dark:bg-slate-800 border text-left border-orange-100 dark:border-orange-900/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-rose-400"></div>
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 flex items-center justify-center shadow-inner">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Action Needed: Refill Reminder</h4>
                      <p className="text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed mt-2">{alert.message}</p>
                      <div className="mt-4 pt-4 border-t border-orange-50 dark:border-orange-900/50 flex items-center justify-between">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded">
                          {alert.days_remaining} Days Supply Left
                        </span>
                        <button onClick={() => setActiveTab('chat')} className="text-sm font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1 group/btn">
                          Order Refill <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Manual Notifications */}
              {notifications.map((notif, i) => (
                <div key={`notif-${i}`} className="bg-white dark:bg-slate-800 border text-left border-blue-100 dark:border-blue-900/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-indigo-400"></div>
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shadow-inner">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Message from Pharmacy</h4>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {new Date(notif.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {!loading && alerts.length === 0 && notifications.length === 0 && (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center mb-2">
                  <ShieldCheck size={40} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">You're all caught up!</h4>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-sm">
                  No new notifications or refill reminders. Your prescriptions are currently fully stocked.
                </p>
              </div>
            )}
          </div>
        )}

        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
