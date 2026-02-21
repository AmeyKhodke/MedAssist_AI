import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, TrendingDown, AlertTriangle, Package, CheckCircle, LayoutDashboard } from 'lucide-react';

const AdminDashboard = () => {
    const [inventory, setInventory] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, alertRes] = await Promise.all([
                axios.get('http://localhost:8000/inventory/status'),
                axios.get('http://localhost:8000/agent/alerts')
            ]);
            setInventory(invRes.data.medicines || []);
            setAlerts(alertRes.data || []);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Live poll every 5s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <LayoutDashboard size={28} className="text-blue-600" />
                Live Pharmacy Control Center
            </h2>

            {/* Proactive Alerts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {alerts.map((alert, idx) => (
                     <div key={idx} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm flex flex-col gap-2">
                         <div className="flex items-center gap-2 font-bold text-orange-800">
                             <AlertTriangle size={20} />
                             <span>Refill Alert: {alert.name}</span>
                         </div>
                         <p className="text-sm text-orange-700">
                             Running low on <strong>{alert.medicine}</strong>. 
                             Est. stock for {alert.days_remaining} more day(s).
                         </p>
                         <button 
                            onClick={() => {
                                axios.post('http://localhost:8000/notifications', {
                                    user_id: alert.user_id,
                                    message: `Time to refill ${alert.medicine}! Only ${alert.days_remaining} days supply left.`
                                }).then(() => alert("Notification sent to " + alert.name))
                                  .catch(err => console.error(err));
                            }}
                            className="mt-2 text-xs bg-white border border-orange-200 text-orange-600 px-3 py-1 rounded hover:bg-orange-100 self-start">
                             Notify Patient
                         </button>
                     </div>
                 ))}
                 {alerts.length === 0 && !loading && (
                     <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-sm flex items-center gap-3">
                         <CheckCircle size={24} className="text-emerald-600" />
                         <div>
                             <p className="font-bold text-emerald-800">All Systems Normal</p>
                             <p className="text-sm text-emerald-600">No proactive refill risks detected.</p>
                         </div>
                     </div>
                 )}
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Package size={20} className="text-slate-400" />
                        Real-time Inventory
                    </h3>
                    <button 
                        onClick={fetchData}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Medicine</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Unit Price</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {inventory.map((med) => (
                                <tr key={med.name} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{med.name}</td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                                            {med.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-medium">
                                        {med.stock} <span className="text-slate-400 text-xs">{med.unit_type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">₹{med.unit_price}</td>
                                    <td className="px-6 py-4">
                                        {med.stock < 20 ? (
                                            <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">
                                                <TrendingDown size={14} /> LOW STOCK
                                            </span>
                                        ) : (
                                            <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded">
                                                In Stock
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
