import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaPaperPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FeedbackForm = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        comment: '',
        rating: 5
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return toast.error("Please login to leave feedback");

        setSubmitting(true);
        try {
            const feedbackData = {
                user: user._id || user.id,
                name: user.name,
                comment: formData.comment,
                rating: formData.rating
            };

            await axios.post('http://localhost:5000/api/feedback', feedbackData);
            toast.success("Feedback submitted! Thank you.");
            setFormData({ comment: '', rating: 5 }); // Reset form
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit feedback");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="hp-container" style={{ maxWidth: '600px', margin: '40px auto' }}>
            <div className="hp-section-header">
                <h2>Share Your <span className="hp-gradient-text">Experience</span></h2>
                <p>How has JobPortal helped your career journey?</p>
            </div>

            <form onSubmit={handleSubmit} className="feedback-form-card" style={{
                background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Rating</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                                key={star}
                                onClick={() => setFormData({ ...formData, rating: star })}
                                style={{ 
                                    cursor: 'pointer', 
                                    fontSize: '24px', 
                                    color: star <= formData.rating ? '#fbbf24' : '#e5e7eb' 
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Your Thoughts</label>
                    <textarea
                        required
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        placeholder="Tell us about your success story..."
                        style={{
                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '120px', outline: 'none'
                        }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    className="hp-btn hp-btn-primary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {submitting ? 'Submitting...' : <><FaPaperPlane style={{ marginRight: '8px' }} /> Submit Feedback</>}
                </button>
            </form>
        </div>
    );
};

export default FeedbackForm;