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

    const handleToggleFeature = async (id) => {
        try {
            const res = await API.patch(`/feedback/${id}/toggle-feature`);
            if (res.data.success) {
                toast.success(res.data.message || 'Featured status updated');
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
            <div className="fm-loading-container">
                <div className="fm-spinner"></div>
                <p>Loading feedback data...</p>
            </div>
        );
    }

    return (
        <div className="fm-feedback-manager">
            <div className="fm-header">
                <div className="fm-header-left">
                    <div className="fm-header-icon-wrapper">
                        <FaStar />
                    </div>
                    <div>
                        <h2>Manage Feedback</h2>
                        <p>Select up to 3 feedbacks to feature on the homepage</p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="fm-refresh-btn"
                >
                    <FaSyncAlt className={refreshing ? 'fm-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="fm-table-container">
                <table className="fm-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Feedback</th>
                            <th>Rating</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feedbacks.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="fm-empty-state">
                                    No feedback submissions yet.
                                </td>
                            </tr>
                        ) : (
                            feedbacks.map((fb) => (
                                <tr key={fb._id}>
                                    <td className="fm-user-cell">
                                        <FaUserCircle className="fm-user-icon" />
                                        {fb.name}
                                    </td>
                                    <td className="fm-comment">
                                        "{fb.comment}"
                                    </td>
                                    <td>
                                        <div className="fm-rating">
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar
                                                    key={i}
                                                    className={i < fb.rating ? 'fm-star-filled' : 'fm-star-empty'}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`fm-badge ${fb.isFeatured ? 'fm-badge-featured' : 'fm-badge-standard'}`}>
                                            {fb.isFeatured ? '⭐ Featured' : 'Standard'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleToggleFeature(fb._id)}
                                            className={`fm-action-btn ${fb.isFeatured ? 'fm-unfeature-btn' : 'fm-feature-btn'}`}
                                        >
                                            {fb.isFeatured ? 'Unfeature' : 'Feature'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(fb._id)}
                                            className="fm-action-btn fm-delete-btn"
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

            <div className="fm-info-note">
                <strong>ℹ️ Note:</strong> Only 3 feedbacks can be featured at a time. When you feature a fourth one, the backend will reject it until you unfeature one.
            </div>
        </div>
    );
};

export default FeedbackManager;