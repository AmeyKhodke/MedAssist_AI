import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PrimarySidebar from '../layout/PrimarySidebar';
import ChatSessionsSidebar from '../layout/ChatSessionsSidebar';
import ChatInterface from '../chat/ChatInterface';
import {
  ShoppingCart, ShoppingBag, Bell, User, Package, CheckCircle, XCircle,
  Clock, Pill, AlertTriangle, Trash2, CreditCard, MapPin, Phone, Mail
} from 'lucide-react';

// Stable user — never re-created on re-renders
const USER = {
  id: 'pat-001',
  name: 'Patient PAT001',
  email: 'jejurkarom@gmail.com',
  phone: '+91 98765 43210',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patient',
  address: '12, MG Road, Pune, Maharashtra - 411001'
};

// ─── Utility ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    confirmed: 'bg-emerald-100 text-emerald-700',
    pending:   'bg-yellow-100  text-yellow-700',
    delivered: 'bg-blue-100    text-blue-700',
    rejected:  'bg-red-100     text-red-700',
    uploaded:  'bg-indigo-100  text-indigo-700',
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

// ─── My Cart Tab ────────────────────────────────────────────────────────────
function CartView({ userId, isDarkMode }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [msg, setMsg] = useState('');

  const card  = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const sub   = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/cart/${userId}`);
      setCartItems(res.data);
    } catch { setCartItems([]); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleClear = async () => {
    try {
      await axios.delete(`http://localhost:8000/cart/${userId}`);
      setCartItems([]);
      setMsg('Cart cleared.');
    } catch { setMsg('Failed to clear cart.'); }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      await axios.post(`http://localhost:8000/cart/${userId}/checkout`, { prescription_verified: false });
      setCartItems([]);
      setMsg('✅ Order placed successfully!');
    } catch (e) {
      setMsg(e.response?.data?.detail || '❌ Checkout failed. Some items may need prescription approval.');
    } finally { setCheckingOut(false); }
  };

  const total = cartItems.reduce((s, i) => s + (i.price || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="text-blue-500" size={28}/>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>My Cart</h1>
        {cartItems.length > 0 && <span className="ml-auto text-sm font-semibold text-blue-600">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>}
      </div>

      {msg && <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${msg.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{msg}</div>}

      {cartItems.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${card}`}>
          <ShoppingCart size={56} className={`mb-4 ${sub}`} strokeWidth={1}/>
          <p className={`font-semibold text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Your cart is empty</p>
          <p className={`text-sm mt-1 ${sub}`}>Chat with AI Pharmacist to add medicines</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cartItems.map((item, i) => (
            <div key={i} className={`flex items-center justify-between p-4 rounded-xl border shadow-sm ${card}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Pill size={20} className="text-blue-500"/>
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.medicine}</p>
                  <p className={`text-xs ${sub}`}>Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">₹{(item.price || 0).toFixed(2)}</span>
            </div>
          ))}

          <div className={`mt-4 p-4 rounded-xl border ${card}`}>
            <div className="flex justify-between text-sm mb-1">
              <span className={sub}>Subtotal</span>
              <span className="font-bold">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className={sub}>Delivery</span>
              <span className="font-bold text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-3">
              <span>Total</span>
              <span className="text-blue-600">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={handleClear} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <Trash2 size={16}/> Clear Cart
            </button>
            <button onClick={handleCheckout} disabled={checkingOut} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
              <CreditCard size={16}/> {checkingOut ? 'Processing…' : 'Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── My Orders Tab ───────────────────────────────────────────────────────────
function OrdersView({ userId, isDarkMode }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const card  = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const sub   = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`http://localhost:8000/orders/${userId}`);
        setOrders(res.data);
      } catch { setOrders([]); }
      finally { setLoading(false); }
    })();
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingBag className="text-indigo-500" size={28}/>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>My Orders</h1>
        <span className={`ml-auto text-sm ${sub}`}>{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </div>
      {orders.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${card}`}>
          <ShoppingBag size={56} className={`mb-4 ${sub}`} strokeWidth={1}/>
          <p className={`font-semibold text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>No orders yet</p>
          <p className={`text-sm mt-1 ${sub}`}>Your placed orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => (
            <div key={i} className={`p-4 rounded-xl border shadow-sm ${card}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Package size={20} className="text-indigo-500"/>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{o.medicine}</p>
                    <p className={`text-xs ${sub}`}>Qty: {o.quantity}</p>
                  </div>
                </div>
                <StatusBadge status={o.status || 'confirmed'}/>
              </div>
              <div className="flex items-center justify-between pt-2 border-t mt-2 border-slate-100">
                <span className={`text-xs flex items-center gap-1 ${sub}`}><Clock size={12}/> {o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'Recently'}</span>
                <span className="font-bold text-sm">₹{(o.total_price || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Alerts Tab ──────────────────────────────────────────────────────────────
function AlertsView({ userId, isDarkMode }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const card  = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const sub   = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  useEffect(() => {
    (async () => {
      try {
        const [notifRes, alertRes] = await Promise.all([
          axios.get(`http://localhost:8000/notifications/${userId}`),
          axios.get(`http://localhost:8000/agent/alerts?user_id=${userId}`)
        ]);
        const notifItems = (notifRes.data || []).map(n => ({ ...n, kind: 'notification' }));
        const alertItems = (alertRes.data || []).map(a => ({ ...a, kind: 'alert', message: `Refill reminder: ${a.medicine} — ${a.days_since_purchase || 0}d since last purchase` }));
        setNotifs([...notifItems, ...alertItems]);
      } catch { setNotifs([]); }
      finally { setLoading(false); }
    })();
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-rose-500" size={28}/>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Alerts &amp; Notifications</h1>
      </div>
      {notifs.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${card}`}>
          <Bell size={56} className={`mb-4 ${sub}`} strokeWidth={1}/>
          <p className={`font-semibold text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>All clear!</p>
          <p className={`text-sm mt-1 ${sub}`}>No notifications or alerts for you</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n, i) => (
            <div key={i} className={`flex gap-3 p-4 rounded-xl border shadow-sm ${card}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.kind === 'alert' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                {n.kind === 'alert' ? <AlertTriangle size={18} className="text-amber-500"/> : <Bell size={18} className="text-blue-500"/>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-snug">{n.message}</p>
                {n.timestamp && <p className={`text-xs mt-1 ${sub}`}>{new Date(n.timestamp).toLocaleString('en-IN')}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── My Profile Tab ──────────────────────────────────────────────────────────
function ProfileView({ user, isDarkMode }) {
  const card = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const sub  = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const fields = [
    { icon: Mail,    label: 'Email',   value: user.email },
    { icon: Phone,   label: 'Phone',   value: user.phone || '+91 00000 00000' },
    { icon: MapPin,  label: 'Address', value: user.address || 'Not set' },
  ];

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <User className="text-emerald-500" size={28}/>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>My Profile</h1>
      </div>

      {/* Avatar + Name */}
      <div className={`flex flex-col items-center py-8 rounded-2xl border mb-4 ${card}`}>
        <img src={user.avatar} alt="avatar" className="w-24 h-24 rounded-full border-4 border-blue-200 shadow-lg mb-4"/>
        <p className="text-xl font-bold">{user.name}</p>
        <p className={`text-sm ${sub}`}>{user.email}</p>
        <div className="mt-3 flex gap-2">
          <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full">Patient</span>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">Active</span>
        </div>
      </div>

      {/* Info Fields */}
      <div className={`rounded-2xl border divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-slate-100'} ${card}`}>
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
              <Icon size={18} className="text-blue-500"/>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${sub}`}>{label}</p>
              <p className="text-sm font-medium mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <p className={`text-center text-xs mt-6 ${sub}`}>Patient ID: {user.id}</p>
    </div>
  );
}

// ─── Main ClientDashboard ────────────────────────────────────────────────────
const ClientDashboard = () => {
  const [isDarkMode, setIsDarkMode]     = useState(false);
  const [activeTab, setActiveTab]       = useState('chat');
  const [sessions, setSessions]         = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/chat/sessions/${USER.id}`);
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, []);

  // Load sessions once on mount
  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // NEW CHAT — clear view immediately. Session is auto-created on first message.
  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);     // clears messages in ChatInterface
    setActiveTab('chat');         // ensure we're on chat tab
  }, []);

  // Called by ChatInterface after backend auto-creates the session
  const handleSessionCreated = useCallback(async (newSessionId) => {
    await fetchSessions();          // refresh sidebar list
    setActiveSessionId(newSessionId); // highlight the new session
  }, [fetchSessions]);

  const handleRenameSession = async (id, newTitle) => {
    try {
      await axios.put(`http://localhost:8000/api/chat/sessions/${id}`, { title: newTitle });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    } catch (err) { console.error('Rename failed', err); }
  };

  const handleDeleteSession = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/chat/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) setActiveSessionId(null);
    } catch (err) { console.error('Delete failed', err); }
  };

  const bg = isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-[#F8F9FB] text-slate-800';

  const renderMainContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <ChatInterface
            sessionId={activeSessionId}
            user={USER}
            isDarkMode={isDarkMode}
            onSessionCreated={handleSessionCreated}
          />
        );
      case 'cart':
        return <div className="flex-1 overflow-y-auto"><CartView userId={USER.id} isDarkMode={isDarkMode}/></div>;
      case 'orders':
        return <div className="flex-1 overflow-y-auto"><OrdersView userId={USER.id} isDarkMode={isDarkMode}/></div>;
      case 'alerts':
        return <div className="flex-1 overflow-y-auto"><AlertsView userId={USER.id} isDarkMode={isDarkMode}/></div>;
      case 'profile':
        return <div className="flex-1 overflow-y-auto"><ProfileView user={USER} isDarkMode={isDarkMode}/></div>;
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Coming soon…</p>
          </div>
        );
    }
  };

  return (
    <div id="dashboard-root" className={`h-screen overflow-hidden flex transition-colors duration-300 ${bg}`}>
      {/* 1. Primary Sidebar */}
      <PrimarySidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        user={USER}
      />

      {/* 2. Chat Sessions Secondary Sidebar — only on chat tab */}
      {activeTab === 'chat' && (
        <ChatSessionsSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          onNewChat={handleNewChat}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 3. Main Workspace */}
      <div className={`flex-1 h-full flex flex-col transition-colors overflow-hidden relative ${
        isDarkMode ? 'bg-slate-900' : 'bg-[#F8F9FB]'
      }`}>
        {renderMainContent()}
      </div>
    </div>
  );
};

export default ClientDashboard;
