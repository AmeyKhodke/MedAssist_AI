import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import { MessageSquare, ShoppingBag, Bell, AlertCircle, Calendar, Package, ArrowRight, ShieldCheck, ShoppingCart, CheckCircle } from 'lucide-react';
import axios from 'axios';

const ClientDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('chat'); // chat, orders, alerts, cart
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'alerts') fetchNotifications();
    if (activeTab === 'cart') fetchCart();
  }, [activeTab]);

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Patient Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 rounded-3xl text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl translate-y-1/2"></div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 text-xs font-bold tracking-wide">
            <ShieldCheck size={14} className="text-emerald-400" /> SECURE PORTAL
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Welcome back, <span className="text-blue-200">{user.id}</span>
          </h2>
          <p className="text-blue-100/80 font-medium">
            Manage your prescriptions, chat with your AI pharmacist, and track your health.
          </p>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex justify-center md:justify-start">
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 w-fit relative z-20">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative ${activeTab === 'chat'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
          >
            <MessageSquare size={18} className={activeTab === 'chat' ? 'text-blue-400' : ''} />
            <span>AI Pharmacist</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative ${activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
          >
            <ShoppingBag size={18} className={activeTab === 'orders' ? 'text-blue-400' : ''} />
            <span>My Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative ${activeTab === 'cart'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
          >
            <ShoppingCart size={18} className={activeTab === 'cart' ? 'text-blue-400' : ''} />
            <span>My Cart</span>
            {cartItems.length > 0 && activeTab !== 'cart' && (
              <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-white shadow-sm ring-2 ring-white"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative ${activeTab === 'alerts'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
          >
            <Bell size={18} className={activeTab === 'alerts' ? 'text-blue-400' : ''} />
            <span>Notifications</span>
            {(alerts.length > 0 || notifications.length > 0) && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 ring-4 ring-white rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px] pb-10">

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <ChatInterface userId={user.id} />
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Order History</h3>
                  <p className="text-sm font-medium text-slate-500">View and track your previous medications</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                <p className="text-slate-500 font-medium font-sm">Loading your orders...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-medium text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Medication</th>
                      <th className="px-8 py-5">Quantity</th>
                      <th className="px-8 py-5 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-16 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-400">
                            <Package size={48} strokeWidth={1} />
                            <p className="font-medium">You don't have any past orders yet.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-8 py-5 text-slate-500 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                            {new Date(order.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-8 py-5">
                            <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{order.medicine}</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">
                              x{order.quantity}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right font-bold text-slate-800">
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
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shadow-inner">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Your Shopping Cart</h3>
                  <p className="text-sm font-medium text-slate-500">Review your medications before confirming</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
                <p className="text-slate-500 font-medium font-sm">Loading your cart...</p>
              </div>
            ) : (
              <div className="p-6 sm:p-8 space-y-6">
                {cartItems.length === 0 ? (
                  <div className="p-16 text-center flex flex-col items-center justify-center gap-4 text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <ShoppingCart size={48} strokeWidth={1} />
                    <p className="font-medium">Your cart is empty.</p>
                    <button onClick={() => setActiveTab('chat')} className="mt-2 text-sm text-indigo-600 font-bold hover:underline">Ask AI Pharmacist to add items</button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cartItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                              <Package size={18} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-base">{item.medicine}</h4>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">Quantity: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-slate-900">₹{(item.price || 0).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-6 px-2">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Estimated Total</span>
                        <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                          ₹{cartItems.reduce((acc, curr) => acc + (curr.price || 0), 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={checkoutCart}
                          className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                        >
                          <CheckCircle size={20} /> Secure Checkout
                        </button>
                        <button
                          onClick={clearCart}
                          className="py-4 px-8 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 rounded-2xl font-bold transition-all active:scale-[0.98]"
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
              <Bell className="text-slate-800" strokeWidth={2.5} />
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Your Health Alerts</h3>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-200">
                <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                <p className="text-slate-500 font-medium font-sm">Syncing your alerts...</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Proactive Refill Alerts */}
              {alerts.map((alert, i) => (
                <div key={`alert-${i}`} className="bg-white border text-left border-orange-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-rose-400"></div>
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Action Needed: Refill Reminder</h4>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed mt-2">{alert.message}</p>
                      <div className="mt-4 pt-4 border-t border-orange-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          {alert.days_remaining} Days Supply Left
                        </span>
                        <button onClick={() => setActiveTab('chat')} className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group/btn">
                          Order Refill <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Manual Notifications */}
              {notifications.map((notif, i) => (
                <div key={`notif-${i}`} className="bg-white border text-left border-blue-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-indigo-400"></div>
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900 text-lg">Message from Pharmacy</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {new Date(notif.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {!loading && alerts.length === 0 && notifications.length === 0 && (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-20 h-20 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-2">
                  <ShieldCheck size={40} />
                </div>
                <h4 className="text-xl font-bold text-slate-900">You're all caught up!</h4>
                <p className="text-slate-500 font-medium text-sm max-w-sm">
                  No new notifications or refill reminders. Your prescriptions are currently fully stocked.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
