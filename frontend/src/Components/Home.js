import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Components/context/AuthContext';
import { 
  FaBriefcase, FaSearch, FaFileAlt, FaBuilding, FaUsers, FaChartLine,
  FaCheckCircle, FaStar, FaArrowRight, FaClock, FaMapMarkerAlt,
  FaDollarSign, FaRocket, FaShieldAlt, FaQuoteLeft, FaQuoteRight,
  FaLinkedin, FaTwitter, FaFacebook, FaGithub, FaUserGraduate, FaRegHeart
} from 'react-icons/fa';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Stats
  const [stats, setStats] = useState({
    jobs: 0,
    companies: 0,
    students: 0,
    placements: 0
  });

  // Featured jobs
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = () => {
    setTimeout(() => {
      setStats({
        jobs: 10000,
        companies: 5000,
        students: 50000,
        placements: 9500
      });

      setFeaturedJobs([
        {
          id: 1,
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          location: 'Colombo, Sri Lanka',
          salary: '$80k - $120k',
          type: 'Full-time',
          posted: '2 days ago',
          logo: null
        },
        {
          id: 2,
          title: 'Product Manager',
          company: 'Innovation Labs',
          location: 'Remote',
          salary: '$70k - $100k',
          type: 'Full-time',
          posted: '3 days ago',
          logo: null
        },
        {
          id: 3,
          title: 'UX/UI Designer',
          company: 'Creative Studio',
          location: 'Kandy, Sri Lanka',
          salary: '$50k - $70k',
          type: 'Contract',
          posted: '1 week ago',
          logo: null
        },
        {
          id: 4,
          title: 'Marketing Specialist',
          company: 'Growth Inc',
          location: 'Remote',
          salary: '$40k - $60k',
          type: 'Part-time',
          posted: '5 days ago',
          logo: null
        },
        {
          id: 5,
          title: 'Data Scientist',
          company: 'Analytics Co',
          location: 'Colombo, Sri Lanka',
          salary: '$90k - $130k',
          type: 'Full-time',
          posted: '1 day ago',
          logo: null
        },
        {
          id: 6,
          title: 'HR Manager',
          company: 'Global Enterprises',
          location: 'Remote',
          salary: '$60k - $85k',
          type: 'Full-time',
          posted: '4 days ago',
          logo: null
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const features = [
    {
      icon: <FaSearch />,
      title: 'Smart Job Search',
      description: 'Find the perfect job with our AI-powered search and matching algorithm.'
    },
    {
      icon: <FaFileAlt />,
      title: 'AI CV Analysis',
      description: 'Get intelligent suggestions to improve your CV and increase your chances.'
    },
    {
      icon: <FaBuilding />,
      title: 'Verified Companies',
      description: 'All companies are verified to ensure a safe and trustworthy experience.'
    },
    {
      icon: <FaChartLine />,
      title: 'Track Applications',
      description: 'Monitor your job applications and get real-time status updates.'
    },
    {
      icon: <FaRocket />,
      title: 'Fast Apply',
      description: 'Apply to multiple jobs quickly with your saved profile and CV.'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Secure Platform',
      description: 'Your data is protected with enterprise-grade security.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      company: 'Tech Corp',
      content: 'JobPortal helped me land my dream job within 2 weeks. The platform is intuitive and the job matches were perfect!',
      rating: 5,
      image: null
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager',
      company: 'Innovation Labs',
      content: 'As a company, we\'ve found amazing talent through this platform. Highly recommended!',
      rating: 5,
      image: null
    },
    {
      name: 'Priya Kumar',
      role: 'UX Designer',
      company: 'Creative Studio',
      content: 'The CV analysis feature helped me improve my resume significantly. Got multiple interview calls!',
      rating: 5,
      image: null
    }
  ];

  const companies = [
    { name: 'Tech Corp', logo: null },
    { name: 'Innovation Labs', logo: null },
    { name: 'Creative Studio', logo: null },
    { name: 'Growth Inc', logo: null },
    { name: 'Analytics Co', logo: null },
    { name: 'Global Enterprises', logo: null }
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < rating ? '#fbbf24' : '#e5e7eb'} />
    ));
  };

  return (
    <div className="hp-home-page">
      {/* Hero Section */}
      <section className="hp-hero-section">
        <div className="hp-container">
          <div className="hp-hero-content">
            <h1>
              Find Your <span className="hp-gradient-text">Dream Job</span> Today
            </h1>
            <p className="hp-hero-subtitle">
              Connect with thousands of employers and find the perfect opportunity that matches your skills and aspirations.
            </p>

            <div className="hp-hero-buttons">
              {user ? (
                <Link to={user.role === 'student' ? '/student/dashboard' : '/company/dashboard'} className="hp-btn hp-btn-primary hp-btn-lg">
                  Go to Dashboard <FaArrowRight />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="hp-btn hp-btn-primary hp-btn-lg">
                    Get Started <FaArrowRight />
                  </Link>
                  <Link to="/about" className="hp-btn hp-btn-outline hp-btn-lg">
                    Learn More
                  </Link>
                </>
              )}
            </div>

            <div className="hp-hero-stats">
              <div className="hp-stat-item">
                <div className="hp-stat-number">{stats.jobs.toLocaleString()}+</div>
                <div className="hp-stat-label">Active Jobs</div>
              </div>
              <div className="hp-stat-item">
                <div className="hp-stat-number">{stats.companies.toLocaleString()}+</div>
                <div className="hp-stat-label">Companies</div>
              </div>
              <div className="hp-stat-item">
                <div className="hp-stat-number">{stats.students.toLocaleString()}+</div>
                <div className="hp-stat-label">Students</div>
              </div>
              <div className="hp-stat-item">
                <div className="hp-stat-number">{stats.placements.toLocaleString()}+</div>
                <div className="hp-stat-label">Placements</div>
              </div>
            </div>
          </div>

          <div className="hp-hero-image">
            <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Hero" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="hp-features-section">
        <div className="hp-container">
          <div className="hp-section-header">
            <h2>Why Choose JobPortal?</h2>
            <p>We provide the best tools and features to help you succeed</p>
          </div>

          <div className="hp-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="hp-feature-card">
                <div className="hp-feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="hp-jobs-section">
        <div className="hp-container">
          <div className="hp-section-header">
            <h2>Featured Jobs</h2>
            <p>Discover the latest opportunities from top companies</p>
          </div>

          {loading ? (
            <div className="hp-loading-spinner">
              <div className="hp-spinner"></div>
            </div>
          ) : (
            <>
              <div className="hp-jobs-grid">
                {featuredJobs.map((job) => (
                  <div key={job.id} className="hp-job-card">
                    <div className="hp-job-card-header">
                      <div className="hp-company-logo">
                        {job.logo ? (
                          <img src={job.logo} alt={job.company} />
                        ) : (
                          <div className="hp-logo-placeholder">
                            {job.company.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="hp-job-title">
                        <h3>{job.title}</h3>
                        <p className="hp-company-name">{job.company}</p>
                      </div>
                    </div>

                    <div className="hp-job-details">
                      <div className="hp-job-detail">
                        <FaMapMarkerAlt />
                        <span>{job.location}</span>
                      </div>
                      <div className="hp-job-detail">
                        <FaBriefcase />
                        <span>{job.type}</span>
                      </div>
                      <div className="hp-job-detail">
                        <FaDollarSign />
                        <span>{job.salary}</span>
                      </div>
                      <div className="hp-job-detail">
                        <FaClock />
                        <span>{job.posted}</span>
                      </div>
                    </div>

                    <div className="hp-job-card-footer">
                      <Link to={`/job/${job.id}`} className="hp-btn hp-btn-outline-primary hp-btn-sm">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hp-view-more">
                <Link to="/jobs" className="hp-btn hp-btn-outline-primary">
                  View All Jobs <FaArrowRight />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="hp-how-it-works">
        <div className="hp-container">
          <div className="hp-section-header">
            <h2>How It Works</h2>
            <p>Three simple steps to your dream job</p>
          </div>

          <div className="hp-steps-grid">
            <div className="hp-step-card">
              <div className="hp-step-number">1</div>
              <div className="hp-step-icon">
                <FaUserGraduate />
              </div>
              <h3>Create Account</h3>
              <p>Sign up as a student or company in minutes with your email or social media.</p>
            </div>

            <div className="hp-step-card">
              <div className="hp-step-number">2</div>
              <div className="hp-step-icon">
                <FaFileAlt />
              </div>
              <h3>Build Profile</h3>
              <p>Complete your profile with education, experience, skills, and upload your CV.</p>
            </div>

            <div className="hp-step-card">
              <div className="hp-step-number">3</div>
              <div className="hp-step-icon">
                <FaCheckCircle />
              </div>
              <h3>Start Applying</h3>
              <p>Find and apply to jobs that match your profile with one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="hp-testimonials-section">
        <div className="hp-container">
          <div className="hp-section-header">
            <h2>What Our Users Say</h2>
            <p>Success stories from our community</p>
          </div>

          <div className="hp-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="hp-testimonial-card">
                <div className="hp-quote-icon">
                  <FaQuoteLeft />
                </div>
                <p className="hp-testimonial-content">{testimonial.content}</p>
                <div className="hp-testimonial-rating">
                  {renderStars(testimonial.rating)}
                </div>
                <div className="hp-testimonial-author">
                  <div className="hp-author-avatar">
                    {testimonial.image ? (
                      <img src={testimonial.image} alt={testimonial.name} />
                    ) : (
                      <div className="hp-avatar-placeholder">
                        {testimonial.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="hp-author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
                <div className="hp-quote-icon-end">
                  <FaQuoteRight />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Companies Section */}
      <section className="hp-companies-section">
        <div className="hp-container">
          <div className="hp-section-header">
            <h2>Trusted By Leading Companies</h2>
            <p>Join thousands of companies hiring through JobPortal</p>
          </div>

          <div className="hp-companies-grid">
            {companies.map((company, index) => (
              <div key={index} className="hp-company-card">
                {company.logo ? (
                  <img src={company.logo} alt={company.name} />
                ) : (
                  <div className="hp-company-logo-placeholder">
                    <FaBuilding />
                    <span>{company.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hp-cta-section">
        <div className="hp-container">
          <div className="hp-cta-card">
            <h2>Ready to Start Your Journey?</h2>
            <p>Join thousands of professionals and companies already using JobPortal</p>
            <div className="hp-cta-buttons">
              {user ? (
                <Link to={user.role === 'student' ? '/student/dashboard' : '/company/dashboard'} className="hp-btn hp-btn-primary hp-btn-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="hp-btn hp-btn-primary hp-btn-lg">
                    Get Started Now
                  </Link>
                  <Link to="/contact" className="hp-btn hp-btn-outline-light hp-btn-lg">
                    Contact Us
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="hp-footer">
        <div className="hp-container">
          <div className="hp-footer-grid">
            <div className="hp-footer-col">
              <div className="hp-footer-logo">
                <FaBriefcase className="hp-logo-icon" />
                <span>JobPortal</span>
              </div>
              <p>Connecting talented professionals with forward-thinking companies since 2020.</p>
              <div className="hp-social-links">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <FaLinkedin />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <FaTwitter />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <FaFacebook />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <FaGithub />
                </a>
              </div>
            </div>

            <div className="hp-footer-col">
              <h4>For Job Seekers</h4>
              <ul>
                <li><Link to="/student/jobs">Browse Jobs</Link></li>
                <li><Link to="/student/cv-manager">CV Manager</Link></li>
                <li><Link to="/student/job-alerts">Job Alerts</Link></li>
                <li><Link to="/student/saved-jobs">Saved Jobs</Link></li>
              </ul>
            </div>

            <div className="hp-footer-col">
              <h4>For Employers</h4>
              <ul>
                <li><Link to="/company/post-job">Post a Job</Link></li>
                <li><Link to="/company/manage-jobs">Manage Jobs</Link></li>
                <li><Link to="/company/applicants">Browse Candidates</Link></li>
                <li><Link to="/company/pricing">Pricing</Link></li>
              </ul>
            </div>

            <div className="hp-footer-col">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="hp-footer-bottom">
            <p>&copy; 2024 JobPortal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;