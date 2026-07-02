import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  mockGoogleLogin: (username?: string, email?: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Session verification failed. Logging out.");
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('token', access_token);
      setUser(loggedUser);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Invalid email or password';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, confirmPassword: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', { username, email, password, confirm_password: confirmPassword });
      const { access_token, user: newUser } = res.data;
      localStorage.setItem('token', access_token);
      setUser(newUser);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const mockGoogleLogin = async (username?: string, email?: string) => {
    setError(null);
    setLoading(true);
    // Simulate API delay for a premium user experience
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Simulate standard user and store mock token
    const mockUser: User = {
      id: 999,
      username: username || 'Google Candidate',
      email: email || 'candidate@gmail.com'
    };
    
    localStorage.setItem('token', 'mock_google_jwt_token_v1');
    setUser(mockUser);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, mockGoogleLogin, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
