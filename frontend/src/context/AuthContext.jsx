import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pulsequeue_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('pulsequeue_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      authApi.getMe()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('pulsequeue_user', JSON.stringify(res.data.user));
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('pulsequeue_token', jwtToken);
      localStorage.setItem('pulsequeue_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Invalid credentials',
      };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleData) => {
    setLoading(true);
    try {
      const res = await authApi.googleLogin(googleData);
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem('pulsequeue_token', jwtToken);
      localStorage.setItem('pulsequeue_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Google authentication failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pulsequeue_token');
    localStorage.removeItem('pulsequeue_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
