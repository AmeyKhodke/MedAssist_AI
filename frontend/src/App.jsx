import React, { useState } from 'react';
import AdminDashboard from './Admin';
import ClientDashboard from './ClientDashboard';
import LoginPage from './LoginPage';

function App() {
  const [user, setUser] = useState(() => {
    // Check for saved user in localStorage on initial load
    const savedUser = localStorage.getItem('pharmacy_app_user');
    return savedUser ? JSON.parse(savedUser) : null;
  }); // { id: 'PAT001', role: 'client' }

  const handleLogin = (credentials) => {
    console.log("Logging in:", credentials);
    setUser(credentials);
    localStorage.setItem('pharmacy_app_user', JSON.stringify(credentials));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pharmacy_app_user');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard setRole={handleLogout} />;
  }

  return (
    <div className="h-screen w-full overflow-hidden font-sans flex">
      <ClientDashboard user={user} onLogout={handleLogout} />
    </div>
  );
}

export default App;
