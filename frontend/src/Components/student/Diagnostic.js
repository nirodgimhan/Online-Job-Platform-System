import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Diagnostic = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const checkAll = async () => {
    clearResults();
    setLoading(true);
    
    // Check 1: Token
    const token = localStorage.getItem('token');
    addResult(`Token in localStorage: ${token ? '✅ Present' : '❌ Missing'}`, token ? 'success' : 'error');
    
    if (token) {
      addResult(`Token preview: ${token.substring(0, 20)}...`);
    }

    // Check 2: User from context
    addResult(`User from context: ${user ? '✅ Present' : '❌ Missing'}`, user ? 'success' : 'error');
    if (user) {
      addResult(`User role: ${user.role}`);
      addResult(`User ID: ${user.id}`);
    }

    // Check 3: Backend health
    try {
      const healthRes = await axios.get('http://localhost:5000/api/health');
      addResult(`Backend health: ✅ OK (${healthRes.data.message})`, 'success');
    } catch (error) {
      addResult(`Backend health: ❌ Failed - ${error.message}`, 'error');
    }

    // Check 4: Auth me endpoint
    try {
      const meRes = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 'x-auth-token': token }
      });
      addResult(`Auth/me: ✅ Success`, 'success');
      addResult(`Auth/me data: ${JSON.stringify(meRes.data.user)}`);
    } catch (error) {
      addResult(`Auth/me: ❌ Failed - ${error.response?.data?.message || error.message}`, 'error');
    }

    // Check 5: Student profile
    try {
      const profileRes = await axios.get('http://localhost:5000/api/students/profile', {
        headers: { 'x-auth-token': token }
      });
      addResult(`Student profile: ✅ Found`, 'success');
      addResult(`Profile ID: ${profileRes.data.student._id}`);
    } catch (error) {
      addResult(`Student profile: ❌ Failed - ${error.response?.data?.message || error.message}`, 'error');
    }

    // Check 6: Applications
    try {
      const appsRes = await axios.get('http://localhost:5000/api/applications/student', {
        headers: { 'x-auth-token': token }
      });
      addResult(`Applications: ✅ Success`, 'success');
      addResult(`Applications count: ${appsRes.data.applications?.length || 0}`);
    } catch (error) {
      addResult(`Applications: ❌ Failed - ${error.response?.data?.message || error.message}`, 'error');
      if (error.response) {
        addResult(`Status: ${error.response.status}`, 'error');
        addResult(`Response: ${JSON.stringify(error.response.data)}`, 'error');
      }
    }

    setLoading(false);
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Diagnostic Tool</h2>
      
      <button 
        className="btn btn-primary mb-3"
        onClick={checkAll}
        disabled={loading}
      >
        {loading ? 'Running...' : 'Run Diagnostics'}
      </button>
      
      <button 
        className="btn btn-secondary mb-3 ms-2"
        onClick={clearResults}
      >
        Clear
      </button>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Results</h5>
        </div>
        <div className="card-body">
          {results.length === 0 ? (
            <p className="text-muted">Click "Run Diagnostics" to start</p>
          ) : (
            <div className="list-group">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`list-group-item list-group-item-${result.type === 'error' ? 'danger' : result.type === 'success' ? 'success' : 'light'}`}
                >
                  <small className="text-muted me-2">[{result.timestamp}]</small>
                  {result.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Diagnostic;