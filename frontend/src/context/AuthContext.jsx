import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rentiq_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('rentiq_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('rentiq_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session expired, logging out.');
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('rentiq_token', res.data.token);
        localStorage.setItem('rentiq_user', JSON.stringify(res.data.user));
        return res.data;
      }
      throw new Error(res.data.message || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.message || (err.message === 'Network Error'
        ? 'Cannot connect to RentIQ backend at http://localhost:5000. Please ensure the backend server is running.'
        : err.message || 'Login failed. Please check your credentials.');
      const customErr = new Error(msg);
      customErr.response = err.response;
      throw customErr;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await authAPI.register({ name, email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('rentiq_token', res.data.token);
        localStorage.setItem('rentiq_user', JSON.stringify(res.data.user));
        return res.data;
      }
      throw new Error(res.data.message || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.message || (err.message === 'Network Error'
        ? 'Cannot connect to RentIQ backend at http://localhost:5000. Please ensure the backend server is running.'
        : err.message || 'Registration failed.');
      const customErr = new Error(msg);
      customErr.response = err.response;
      throw customErr;
    }
  };

  // 1-Click quick role switcher for demonstration & testing
  const switchRole = async (targetRole) => {
    const demoCredentials = {
      ADMIN: { email: 'admin@rentiq.com', password: 'Admin@123' },
      STAFF: { email: 'staff1@rentiq.com', password: 'Staff@123' },
      BORROWER: { email: 'borrower1@rentiq.com', password: 'Borrower@123' }
    };

    const creds = demoCredentials[targetRole];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rentiq_token');
    localStorage.removeItem('rentiq_user');
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    switchRole,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
