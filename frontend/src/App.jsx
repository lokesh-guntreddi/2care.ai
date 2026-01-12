import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthView, setIsAuthView] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return (
      <div className="app">
        {isAuthView ? (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setIsAuthView(false)}
          />
        ) : (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setIsAuthView(true)}
          />
        )}
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Dashboard user={user} onLogout={handleLogout} />
      </div>
    </BrowserRouter>
  );
}

export default App;
