import React from 'react';
import { useState } from 'react';

import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import { RefreshCw } from 'lucide-react';

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
  const [activeView, setActiveView]         = React.useState('dashboard');
  const [refreshKey, setRefreshKey]         = React.useState(0);
  const [isDarkMode, setIsDarkMode]         = useState(false);
  const [filteredSalesData, setFilteredSalesData] = useState([]);
  const [activeFilter, setActiveFilter]     = useState('year');

  const handleFilteredData = (data, filter) => {
    setFilteredSalesData(data);
    setActiveFilter(filter);
  };

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Theme tokens passed everywhere
  const theme = {
    isDarkMode,
    bg: isDarkMode ? 'bg-[#0F172A]' : 'bg-slate-50',
    card: isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-800',
    subtext: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-slate-700' : 'border-slate-200',
    headingColor: isDarkMode ? 'text-indigo-400' : 'text-indigo-700',
    badgeBg: isDarkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-600',
    refreshBtn: isDarkMode
      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700',
  };

  return (
    <div className={`min-h-screen font-sans flex overflow-hidden transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      {/* Fixed Sidebar */}
      <Sidebar
        setRole={setRole}
        activeView={activeView}
        setActiveView={setActiveView}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col relative h-screen overflow-y-auto">
        {/* Fixed Topbar */}
        <Topbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

        {/* Scrollable Main Content */}
        <main className="flex-1 mt-16 p-4 md:p-8 w-full">
          <div className="w-full">
            {activeView === 'dashboard' ? (
              <>
                {/* Header Title */}
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <div className="mb-2 flex items-center space-x-2">
                      <span className={`text-xs font-bold tracking-wider uppercase px-2 py-1 rounded ${theme.badgeBg}`}>
                        Live System Monitor
                      </span>
                    </div>
                    <h1 className={`text-4xl font-extrabold tracking-tight mb-2 ${theme.headingColor}`}>Command Center</h1>
                    <p className={`font-medium max-w-2xl ${theme.subtext}`}>
                      Real-time analytics, inventory management, and proactive intelligence network overview.
                    </p>
                  </div>
                  <button
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    className={`flex items-center space-x-2 border px-4 py-2 rounded-lg font-medium transition-colors shadow-sm active:scale-95 ${theme.refreshBtn}`}
                  >
                    <RefreshCw size={16} className={`${refreshKey > 0 ? 'animate-spin-once' : ''} text-indigo-500`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div key={refreshKey}>
                  <DashboardSummary isDarkMode={isDarkMode} salesData={filteredSalesData} activeFilter={activeFilter} />
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                    <SalesChart isDarkMode={isDarkMode} onFilteredData={handleFilteredData} />
                    <InventoryCharts isDarkMode={isDarkMode} />
                  </div>
                  <div className="grid grid-cols-1 pb-6">
                    <InventoryTable isDarkMode={isDarkMode} />
                  </div>
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
              <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                  <span className={`text-4xl capitalize ${isDarkMode ? 'text-indigo-400' : 'text-indigo-300'}`}>{activeView.charAt(0)}</span>
                </div>
                <h2 className={`text-2xl font-bold capitalize mb-2 ${theme.text}`}>{activeView} module</h2>
                <p className={theme.subtext}>This section is currently under construction.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
