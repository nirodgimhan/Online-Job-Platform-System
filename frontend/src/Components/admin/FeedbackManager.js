import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaStar, FaTrash, FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FeedbackManager = () => {
    const [allFeedback, setAllFeedback] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/feedback');
            setAllFeedback(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching feedback:", err);
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // ✅ This was missing!
    const handleToggleFeature = async (id) => {
        try {
            await axios.patch(`http://localhost:5000/api/feedback/feature/${id}`);
            toast.success("Featured status updated!");
            fetchAll(); // Refresh the list from the database
        } catch (err) {
            toast.error(err.response?.data?.message || "Error updating featured status");
        }
    };

    // ✅ This was missing!
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this feedback?")) {
            try {
                await axios.delete(`http://localhost:5000/api/feedback/${id}`);
                toast.success("Feedback deleted");
                fetchAll();
            } catch (err) {
                toast.error("Failed to delete feedback");
            }
        }
    };

    if (loading) return <div className="ds-loading-container"><div className="ds-spinner"></div></div>;

    return (
        <div className="admin-feedback-container" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Manage Feedback</h2>
                <p style={{ color: '#666' }}>Select up to 3 best feedbacks to show on the Home Page.</p>
            </div>

            <div className="table-responsive" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                            <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>User</th>
                            <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Comment</th>
                            <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Status</th>
                            <th style={{ padding: '15px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allFeedback.map((f) => (
                            <tr key={f._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: '500' }}>
                                    <FaUserCircle style={{ marginRight: '8px', color: '#4299e1' }} /> {f.name}
                                </td>
                                <td style={{ padding: '15px', color: '#555', maxWidth: '400px' }}>{f.comment}</td>
                                <td style={{ padding: '15px' }}>
                                    {f.isFeatured ? (
                                        <span style={{ color: '#9c4221', background: '#feebc8', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                                            ⭐ FEATURED
                                        </span>
                                    ) : (
                                        <span style={{ color: '#4a5568', background: '#edf2f7', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                            Standard
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <button 
                                        onClick={() => handleToggleFeature(f._id)}
                                        style={{ 
                                            background: f.isFeatured ? '#3182ce' : '#ebf8ff',
                                            color: f.isFeatured ? '#fff' : '#3182ce',
                                            border: '1px solid #3182ce',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            marginRight: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {f.isFeatured ? 'Unfeature' : 'Feature'}
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(f._id)}
                                        style={{ background: '#fff5f5', color: '#e53e3e', border: '1px solid #feb2b2', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FeedbackManager;