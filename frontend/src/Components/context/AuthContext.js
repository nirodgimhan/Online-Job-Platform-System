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
  timeout: 30000 // Increased timeout to 30 seconds
});

// Add token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors with retry logic for database connection issues
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor with retry logic for DB connection issues
API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      toast.error('Network connection error. Please check your internet connection.');
      return Promise.reject(error);
    }
    
    // Handle 503 (Database connecting)
    if (error.response?.status === 503 && error.response?.data?.retry === true) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        toast.info('Database is connecting, retrying...');
        
        // Wait 2 seconds and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return API(originalRequest);
      } else {
        toast.error('Database is still connecting. Please try again in a moment.');
        return Promise.reject(error);
      }
    }
    
    // Handle 503 with no retry flag
    if (error.response?.status === 503) {
      toast.error(error.response?.data?.message || 'Database connection unavailable. Please try again later.');
      return Promise.reject(error);
    }
    
    // Handle 500 server errors
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - Modified to not redirect immediately for CV uploads
    if (error.response?.status === 401) {
      // Check if this is a CV upload request
      const isCVUpload = originalRequest.url?.includes('/cv/upload');
      
      if (!isCVUpload) {
        // For non-CV requests, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      } else {
        // For CV upload, just show error and let user handle
        toast.error('Session expired. Please login again to upload CV.');
        // Don't redirect immediately, let the component handle it
      }
      return Promise.reject(error);
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      // Don't show toast for 404 errors - let components handle them
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('Connection restored!');
      // Reload user data when coming back online
      if (token) {
        loadUser();
      }
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
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await API.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // Don't remove token on network errors or 503
      if (error.response?.status !== 503 && error.response?.status !== 401 && error.message !== 'Network Error') {
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
      console.error('Registration error:', error);
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
      console.error('Login error:', error);
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

  // ***** NEW FUNCTION: Update user in context and localStorage *****
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Function to check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    loading,
    isOnline,
    register,
    login,
    logout,
    updateUser,          // <-- exposed for components to update user
    isAuthenticated: isAuthenticated(),
    token,
    API // Export API for use in components
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the configured API for use in other components
export { API };