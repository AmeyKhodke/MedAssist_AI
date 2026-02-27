import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Info, Search } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function InventoryTable() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/inventory');
      setInventory(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching inventory", err);
      setLoading(false);
    }
  };

  if (loading) return <div className="h-64 bg-slate-100 animate-pulse rounded-2xl w-full"></div>;

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col col-span-1 lg:col-span-8 h-96">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white z-10 sticky top-0 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Medicine Inventory</h2>
          <p className="text-sm text-slate-500">Live monitoring of {inventory.length} SKUs</p>
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            className="bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2 transition-colors outline-none"
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 p-0 hide-scrollbar">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-[#F8FAFC] text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">Medication Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInventory.map((item, idx) => {
              let statusColor = "bg-rose-100 text-rose-700 border-rose-200"; // Out of Stock default
              let dotColor = "bg-rose-500";
              
              if (item.status === 'In Stock') {
                statusColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
                dotColor = "bg-emerald-500";
              } else if (item.status === 'Low Stock' || item.stock > 0 && item.stock <= item.reorder_threshold) {
                statusColor = "bg-amber-100 text-amber-700 border-amber-200";
                dotColor = "bg-amber-500";
              }

              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 line-clamp-1" title={item.name}>{item.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded inline-flex items-center border",
                      statusColor
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", dotColor)}></span>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-baseline justify-end space-x-1">
                      <span className="text-base font-extrabold text-slate-700">{item.stock}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredInventory.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-slate-400">
                  {inventory.length === 0 ? "No inventory found" : "No medications match your search"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
