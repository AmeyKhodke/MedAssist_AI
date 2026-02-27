import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function InventoryTiles() {
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

  if (loading) return <div className="h-48 bg-white animate-pulse rounded-lg w-full border border-slate-200"></div>;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden col-span-1 lg:col-span-12 flex flex-col h-auto">
      <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white z-10 sticky top-0">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">Live Inventory Status</h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">{inventory.length} SKUs Monitored</span>
      </div>
      
      <div className="overflow-x-auto flex-1 p-0">
        {inventory.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No inventory found</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-[#F8FAFC] text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Medicine Name</th>
                <th className="px-6 py-4">Stock No</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inventory.map((item, idx) => {
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
                      <div className="font-bold text-slate-800" title={item.name}>{item.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-base font-extrabold text-slate-700">{item.stock}</span>
                        <span className="text-xs text-slate-400 font-medium">/ {item.reorder_threshold} min</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded inline-flex items-center border",
                        statusColor
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", dotColor)}></span>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
