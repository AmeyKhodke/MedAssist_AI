import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Info } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function InventoryTable() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col col-span-1 lg:col-span-6 h-96">
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 sticky top-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Inventory Status</h2>
          <p className="text-sm text-slate-500">Live monitoring of {inventory.length} SKUs</p>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 p-0">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-500 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4">Medicine Name</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Margin %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="font-medium text-slate-800 line-clamp-2 max-w-[200px]" title={item.name}>
                      {item.name}
                    </div>
                    {item.prescription_required && (
                      <div className="ml-2 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center shrink-0" title="Prescription Required">
                        <ShieldCheck size={12} className="mr-0.5"/> Rx
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{item.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="font-bold text-slate-700 w-8">{item.stock}</span>
                    <span className="text-xs text-slate-400 ml-1">/ {item.reorder_threshold} (min)</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold",
                    item.status === 'In Stock' ? "bg-emerald-100 text-emerald-700" :
                    item.status === 'Low Stock' ? "bg-amber-100 text-amber-700" :
                    "bg-rose-100 text-rose-700"
                  )}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-slate-700">{item.profit_margin}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-slate-400">No inventory found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
