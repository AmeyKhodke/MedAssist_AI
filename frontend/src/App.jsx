import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import AdminDashboard from './Admin';
import ClientDashboard from './ClientDashboard';
import LoginPage from './LoginPage';
import { Pill, LogOut, User } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null); // { id: 'PAT001', role: 'client' }

  const handleLogin = (credentials) => {
    console.log("Logging in:", credentials);
    setUser(credentials);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Pill size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                  MedAssist AI
                </h1>
                <p className="text-xs text-slate-500 font-medium">Autonomous Pharmacy System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-600">
                <User size={16} />
                <span className="font-medium">{user.id}</span>
                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded uppercase">{user.role}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <ClientDashboard user={user} />
        )}
      </main>
    </div>
  );
}

export default App;
