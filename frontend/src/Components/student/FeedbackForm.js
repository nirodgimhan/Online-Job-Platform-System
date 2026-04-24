import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../context/AuthContext';
import { FaStar, FaPaperPlane, FaQuoteLeft, FaRegSmile, FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';


const FeedbackPage = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        comment: '',
        rating: 5
    });
    const [submitting, setSubmitting] = useState(false);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

    // Fetch existing feedback (if endpoint exists)
    const fetchFeedbacks = async () => {
        try {
            const res = await API.get('/feedback');
            setFeedbacks(res.data.feedbacks || []);
        } catch (err) {
            console.warn('Could not fetch feedbacks:', err.message);
            // Fallback mock data (remove in production)
            setFeedbacks([
                { name: 'Sarah Johnson', rating: 5, comment: 'Found my dream job within a week! The platform is amazing.', createdAt: new Date().toISOString() },
                { name: 'Michael Chen', rating: 4, comment: 'Great user experience and many quality job listings.', createdAt: new Date().toISOString() }
            ]);
        } finally {
            setLoadingFeedbacks(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please login to leave feedback");
            return;
        }
        if (!formData.comment.trim()) {
            toast.error("Please enter your feedback");
            return;
        }

        setSubmitting(true);
        try {
            const feedbackData = {
                user: user._id || user.id,
                name: user.name,
                comment: formData.comment.trim(),
                rating: formData.rating
            };
            await API.post('/feedback', feedbackData);
            toast.success("Thank you! Your feedback has been submitted.");
            setFormData({ comment: '', rating: 5 });
            // Refresh the list
            fetchFeedbacks();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit feedback");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating, interactive = false, onChange = null) => {
        return (
            <div className="stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                        key={star}
                        onClick={interactive ? () => onChange(star) : undefined}
                        className={`star ${interactive ? 'interactive' : ''} ${star <= rating ? 'filled' : 'empty'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="feedback-page">
            {/* Hero Section */}
            <div className="feedback-hero">
                <div className="feedback-hero-content">
                    <h1>We Value Your <span className="gradient-text">Voice</span></h1>
                    <p>Your feedback helps us grow and serve you better. Share your experience with JobPortal.</p>
                </div>
            </div>

            <div className="feedback-main-container">
                {/* Submission Form */}
                <div className="feedback-form-card">
                    <div className="form-header">
                        <FaRegSmile className="form-icon" />
                        <h2>Share Your Experience</h2>
                        <p>How has JobPortal impacted your career?</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Your Rating</label>
                            <div className="rating-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                        key={star}
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                        className={`star interactive ${star <= formData.rating ? 'filled' : 'empty'}`}
                                        size={28}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Your Feedback</label>
                            <textarea
                                required
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                placeholder="Tell us about your success story, suggestions, or any issues..."
                                rows="5"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="submit-btn"
                        >
                            {submitting ? (
                                <>Submitting...</>
                            ) : (
                                <><FaPaperPlane /> Submit Feedback</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Recent Testimonials */}
                <div className="testimonials-section">
                    <div className="testimonials-header">
                        <FaQuoteLeft className="quote-icon" />
                        <h2>What Our Users Say</h2>
                        <p>Real stories from our community</p>
                    </div>

                    {loadingFeedbacks ? (
                        <div className="loading-spinner">Loading experiences...</div>
                    ) : feedbacks.length === 0 ? (
                        <div className="empty-state">
                            <p>No feedback yet. Be the first to share your experience!</p>
                        </div>
                    ) : (
                        <div className="testimonials-grid">
                            {feedbacks.map((fb, idx) => (
                                <div className="testimonial-card" key={idx}>
                                    <div className="testimonial-header">
                                        <FaUserCircle className="user-avatar" />
                                        <div>
                                            <h4>{fb.name || "Anonymous User"}</h4>
                                            <div className="testimonial-stars">
                                                {renderStars(fb.rating)}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="testimonial-comment">"{fb.comment}"</p>
                                    <small className="testimonial-date">
                                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : "Recently"}
                                    </small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackPage;