import React, { useState } from 'react';
import { useAuth, API } from '../context/AuthContext';
import { FaSyncAlt, FaTrash, FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

const Diagnostic = () => {
  const { user, isAuthenticated } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const runDiagnostics = async () => {
    clearResults();
    setLoading(true);
    
    // 1. Token check
    const token = localStorage.getItem('token');
    addResult(`Token in localStorage: ${token ? 'Present' : 'Missing'}`, token ? 'success' : 'error');
    if (token) addResult(`Token preview: ${token.substring(0, 20)}...`, 'info');

    // 2. User from context
    addResult(`User from context: ${user ? 'Present' : 'Missing'}`, user ? 'success' : 'error');
    if (user) {
      addResult(`User role: ${user.role}`, 'info');
      addResult(`User ID: ${user.id}`, 'info');
      addResult(`Authenticated: ${isAuthenticated ? 'Yes' : 'No'}`, isAuthenticated ? 'success' : 'error');
    }

    // 3. Backend health check (via API instance)
    try {
      const healthRes = await API.get('/health');
      addResult(`Backend health: OK (${healthRes.data.message})`, 'success');
      addResult(`MongoDB state: ${healthRes.data.mongodb?.state || 'unknown'}`, 'info');
    } catch (error) {
      addResult(`Backend health: Failed - ${error.message}`, 'error');
    }

    // 4. Auth/me endpoint
    try {
      const meRes = await API.get('/auth/me');
      addResult(`Auth/me: Success`, 'success');
      addResult(`Auth/me data: ${meRes.data.user?.name} (${meRes.data.user?.email})`, 'info');
    } catch (error) {
      addResult(`Auth/me: Failed - ${error.response?.data?.message || error.message}`, 'error');
      if (error.response) addResult(`Status: ${error.response.status}`, 'error');
    }

    // 5. Student profile (only if role is student)
    if (user?.role === 'student') {
      try {
        const profileRes = await API.get('/students/profile');
        addResult(`Student profile: Found`, 'success');
        addResult(`Profile ID: ${profileRes.data.student?._id}`, 'info');
      } catch (error) {
        addResult(`Student profile: Failed - ${error.response?.data?.message || error.message}`, 'error');
        if (error.response) addResult(`Status: ${error.response.status}`, 'error');
      }
    }

    // 6. Applications (student only)
    if (user?.role === 'student') {
      try {
        const appsRes = await API.get('/applications/student');
        addResult(`Applications: Success`, 'success');
        addResult(`Applications count: ${appsRes.data.applications?.length || 0}`, 'info');
      } catch (error) {
        addResult(`Applications: Failed - ${error.response?.data?.message || error.message}`, 'error');
        if (error.response) addResult(`Status: ${error.response.status}`, 'error');
      }
    }

    // 7. Jobs endpoint (public)
    try {
      const jobsRes = await API.get('/jobs?limit=1');
      addResult(`Jobs endpoint: Success`, 'success');
      addResult(`Total jobs: ${jobsRes.data.total || 0}`, 'info');
    } catch (error) {
      addResult(`Jobs endpoint: Failed - ${error.message}`, 'error');
    }

    // 8. Notifications endpoint (authenticated)
    if (isAuthenticated) {
      try {
        const notifRes = await API.get('/notifications?limit=1');
        addResult(`Notifications endpoint: Success`, 'success');
        addResult(`Unread count: ${notifRes.data.unreadCount || 0}`, 'info');
      } catch (error) {
        addResult(`Notifications endpoint: Failed - ${error.message}`, 'error');
      }
    }

    // Summary
    const successCount = results.filter(r => r.type === 'success').length;
    const errorCount = results.filter(r => r.type === 'error').length;
    addResult(`--- DIAGNOSTIC COMPLETE ---`, 'info');
    addResult(`Successes: ${successCount} / Errors: ${errorCount}`, errorCount > 0 ? 'error' : 'success');

    setLoading(false);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <FaCheckCircle className="text-success" />;
      case 'error': return <FaTimesCircle className="text-danger" />;
      default: return <FaInfoCircle className="text-info" />;
    }
  };

  return (
    <div className="jobdash-student-dashboard" style={{ padding: '24px' }}>
      <div className="jobdash-card" style={{ marginBottom: '24px' }}>
        <div className="jobdash-card-header">
          <h5>Diagnostic Tool</h5>
          <div>
            <button 
              className="jobdash-btn jobdash-btn-primary me-2"
              onClick={runDiagnostics}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <FaSyncAlt className={loading ? 'jobdash-spin' : ''} />
              {loading ? 'Running...' : 'Run Diagnostics'}
            </button>
            <button 
              className="jobdash-btn jobdash-btn-outline-primary"
              onClick={clearResults}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <FaTrash /> Clear
            </button>
          </div>
        </div>
        <div className="jobdash-card-body">
          {results.length === 0 ? (
            <p className="jobdash-empty-text">Click "Run Diagnostics" to start checking your system.</p>
          ) : (
            <div className="diagnostic-results">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`diagnostic-item diagnostic-item-${result.type}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: '13px',
                    fontFamily: 'monospace'
                  }}
                >
                  <span style={{ minWidth: '80px', color: '#64748b' }}>[{result.timestamp}]</span>
                  <span style={{ minWidth: '24px' }}>{getIcon(result.type)}</span>
                  <span>{result.message}</span>
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