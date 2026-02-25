import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, TrendingDown, AlertTriangle, Package, CheckCircle, LayoutDashboard, Search, BellRing, ChevronRight, Activity } from 'lucide-react';

const AdminDashboard = () => {
    const [inventory, setInventory] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, alertRes, appRes] = await Promise.all([
                axios.get('http://localhost:8000/inventory/status'),
                axios.get('http://localhost:8000/agent/alerts'),
                axios.get('http://localhost:8000/admin/approvals')
            ]);
            setInventory(invRes.data.medicines || []);
            setAlerts(alertRes.data || []);
            setApprovals(appRes.data || []);
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

    const handleApproval = async (id, status) => {
        try {
            await axios.post(`http://localhost:8000/admin/approvals/${id}`, { status });
            fetchData(); // Refresh the lists
        } catch (error) {
            console.error(`Failed to update approval ${id}`, error);
            alert("Error updating approval status.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10 flex flex-col gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide w-fit">
                        <Activity size={14} className="animate-pulse" /> LIVE SYSTEM MONITOR
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="text-blue-600 w-8 h-8 md:w-10 md:h-10" strokeWidth={2.5} />
                        Command Center
                    </h2>
                    <p className="text-slate-500 font-medium max-w-xl">
                        Monitor active prescriptions, proactive refill alerts, and real-time inventory levels across the pharmacy network.
                    </p>
                </div>
                
                <div className="relative z-10 flex items-center gap-3">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="text" placeholder="Quick search..." className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white w-64 transition-all" />
                    </div>
                    <button 
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-lg hover:shadow-xl font-medium text-sm"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">{loading ? 'Syncing...' : 'Sync Data'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left Column: Alerts & Approvals (2/3 width on large screens) */}
                <div className="xl:col-span-2 space-y-8">
                    
                    {/* Pending Approvals Section */}
                    {approvals.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden relative">
                            {/* Accent Top Border */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
                            
                            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50">
                                        <BellRing size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Action Required</h3>
                                        <p className="text-sm font-medium text-slate-500">
                                            {approvals.length} pending prescription{approvals.length !== 1 ? 's' : ''} awaiting review
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                                        <tr>
                                            <th className="px-8 py-4">Request Details</th>
                                            <th className="px-8 py-4">Medication</th>
                                            <th className="px-8 py-4">Document</th>
                                            <th className="px-8 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {approvals.map((app) => (
                                            <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="font-bold text-slate-900">{app.user_id}</div>
                                                    <div className="text-slate-500 font-mono text-xs mt-0.5">#{app.id.substring(0,8)}...</div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                                                        {app.medicine}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <a href={app.prescription_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium group/link">
                                                        View Script <ChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                                                    </a>
                                                </td>
                                                <td className="px-8 py-5 text-right flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleApproval(app.id, 'approved')}
                                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleApproval(app.id, 'rejected')}
                                                        className="px-4 py-2 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl font-bold text-xs transition-colors"
                                                    >
                                                        Decline
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Inventory Table inside left column */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                        <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Inventory Status</h3>
                                    <p className="text-sm font-medium text-slate-500">Live monitoring of {inventory.length} SKUs</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="px-8 py-4">Product Name</th>
                                        <th className="px-8 py-4">Category</th>
                                        <th className="px-8 py-4">Current Stock</th>
                                        <th className="px-8 py-4">Price</th>
                                        <th className="px-8 py-4 text-right">Health</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {inventory.map((med) => (
                                        <tr key={med.name} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-8 py-4">
                                                <span className="font-bold text-slate-900">{med.name}</span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200">
                                                    {med.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="font-bold text-slate-700 text-base">{med.stock}</span>
                                                    <span className="text-slate-400 text-xs uppercase font-medium">{med.unit_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 font-medium text-slate-600">₹{med.unit_price}</td>
                                            <td className="px-8 py-4 text-right">
                                                {med.stock < 20 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-xs border border-rose-100">
                                                        <TrendingDown size={14} /> Critical
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs border border-emerald-100">
                                                        <CheckCircle size={14} /> Healthy
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

                {/* Right Column: Proactive Alerts */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="flex items-center gap-3 px-2 mb-2">
                        <AlertTriangle className="text-orange-500" strokeWidth={2.5} />
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Proactive Intelligence</h3>
                    </div>

                    <div className="space-y-4">
                        {alerts.map((alert, idx) => (
                            <div key={idx} className="bg-white border text-left border-orange-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-rose-400"></div>
                                
                                <div className="flex flex-col gap-4 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider rounded-md">
                                            Refill Prediction
                                        </span>
                                        <span className="text-orange-400">
                                            <TrendingDown size={18} />
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-lg">{alert.name}</h4>
                                        <p className="text-slate-500 font-medium text-sm leading-relaxed mt-1">
                                            Patient is running low on <strong className="text-slate-700">{alert.medicine}</strong>. 
                                            System estimates <strong className="text-orange-600 bg-orange-50 px-1.5 rounded">{alert.days_remaining} day(s)</strong> of stock remaining.
                                        </p>
                                    </div>
                                    
                                    <div className="pt-2">
                                        <button 
                                            onClick={() => {
                                                const btn = document.getElementById(`notify-btn-${idx}`);
                                                const originalText = btn.innerText;
                                                btn.innerText = "Sending...";
                                                axios.post('http://localhost:8000/notifications', {
                                                    user_id: alert.user_id,
                                                    message: `Time to refill ${alert.medicine}! Only ${alert.days_remaining} days supply left.`
                                                }).then(() => {
                                                    btn.innerText = "Sent!";
                                                    btn.classList.add("bg-emerald-500", "text-white", "border-emerald-500");
                                                    btn.classList.remove("bg-white", "text-orange-600", "hover:bg-orange-50");
                                                    setTimeout(() => {
                                                        btn.innerText = originalText;
                                                        btn.classList.remove("bg-emerald-500", "text-white", "border-emerald-500");
                                                        btn.classList.add("bg-white", "text-orange-600", "hover:bg-orange-50");
                                                    }, 3000);
                                                }).catch(err => {
                                                    console.error(err);
                                                    btn.innerText = "Failed";
                                                });
                                            }}
                                            id={`notify-btn-${idx}`}
                                            className="w-full text-center font-bold text-sm bg-white border-2 border-orange-100 text-orange-600 px-4 py-2.5 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-colors shadow-sm"
                                        >
                                            Send Automated Reminder
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {alerts.length === 0 && !loading && (
                            <div className="bg-white border border-emerald-100 p-8 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent"></div>
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center relative z-10 shadow-inner">
                                    <CheckCircle size={32} className="text-emerald-600" />
                                </div>
                                <div className="relative z-10">
                                    <h4 className="font-bold text-slate-900 text-lg">Optimal Status</h4>
                                    <p className="text-slate-500 font-medium text-sm max-w-[200px] mt-1">
                                        No proactive refill risks detected across the patient network.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
