import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, Package, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function InventoryView({ isDarkMode = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [inventory, setInventory]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMedicine, setNewMedicine] = useState({ name: '', category: 'General', price: 0, stock: 0 });

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/inventory');
      setInventory(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All Categories', ...new Set(inventory.map(item => item.category))];

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/inventory/add', newMedicine);
      setIsAddModalOpen(false);
      setNewMedicine({ name: '', category: 'General', price: 0, stock: 0 });
      fetchInventory(); // Refresh the table
    } catch (err) {
      alert("Failed to add medicine. It may already exist or inputs are invalid.");
    }
  };

  // Theme tokens
  const title   = isDarkMode ? 'text-slate-100' : 'text-slate-800';
  const sub     = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const card    = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const toolbar = isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/50 border-slate-200';
  const thead   = isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600';
  const rowHov  = isDarkMode ? 'hover:bg-indigo-900/20' : 'hover:bg-indigo-50/30';
  const divider = isDarkMode ? 'divide-slate-700 text-slate-300' : 'divide-slate-100 text-slate-700';
  const inp     = isDarkMode
    ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500'
    : 'border-slate-300 bg-white text-slate-800 focus:ring-indigo-500 focus:border-indigo-500';
  const btn     = isDarkMode
    ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';
  const pg      = isDarkMode
    ? 'border-slate-600 bg-slate-700 text-slate-300'
    : 'border-slate-300 bg-white text-slate-600';
  const pgFoot  = isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500';

  return (
    <div className="animate-in fade-in duration-300 h-[calc(100vh-130px)] flex flex-col">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${title}`}>Master Inventory</h1>
          <p className={`mt-1 ${sub}`}>Manage and track all pharmaceutical stock.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={fetchInventory} className={`border px-4 py-2 rounded-lg font-medium flex items-center transition-colors ${btn}`}>
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin text-indigo-500' : ''}`} /> Refresh
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm transition-colors">
            <Plus size={18} className="mr-2" /> Add Medicine
          </button>
        </div>
      </div>

      <div className={`rounded-xl shadow-sm border flex flex-col flex-1 min-h-0 transition-colors ${card}`}>
        {/* Toolbar */}
        <div className={`p-4 border-b flex flex-col sm:flex-row gap-4 justify-between shrink-0 ${toolbar}`}>
          <div className="relative w-full max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub}`} size={18} />
            <input
              type="text" placeholder="Search by name, ID, or category..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none focus:ring-2 ${inp}`}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={16} className={sub} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors outline-none cursor-pointer ${inp}`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className={`font-semibold text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm ${thead}`}>
              <tr>
                <th className="px-6 py-4">SKU ID</th>
                <th className="px-6 py-4">Medicine Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Unit Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {filtered.map(item => (
                <tr key={item.name} className={`transition-colors ${rowHov}`}>
                  <td className={`px-6 py-4 font-mono text-xs ${sub}`}>MED-{item.name.substring(0,3).toUpperCase()}</td>
                  <td className={`px-6 py-4 font-medium flex items-center`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                      <Package size={14} />
                    </div>
                    {item.name}
                  </td>
                  <td className="px-6 py-4">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold">{item.stock}</span>{' '}
                    <span className={`text-xs ${sub}`}>/ {item.reorder_threshold} min</span>
                  </td>
                  <td className="px-6 py-4">₹{item.unit_price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>{item.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className={`transition-colors ${isDarkMode ? 'text-slate-500 hover:text-indigo-400' : 'text-slate-400 hover:text-indigo-600'}`}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className={`px-6 py-12 text-center ${sub}`}>No inventory items found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`px-6 py-4 border-t flex items-center justify-between text-sm shrink-0 ${pgFoot}`}>
          <div>Showing 1 to {filtered.length} of {inventory.length} entries</div>
          <div className="flex space-x-1">
            <button className={`px-3 py-1 border rounded disabled:opacity-50 ${pg}`} disabled>Prev</button>
            <button className={`px-3 py-1 border rounded font-medium ${isDarkMode ? 'border-indigo-500 bg-indigo-900/40 text-indigo-400' : 'border-slate-300 bg-indigo-50 text-indigo-600'}`}>1</button>
            <button className={`px-3 py-1 border rounded ${pg}`}>2</button>
            <button className={`px-3 py-1 border rounded ${pg}`}>Next</button>
          </div>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${card}`}>
            <h2 className={`text-xl font-bold mb-4 ${title}`}>Add New Medicine</h2>
            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${sub}`}>Medicine Name</label>
                <input required type="text" value={newMedicine.name} onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} className={`w-full px-4 py-2 rounded-lg border outline-none ${inp}`} placeholder="e.g. Paracetamol 500mg" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${sub}`}>Category</label>
                <input required type="text" value={newMedicine.category} onChange={e => setNewMedicine({...newMedicine, category: e.target.value})} className={`w-full px-4 py-2 rounded-lg border outline-none ${inp}`} placeholder="e.g. Pain Relief" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${sub}`}>Unit Price (₹)</label>
                  <input required type="number" step="0.01" min="0" value={newMedicine.price} onChange={e => setNewMedicine({...newMedicine, price: parseFloat(e.target.value)})} className={`w-full px-4 py-2 rounded-lg border outline-none ${inp}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${sub}`}>Initial Stock</label>
                  <input required type="number" min="0" value={newMedicine.stock} onChange={e => setNewMedicine({...newMedicine, stock: parseInt(e.target.value, 10)})} className={`w-full px-4 py-2 rounded-lg border outline-none ${inp}`} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className={`px-4 py-2 rounded-lg font-medium transition-colors border ${btn}`}>Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">Save Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
