import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import { MessageSquare, ShoppingBag, Bell, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ClientDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('chat'); // chat, orders, alerts
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'alerts') fetchNotifications();
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

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'chat' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare size={16} /> Chat
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag size={16} /> My Orders
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'alerts' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bell size={16} /> Alerts
          {(alerts.length > 0 || notifications.length > 0) && (
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'chat' && (
          <ChatInterface userId={user.id} />
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             {loading ? (
               <div className="p-8 text-center text-slate-500">Loading orders...</div>
             ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Medicine</th>
                      <th className="px-6 py-4">Qty</th>
                      <th className="px-6 py-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.length === 0 ? (
                        <tr><td colSpan="4" className="p-6 text-center text-slate-500">No orders found.</td></tr>
                    ) : (
                        orders.map((order, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(order.timestamp).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900">{order.medicine}</td>
                                <td className="px-6 py-4">{order.quantity}</td>
                                <td className="px-6 py-4 text-slate-600">₹{order.total_price}</td>
                            </tr>
                        ))
                    )}
                  </tbody>
                </table>
             )}
          </div>
        )}

        {activeTab === 'alerts' && (
           <div className="space-y-4">
               <h3 className="font-semibold text-slate-700">Notifications & Alerts</h3>
               
               {/* Proactive Refill Alerts */}
               {alerts.map((alert, i) => (
                   <div key={`alert-${i}`} className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3">
                       <AlertCircle className="text-orange-500 mt-1" size={20} />
                       <div>
                           <p className="font-bold text-orange-800">Refill Reminder</p>
                           <p className="text-sm text-orange-700">{alert.message}</p>
                           <p className="text-xs text-orange-600 mt-1">Days remaining: {alert.days_remaining}</p>
                       </div>
                   </div>
               ))}

               {/* Manual Notifications */}
               {notifications.map((notif, i) => (
                   <div key={`notif-${i}`} className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                       <Bell className="text-blue-500 mt-1" size={20} />
                       <div>
                           <p className="font-bold text-blue-800">New Message</p>
                           <p className="text-sm text-blue-700">{notif.message}</p>
                           <p className="text-xs text-blue-500 mt-1">
                               {new Date(notif.timestamp).toLocaleString()}
                           </p>
                       </div>
                   </div>
               ))}
               
               {!loading && alerts.length === 0 && notifications.length === 0 && (
                   <div className="text-center p-8 text-slate-500 bg-white rounded-xl border border-slate-200">
                       No new notifications.
                   </div>
               )}
           </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
