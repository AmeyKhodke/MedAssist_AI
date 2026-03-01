import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

export default function InventoryTable({ isDarkMode = false }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/inventory');
      setInventory(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const card    = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
  const header  = isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-[#F8FAFC] border-slate-100';
  const thTxt   = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const rowHov  = isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50';
  const divider = isDarkMode ? 'divide-slate-700' : 'divide-slate-100';
  const nameTxt = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const qtyTxt  = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const inputCls = isDarkMode
    ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500'
    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500';

  if (loading) return <div className={`h-64 animate-pulse rounded-2xl w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />;

  const filtered = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col col-span-1 lg:col-span-12 h-96 transition-colors ${card}`}>
      <div className={`px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center sticky top-0 gap-4 ${header}`}>
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Medicine Inventory</h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Live monitoring of {inventory.length} SKUs</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            className={`border text-sm rounded-lg block w-full pl-10 p-2 outline-none transition-colors ${inputCls}`}
            placeholder="Search medications..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className={`text-xs uppercase font-semibold sticky top-0 z-10 ${thTxt} ${header}`}>
            <tr>
              <th className="px-6 py-4">Medication Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Quantity</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${divider}`}>
            {filtered.map((item, idx) => {
              const statusColor = item.status === 'In Stock'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : item.status === 'Low Stock'
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-rose-100 text-rose-700 border-rose-200';
              const dotColor = item.status === 'In Stock' ? 'bg-emerald-500' : item.status === 'Low Stock' ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <tr key={idx} className={`transition-colors ${rowHov}`}>
                  <td className={`px-6 py-4 font-bold line-clamp-1 ${nameTxt}`} title={item.name}>{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded inline-flex items-center border ${statusColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`} />{item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-base font-extrabold ${qtyTxt}`}>{item.stock}</span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="3" className={`px-6 py-8 text-center ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {inventory.length === 0 ? 'No inventory found' : 'No medications match your search'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
