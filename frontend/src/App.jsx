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

  if (user.role === 'admin') {
    return <AdminDashboard setRole={handleLogout} />;
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 flex">
      <ClientDashboard user={user} onLogout={handleLogout} />
    </div>
  );
}

export default App;
