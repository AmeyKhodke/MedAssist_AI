import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import { RefreshCw, Sparkles, LayoutDashboard, Database, ClipboardList, Users, Bell, Settings, ShieldCheck } from 'lucide-react';

import DashboardSummary from './components/dashboard/DashboardSummary';
import SalesChart from './components/dashboard/SalesChart';
import InventoryCharts from './components/dashboard/InventoryCharts';
import InventoryTable from './components/dashboard/InventoryTable';

import InventoryView from './components/dashboard/InventoryView';
import PrescriptionsView from './components/dashboard/PrescriptionsView';
import PatientsView from './components/dashboard/PatientsView';
import AlertsView from './components/dashboard/AlertsView';
import SettingsView from './components/dashboard/SettingsView';

export default function AdminDashboard({ setRole }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [filteredSalesData, setFilteredSalesData] = useState([]);
  const [activeFilter, setActiveFilter] = useState('year');

  const handleFilteredData = (data, filter) => {
    setFilteredSalesData(data);
    setActiveFilter(filter);
  };

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const viewVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const theme = {
    isDarkMode,
    bg: "bg-[#0f172a]",
    text: "text-slate-100",
    subtext: "text-slate-400",
    headingColor: "text-indigo-400",
    badgeBg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  };

  return (
    <div className={`min-h-screen font-sans flex overflow-hidden bg-[#0f172a] text-slate-100`}>
      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      <Sidebar
        setRole={setRole}
        activeView={activeView}
        setActiveView={setActiveView}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div className="flex-1 md:ml-64 flex flex-col relative h-screen overflow-hidden">
        <Topbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

        <main className="flex-1 mt-16 p-8 overflow-y-auto custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView + refreshKey}
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-[1600px] mx-auto"
            >
              {activeView === 'dashboard' ? (
                <>
                  <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="mb-3 flex items-center space-x-2">
                        <span className={`text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-lg ${theme.badgeBg}`}>
                           Global Intelligence Mesh • Active
                        </span>
                      </div>
                      <h1 className="text-5xl font-black tracking-tight text-white mb-3">Command <span className="text-indigo-500">Center</span></h1>
                      <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
                        Orchestrating pharmaceutical logistics, monitoring healthcare compliance, and managing patient care networks with real-time analytics.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="glass-card flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-slate-300">Live Sync</span>
                      </div>
                      <button
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-sm"
                      >
                        <RefreshCw size={18} className={refreshKey > 0 ? 'animate-spin' : ''} />
                        <span>Resync Data</span>
                      </button>
                    </div>
                  </div>

                  <DashboardSummary isDarkMode={isDarkMode} salesData={filteredSalesData} activeFilter={activeFilter} />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                    <div className="lg:col-span-8 glass-card border border-white/5 p-8 rounded-3xl bg-white/[0.02]">
                       <div className="flex items-center gap-3 mb-8">
                          <LayoutDashboard className="text-indigo-400" size={24} />
                          <h3 className="text-xl font-bold text-white">Market Evolution</h3>
                       </div>
                       <SalesChart isDarkMode={isDarkMode} onFilteredData={handleFilteredData} />
                    </div>
                    <div className="lg:col-span-4 glass-card border border-white/5 p-8 rounded-3xl bg-white/[0.02]">
                       <div className="flex items-center gap-3 mb-8">
                          <Database className="text-purple-400" size={24} />
                          <h3 className="text-xl font-bold text-white">Stock Allocation</h3>
                       </div>
                       <InventoryCharts isDarkMode={isDarkMode} />
                    </div>
                  </div>

                  <div className="glass-card border border-white/5 p-8 rounded-3xl bg-white/[0.02]">
                    <div className="flex items-center gap-3 mb-8">
                        <ClipboardList className="text-indigo-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Logistics Overview</h3>
                    </div>
                    <InventoryTable isDarkMode={isDarkMode} />
                  </div>
                </>
              ) : activeView === 'inventory' ? (
                <InventoryView isDarkMode={isDarkMode} />
              ) : activeView === 'prescriptions' ? (
                <PrescriptionsView isDarkMode={isDarkMode} />
              ) : activeView === 'patients' ? (
                <PatientsView isDarkMode={isDarkMode} />
              ) : activeView === 'alerts' ? (
                <AlertsView isDarkMode={isDarkMode} />
              ) : activeView === 'settings' ? (
                <SettingsView isDarkMode={isDarkMode} />
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                  <div className="p-8 bg-indigo-500/10 rounded-full mb-6 border border-indigo-500/20">
                    <Sparkles size={48} className="text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2 capitalize">{activeView} Optimization</h2>
                  <p className="text-slate-500 max-w-md mx-auto">This neural module is currently being optimized for peak performance.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
