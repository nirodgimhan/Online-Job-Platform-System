import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

// Configure axios instance
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    // Attach a cancel token source to every request (for later aborting)
    if (!config.signal) {
      const controller = new AbortController();
      config.signal = controller.signal;
      config._abortController = controller;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to limit network error toasts
let networkErrorToastShown = false;
let networkErrorTimeout = null;

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ========== SILENTLY IGNORE ABORTED/CANCELLED REQUESTS ==========
    // These happen when components unmount (e.g., page navigation)
    if (axios.isCancel(error) ||
        error.code === 'ERR_CANCELED' ||
        error.name === 'CanceledError' ||
        error.name === 'AbortError' ||
        (error.message && error.message.includes('canceled')) ||
        (error.message && error.message.includes('aborted')) ||
        (originalRequest && originalRequest.signal?.aborted)) {
      return Promise.reject(error);
    }

    // Real network errors (server unreachable)
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      if (!networkErrorToastShown) {
        networkErrorToastShown = true;
        toast.error('Connection lost. Please check your internet connection or try again later.');
        networkErrorTimeout = setTimeout(() => {
          networkErrorToastShown = false;
        }, 5000);
      }
      return Promise.reject(error);
    }

    // 503 – silent retry once
    if (error.response?.status === 503 && !originalRequest?._retry) {
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 2000));
      return API(originalRequest);
    }

    // 500 – server error
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }

    // 401 – session expired
    if (error.response?.status === 401) {
      const isCVUpload = originalRequest?.url?.includes('/cv/upload');
      if (!isCVUpload) {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Session expired. Please login again to upload CV.');
      }
      return Promise.reject(error);
    }

    // 404 – let components handle it (no toast)
    if (error.response?.status === 404) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Helper to create an abortable request (used by components)
export const createAbortableRequest = () => {
  const controller = new AbortController();
  return { signal: controller.signal, abort: () => controller.abort() };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('Connection restored!');
      if (token) loadUser();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Some features may not work.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  useEffect(() => {
    if (token) loadUser();
    else setLoading(false);
  }, []);

  const loadUser = async () => {
    try {
      const response = await API.get('/auth/me');
      if (response.data.success) setUser(response.data.user);
    } catch (error) {
      console.error('Error loading user:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    if (!isOnline) {
      toast.error('You are offline. Please check your connection.');
      return { success: false, error: 'Offline' };
    }
    try {
      const response = await API.post('/auth/register', userData);
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        toast.success('Registration successful!');
        return { success: true, data: response.data };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (credentials) => {
    if (!isOnline) {
      toast.error('You are offline. Please check your connection.');
      return { success: false, error: 'Offline' };
    }
    try {
      const response = await API.post('/auth/login', credentials);
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        toast.success('Login successful!');
        return { success: true, data: response.data };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.info('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = () => !!token && !!user;

  const submitContact = async (contactData) => {
    if (!isOnline) {
      toast.error('You are offline. Please check your connection.');
      return { success: false, error: 'Offline' };
    }
    try {
      const response = await API.post('/contact', contactData);
      if (response.data.success) {
        toast.success(response.data.message || 'Message sent successfully!');
        return { success: true, data: response.data };
      } else {
        toast.error(response.data.message || 'Failed to send message');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again later.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    isOnline,
    register,
    login,
    logout,
    updateUser,
    isAuthenticated: isAuthenticated(),
    token,
    API,
    submitContact,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { API };