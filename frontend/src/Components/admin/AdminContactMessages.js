import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaEnvelope, FaUser, FaClock, FaEye, FaCheckDouble, 
  FaReply, FaTrash, FaSyncAlt, FaSearch, FaFilter, 
  FaTimes, FaChevronLeft, FaChevronRight, FaSpinner,
  FaEnvelopeOpen, FaCheckCircle, FaReplyAll
} from 'react-icons/fa';

// Use the same base URL as your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const limit = 10;

  useEffect(() => {
    fetchMessages();
  }, [currentPage, statusFilter]);

  const fetchMessages = async () => {
    setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        toast.error('Please login as admin');
        return;
      }

      // Build URL with correct query parameters
      const url = `${API_BASE_URL}/contact/admin?page=${currentPage}&limit=${limit}`;
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const fullUrl = url + statusParam;

      console.log('Fetching messages from:', fullUrl);

      const res = await axios.get(fullUrl, {
        headers: { 
          'x-auth-token': token,
          'Authorization': `Bearer ${token}` // try both
        }
      });

      console.log('Response data:', res.data);

      if (res.data.success) {
        setMessages(res.data.data || []);
        setTotalPages(res.data.pagination?.pages || 1);
        setTotalMessages(res.data.pagination?.total || 0);
        if (res.data.data?.length === 0) {
          toast.info('No messages found. Try sending a test message from the contact form.');
        }
      } else {
        setError(res.data.message || 'Failed to load messages');
        toast.error(res.data.message || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      console.error('Response:', err.response);
      let errorMsg = 'Error fetching messages';
      if (err.response) {
        if (err.response.status === 401) {
          errorMsg = 'Authentication failed. Please login again.';
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (err.response.status === 403) {
          errorMsg = 'Access denied. Admin privileges required.';
        } else if (err.response.status === 404) {
          errorMsg = 'Contact admin endpoint not found. Please check backend routes.';
        } else {
          errorMsg = err.response.data?.message || errorMsg;
        }
      } else if (err.request) {
        errorMsg = 'Cannot connect to server. Check if backend is running.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchMessages();
  };

  const handleViewDetails = (message) => {
    setSelectedMessage(message);
    setShowDetailModal(true);
  };

  const handleMarkAsRead = async (id) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/contact/admin/${id}/read`,
        {},
        { headers: { 'x-auth-token': token } }
      );
      if (res.data.success) {
        toast.success('Message marked as read');
        fetchMessages();
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage({ ...selectedMessage, status: 'read' });
        }
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsReplied = async (id, adminNote = '') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/contact/admin/${id}/replied`,
        { adminNote },
        { headers: { 'x-auth-token': token } }
      );
      if (res.data.success) {
        toast.success('Message marked as replied');
        fetchMessages();
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage({ ...selectedMessage, status: 'replied' });
        }
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        `${API_BASE_URL}/contact/admin/${id}`,
        { headers: { 'x-auth-token': token } }
      );
      if (res.data.success) {
        toast.success('Message deleted');
        if (selectedMessage && selectedMessage._id === id) setShowDetailModal(false);
        fetchMessages();
      }
    } catch (err) {
      toast.error('Failed to delete message');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'unread':
        return <span className="acm-badge acm-badge-danger"><FaEnvelope /> Unread</span>;
      case 'read':
        return <span className="acm-badge acm-badge-info"><FaEnvelopeOpen /> Read</span>;
      case 'replied':
        return <span className="acm-badge acm-badge-success"><FaReplyAll /> Replied</span>;
      default:
        return <span className="acm-badge">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter messages by search term (client side)
  const filteredMessages = messages.filter(msg =>
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="acm-container">
      {/* Header */}
      <div className="acm-header">
        <div className="acm-header-left">
          <div className="acm-header-icon">
            <FaEnvelope />
          </div>
          <div>
            <h1>Contact Messages</h1>
            <p className="acm-subtitle">Manage inquiries from users</p>
          </div>
        </div>
        <button className="acm-btn acm-btn-outline" onClick={handleRefresh} disabled={refreshing}>
          <FaSyncAlt className={refreshing ? 'acm-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div className="acm-stats">
        <div className="acm-stat-card">
          <FaEnvelope />
          <div>
            <h3>{totalMessages}</h3>
            <span>Total Messages</span>
          </div>
        </div>
        <div className="acm-stat-card acm-stat-unread">
          <FaEnvelope />
          <div>
            <h3>{messages.filter(m => m.status === 'unread').length}</h3>
            <span>Unread</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="acm-filters">
        <div className="acm-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by name, email, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="acm-clear-search">
              <FaTimes />
            </button>
          )}
        </div>
        <div className="acm-filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
        </div>
      </div>

      {/* Messages Table */}
      {loading ? (
        <div className="acm-loading">
          <FaSpinner className="acm-spinner" />
          <p>Loading messages...</p>
        </div>
      ) : error ? (
        <div className="acm-error">
          <p>{error}</p>
          <button className="acm-btn acm-btn-primary" onClick={fetchMessages}>Try Again</button>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="acm-empty">
          <FaEnvelope />
          <h3>No messages found</h3>
          <p>Try changing your search or filter criteria.</p>
          <button className="acm-btn acm-btn-outline" onClick={fetchMessages}>Refresh</button>
        </div>
      ) : (
        <>
          <div className="acm-table-responsive">
            <table className="acm-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map(msg => (
                  <tr key={msg._id} className={msg.status === 'unread' ? 'acm-unread-row' : ''}>
                    <td>
                      <div className="acm-sender">
                        <strong>{msg.name}</strong>
                        <small>{msg.email}</small>
                      </div>
                    </td>
                    <td>{msg.subject}</td>
                    <td>{getStatusBadge(msg.status)}</td>
                    <td>{formatDate(msg.createdAt)}</td>
                    <td>
                      <div className="acm-actions">
                        <button className="acm-icon-btn" onClick={() => handleViewDetails(msg)} title="View Details">
                          <FaEye />
                        </button>
                        {msg.status === 'unread' && (
                          <button className="acm-icon-btn acm-read" onClick={() => handleMarkAsRead(msg._id)} title="Mark as Read">
                            <FaCheckDouble />
                          </button>
                        )}
                        {msg.status !== 'replied' && (
                          <button className="acm-icon-btn acm-reply" onClick={() => handleMarkAsReplied(msg._id)} title="Mark as Replied">
                            <FaReply />
                          </button>
                        )}
                        <button className="acm-icon-btn acm-delete" onClick={() => handleDelete(msg._id)} title="Delete">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="acm-pagination">
              <button
                className="acm-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <FaChevronLeft /> Previous
              </button>
              <span className="acm-page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="acm-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedMessage && (
        <div className="acm-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="acm-modal" onClick={e => e.stopPropagation()}>
            <div className="acm-modal-header">
              <h3><FaEnvelope /> Message Details</h3>
              <button className="acm-modal-close" onClick={() => setShowDetailModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="acm-modal-body">
              <div className="acm-detail-row">
                <strong>From:</strong>
                <div>
                  <div>{selectedMessage.name}</div>
                  <small>{selectedMessage.email}</small>
                </div>
              </div>
              <div className="acm-detail-row">
                <strong>Subject:</strong>
                <div>{selectedMessage.subject}</div>
              </div>
              <div className="acm-detail-row">
                <strong>Status:</strong>
                <div>{getStatusBadge(selectedMessage.status)}</div>
              </div>
              <div className="acm-detail-row">
                <strong>Received:</strong>
                <div>{formatDate(selectedMessage.createdAt)}</div>
              </div>
              <div className="acm-detail-row acm-message-content">
                <strong>Message:</strong>
                <div className="acm-message-text">{selectedMessage.message}</div>
              </div>
              {selectedMessage.adminNote && (
                <div className="acm-detail-row">
                  <strong>Admin Note:</strong>
                  <div className="acm-admin-note">{selectedMessage.adminNote}</div>
                </div>
              )}
            </div>
            <div className="acm-modal-footer">
              {selectedMessage.status === 'unread' && (
                <button className="acm-btn acm-btn-info" onClick={() => handleMarkAsRead(selectedMessage._id)} disabled={actionLoading}>
                  <FaCheckDouble /> Mark as Read
                </button>
              )}
              {selectedMessage.status !== 'replied' && (
                <button className="acm-btn acm-btn-success" onClick={() => {
                  const note = prompt('Optional admin note (will be saved):');
                  handleMarkAsReplied(selectedMessage._id, note || '');
                }} disabled={actionLoading}>
                  <FaReply /> Mark as Replied
                </button>
              )}
              <button className="acm-btn acm-btn-danger" onClick={() => handleDelete(selectedMessage._id)} disabled={actionLoading}>
                <FaTrash /> Delete
              </button>
              <button className="acm-btn acm-btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactMessages;