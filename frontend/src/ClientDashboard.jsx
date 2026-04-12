import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from './components/chat/ChatInterface';
import { 
  MessageSquare, ShoppingBag, Bell, AlertCircle, Calendar, Package, 
  ShieldCheck, ShoppingCart, CheckCircle, ArrowRight,
  LogOut, User, Menu, X, Plus, Clock, Moon, Sun, Sparkles, HeartPulse
} from 'lucide-react';
import api from './api';

const ClientDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('chat'); 
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [chatClearKey, setChatClearKey] = useState(0);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'alerts') fetchNotifications();
    if (activeTab === 'cart') fetchCart();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders`);
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
      const [notifRes, alertRes] = await Promise.all([
        api.get(`/notifications/${user.id}`),
        api.get(`/agent/alerts`)
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
      const res = await api.get(`/cart`);
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
      await api.post(`/cart/checkout`, {});
      setActiveTab('orders');
    } catch (err) {
      console.error(err);
      // api instance handles toast error, but we keep the alert for specific detail if needed
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete(`/cart`);
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefillClick = async (medicineName) => {
    setLoading(true);
    try {
      await api.post(`/cart/refill`, { medicine: medicineName });
      fetchCart();
      setActiveTab('cart');
    } catch (err) {
      console.error("Failed to add refill to cart", err);
      setActiveTab('chat');
    } finally {
      setLoading(false);
    }
  };

  const tabVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: -10 }
  };

  return (
    <div className="flex h-screen w-full transition-colors duration-500 overflow-hidden font-sans bg-[#0f172a] text-slate-100">
      
      {/* Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2 font-bold text-white">
          <HeartPulse size={20} className="text-indigo-400" />
          MedAssist AI
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-xl bg-white/5 border border-white/10">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-black/20 backdrop-blur-3xl border-r border-white/5 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} md:relative`}
      >
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-tight text-xl">MedAssist <span className="text-indigo-400">AI</span></span>
        </div>

        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-3">
          {[
            { id: 'chat', label: 'AI Concierge', icon: MessageSquare, badge: null },
            { id: 'orders', label: 'Order History', icon: ShoppingBag, badge: null },
            { id: 'cart', label: 'My Cart', icon: ShoppingCart, badge: cartItems.length },
            { id: 'alerts', label: 'Health Alerts', icon: Bell, badge: alerts.length + notifications.length },
            { id: 'profile', label: 'Health Profile', icon: User, badge: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} />
              <span className="font-semibold text-sm">{tab.label}</span>
              {tab.badge > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-black/10">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6 mt-auto">
          <div className="p-4 glass-card rounded-2xl mb-4 bg-indigo-500/5">
             <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Sparkles size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Hindsight Active</span>
             </div>
             <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
               I am learning your prescription patterns to better serve you.
             </p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-rose-400 transition-colors font-semibold text-sm"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </motion.div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative z-10 overflow-hidden">
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex-1 overflow-y-auto ${activeTab !== 'chat' ? 'p-8 md:p-12' : ''}`}
          >

          {activeTab === 'chat' && (
            <div className="h-full w-full">
              <ChatInterface
                 user={user}
                 isDarkMode={isDarkMode}
                 clearKey={chatClearKey}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-10">
               <div className="flex flex-col md:flex-row items-center gap-8 mb-12 text-center md:text-left">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-1">
                     <div className="w-full h-full rounded-[20px] bg-slate-900 flex items-center justify-center border border-white/10 outline-none">
                        <User size={64} className="text-indigo-400" />
                     </div>
                  </div>
                  <div>
                     <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Patient Console</h1>
                     <p className="text-slate-400 font-medium">Managing care for <span className="text-white">{user.id}</span></p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Patient Verified', value: 'Yes', icon: ShieldCheck, color: 'text-emerald-400' },
                    { label: 'Active Prescriptions', value: '3 Active', icon: Package, color: 'text-indigo-400' },
                    { label: 'Memory Points', value: '128 KB', icon: Sparkles, color: 'text-purple-400' },
                    { label: 'Last Sync', value: 'Today', icon: Clock, color: 'text-amber-400' }
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 flex items-center gap-6">
                       <div className={`p-4 rounded-2xl bg-white/5 ${stat.color} border border-white/5`}>
                          <stat.icon size={24} />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                          <p className="text-xl font-bold text-white">{stat.value}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <ShoppingBag className="text-indigo-400" />
                  </div>
                  Fulfillment History
                </h2>
              </div>

              {loading ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-500 font-medium">Retrieving secure logs...</p>
                </div>
              ) : (
                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] bg-white/[0.02]">
                        <tr>
                          <th className="px-8 py-6">Timestamp</th>
                          <th className="px-8 py-6">Item Description</th>
                          <th className="px-8 py-6">Quantity</th>
                          <th className="px-8 py-6 text-right">Settlement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-24 text-center">
                               <Package className="mx-auto text-slate-600 mb-4" size={48} strokeWidth={1.5} />
                               <p className="text-slate-500 font-medium">No order data synchronized.</p>
                            </td>
                          </tr>
                        ) : (
                          orders.map((order, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-8 py-6 text-slate-400 font-medium text-sm">
                                {new Date(order.timestamp).toLocaleString()}
                              </td>
                              <td className="px-8 py-6">
                                <span className="font-bold text-white">{order.medicine}</span>
                              </td>
                              <td className="px-8 py-6">
                                <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 font-bold text-xs text-indigo-400">
                                  {order.quantity} Units
                                </span>
                              </td>
                              <td className="px-8 py-6 text-right font-black text-white">
                                ₹{order.total_price}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cart' && (
            <div className="max-w-3xl mx-auto">
               <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                    <ShoppingCart className="text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">Checkout Console</h2>
               </div>

               {loading ? (
                 <div className="py-20 text-center"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
               ) : cartItems.length === 0 ? (
                 <div className="p-20 text-center glass-card border-dashed">
                    <Package className="mx-auto text-slate-600 mb-6" size={64} />
                    <h3 className="text-xl font-bold text-white mb-2">Cart is Clear</h3>
                    <p className="text-slate-500 mb-8">Ready to fulfill more prescriptions via MedAssist AI.</p>
                    <button onClick={() => setActiveTab('chat')} className="premium-button mx-auto">Back to Concierge</button>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="glass-card p-8 divide-y divide-white/5">
                       {cartItems.map((item, i) => (
                         <div key={i} className="py-6 flex justify-between items-center first:pt-0 last:pb-0">
                            <div>
                               <h4 className="font-bold text-white text-lg">{item.medicine}</h4>
                               <p className="text-sm text-slate-500 font-medium">Standard fulfillment • Qty: {item.quantity}</p>
                            </div>
                            <span className="text-xl font-black text-white">₹{(item.price || 0).toFixed(2)}</span>
                         </div>
                       ))}
                       <div className="pt-8 mt-4 flex justify-between items-center border-t-2 border-indigo-500/20">
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
                          <span className="text-4xl font-black text-indigo-400">₹{cartItems.reduce((acc, curr) => acc + (curr.price || 0), 0).toFixed(2)}</span>
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <button onClick={checkoutCart} className="premium-button flex-1 py-5 text-xl">
                          <CheckCircle size={24} /> Confirm Fulfillment
                       </button>
                       <button onClick={clearCart} className="px-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 font-bold transition-all">
                          Discard
                       </button>
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="max-w-4xl mx-auto space-y-8">
               <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-4">
                  <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                    <Bell className="text-rose-400" />
                  </div>
                  Safety & Sync Alerts
               </h2>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {alerts.map((alert, i) => (
                    <div key={i} className="glass-card p-8 border-l-4 border-l-indigo-500 bg-indigo-500/[0.02]">
                       <div className="flex items-start gap-5 mb-6">
                          <div className="p-3 bg-indigo-500/10 rounded-xl"><AlertCircle className="text-indigo-400" /></div>
                          <div className="flex-1">
                             <h4 className="font-bold text-white text-lg leading-tight">{alert.medicine} Refill Alert</h4>
                             <p className="text-sm text-slate-400 font-medium mt-1">Smart Monitor detected low supply.</p>
                          </div>
                          <div className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2 py-1 rounded-md">{alert.days_remaining}D LEFT</div>
                       </div>
                       <p className="text-sm text-slate-500 leading-relaxed mb-6">{alert.message}</p>
                       <button 
                         onClick={() => handleRefillClick(alert.medicine)} 
                         className="w-full py-3 bg-indigo-600/10 border border-indigo-600/30 text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all"
                       >
                         Automatic Refill
                       </button>
                    </div>
                  ))}

                  {notifications.map((notif, i) => (
                    <div key={i} className="glass-card p-8 border-l-4 border-l-slate-600">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="p-2 bg-white/5 rounded-lg"><MessageSquare size={18} className="text-slate-400" /></div>
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date(notif.timestamp).toLocaleDateString()}</p>
                       </div>
                       <p className="text-slate-300 font-medium leading-relaxed">{notif.message}</p>
                    </div>
                  ))}
               </div>

               {!loading && alerts.length === 0 && notifications.length === 0 && (
                 <div className="py-32 text-center glass-card border-dashed">
                    <ShieldCheck className="mx-auto text-slate-700 mb-6" size={64} />
                    <h3 className="text-xl font-bold text-white mb-2">Systems Clear</h3>
                    <p className="text-slate-500">All prescriptions are synchronized and medical safety is nominal.</p>
                 </div>
               )}
            </div>
          )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClientDashboard;
