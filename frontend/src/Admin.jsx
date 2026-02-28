import React from 'react';

import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import { RefreshCw } from 'lucide-react';

import DashboardSummary from './components/dashboard/DashboardSummary';
import SalesChart from './components/dashboard/SalesChart';
import InventoryCharts from './components/dashboard/InventoryCharts';
import InventoryTable from './components/dashboard/InventoryTable';
import RefillPanel from './components/dashboard/RefillPanel';
import ObservabilityPanel from './components/dashboard/ObservabilityPanel';

import InventoryView from './components/dashboard/InventoryView';
import PrescriptionsView from './components/dashboard/PrescriptionsView';
import PatientsView from './components/dashboard/PatientsView';
import AlertsView from './components/dashboard/AlertsView';
import SettingsView from './components/dashboard/SettingsView';

export default function AdminDashboard({ setRole }) {
  const [activeView, setActiveView] = React.useState('dashboard');
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar setRole={setRole} activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col relative h-screen overflow-y-auto">
        {/* Fixed Topbar */}
        <Topbar />

        {/* Scrollable Main Content */}
        <main className="flex-1 mt-16 p-4 md:p-8 w-full">
          <div className="w-full">
            {activeView === 'dashboard' ? (
              <>
                {/* Header Title */}
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <div className="mb-2 flex items-center space-x-2">
                      <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase bg-indigo-100 px-2 py-1 rounded">Live System Monitor</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight mb-2">Command Center</h1>
                    <p className="text-slate-500 font-medium max-w-2xl">
                      Real-time analytics, inventory management, and proactive intelligence network overview.
                    </p>
                  </div>
                  <button
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm active:scale-95"
                  >
                    <RefreshCw size={16} className={`${refreshKey > 0 ? 'animate-spin-once' : ''} text-indigo-600`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div key={refreshKey}>
                  {/* Top Row: Stat Cards */}
                  <DashboardSummary />

                  {/* Middle Analytics Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                    <SalesChart />
                    <InventoryCharts />
                  </div>

                  {/* Data & Prediction Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
                    <InventoryTable />
                    <RefillPanel />
                  </div>

                  {/* Footer: Observability Trace Log */}
                  <ObservabilityPanel />
                </div>
              </>
            ) : activeView === 'inventory' ? (
              <InventoryView />
            ) : activeView === 'prescriptions' ? (
              <PrescriptionsView />
            ) : activeView === 'patients' ? (
              <PatientsView />
            ) : activeView === 'alerts' ? (
              <AlertsView />
            ) : activeView === 'settings' ? (
              <SettingsView />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl text-indigo-300 capitalize">{activeView.charAt(0)}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 capitalize mb-2">{activeView} module</h2>
                <p className="text-slate-500 max-w-md">This section is currently under construction. Full feature set mapping is planned for Phase 2 rollout.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}