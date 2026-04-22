import React, { useEffect, useState } from 'react';
import { useAuth, API } from '../context/AuthContext';
import { FaStar, FaTrash, FaUserCircle, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FeedbackManager = () => {
    const { user } = useAuth();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch all feedbacks
    const fetchAllFeedbacks = async () => {
        try {
            const res = await API.get('/feedback');
            // Response: { success: true, feedbacks: [...] }
            if (res.data.success) {
                setFeedbacks(res.data.feedbacks || []);
            } else {
                throw new Error(res.data.message || 'Failed to fetch feedback');
            }
        } catch (err) {
            console.error('Error fetching feedback:', err);
            toast.error(err.response?.data?.message || 'Could not load feedback');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchAllFeedbacks();
        } else {
            toast.error('Access denied. Admin only.');
            setLoading(false);
        }
    }, [user]);

    const handleToggleFeature = async (id, currentStatus) => {
        try {
            const res = await API.patch(`/feedback/${id}/toggle-feature`);
            if (res.data.success) {
                toast.success(res.data.message || 'Featured status updated');
                // Refresh list to reflect changes
                await fetchAllFeedbacks();
            } else {
                throw new Error(res.data.message);
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to update featured status';
            toast.error(msg);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
            return;
        }
        try {
            const res = await API.delete(`/feedback/${id}`);
            if (res.data.success) {
                toast.success('Feedback deleted successfully');
                await fetchAllFeedbacks();
            } else {
                throw new Error(res.data.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete feedback');
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAllFeedbacks();
    };

    if (loading) {
        return (
            <div className="ds-loading-container">
                <div className="ds-spinner"></div>
                <p>Loading feedback data...</p>
            </div>
        );
    }

    return (
        <div className="admin-feedback-container" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Manage Feedback</h2>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Select up to 3 feedbacks to feature on the homepage</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <FaSyncAlt className={refreshing ? 'fa-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="table-responsive" style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>User</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Feedback</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Rating</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feedbacks.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                    No feedback submissions yet.
                                </td>
                            </tr>
                        ) : (
                            feedbacks.map((fb) => (
                                <tr key={fb._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>
                                        <FaUserCircle style={{ marginRight: '8px', color: '#3b82f6', fontSize: '18px' }} />
                                        {fb.name}
                                    </td>
                                    <td style={{ padding: '16px', color: '#334155', maxWidth: '400px', wordBreak: 'break-word' }}>
                                        "{fb.comment}"
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', gap: '3px' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar key={i} style={{ color: i < fb.rating ? '#fbbf24' : '#e2e8f0' }} />
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {fb.isFeatured ? (
                                            <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                                ⭐ Featured
                                            </span>
                                        ) : (
                                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                                                Standard
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleToggleFeature(fb._id, fb.isFeatured)}
                                            style={{
                                                background: fb.isFeatured ? '#dbeafe' : '#eff6ff',
                                                color: fb.isFeatured ? '#1e40af' : '#2563eb',
                                                border: `1px solid ${fb.isFeatured ? '#bfdbfe' : '#bfdbfe'}`,
                                                padding: '6px 14px',
                                                borderRadius: '6px',
                                                marginRight: '10px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {fb.isFeatured ? 'Unfeature' : 'Feature'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(fb._id)}
                                            style={{
                                                background: '#fef2f2',
                                                color: '#dc2626',
                                                border: '1px solid #fecaca',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Info box about featured limit */}
            <div style={{ marginTop: '20px', padding: '12px 16px', background: '#eff6ff', borderRadius: '8px', fontSize: '13px', color: '#1e40af' }}>
                <strong>ℹ️ Note:</strong> Only 3 feedbacks can be featured at a time. When you feature a fourth one, the backend will reject it until you unfeature one.
            </div>
        </div>
    );
};

export default FeedbackManager;