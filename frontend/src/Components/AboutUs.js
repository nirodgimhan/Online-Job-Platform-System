import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUsers, 
  FaBriefcase, 
  FaChartLine, 
  FaShieldAlt,
  FaRocket,
  FaHandshake,
  FaGlobe,
  FaHeart,
  FaStar,
  FaAward,
  FaCheckCircle,
  FaQuoteLeft,
  FaQuoteRight,
  FaArrowRight,
  FaUserGraduate,FaLinkedin,FaTwitter,FaFacebook,FaGithub,
  FaBuilding,
  FaClock
} from 'react-icons/fa';

const AboutUs = () => {
  const stats = [
    { number: '10K+', label: 'Active Jobs', icon: <FaBriefcase /> },
    { number: '50K+', label: 'Registered Students', icon: <FaUsers /> },
    { number: '5K+', label: 'Companies', icon: <FaStar /> },
    { number: '95%', label: 'Success Rate', icon: <FaChartLine /> }
  ];

  const features = [
    {
      icon: <FaRocket />,
      title: 'Fast & Easy Job Search',
      description: 'Find your dream job quickly with our advanced search and filtering system.'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Verified Companies',
      description: 'All companies are verified to ensure a safe and trustworthy job search experience.'
    },
    {
      icon: <FaHandshake />,
      title: 'Direct Communication',
      description: 'Connect directly with employers through our integrated messaging system.'
    },
    {
      icon: <FaChartLine />,
      title: 'Career Analytics',
      description: 'Track your job applications and get insights to improve your success rate.'
    },
    {
      icon: <FaGlobe />,
      title: 'Global Opportunities',
      description: 'Access job opportunities from companies around the world.'
    },
    {
      icon: <FaHeart />,
      title: 'Personalized Experience',
      description: 'Get job recommendations tailored to your skills and preferences.'
    }
  ];

  const team = [
    {
      name: 'John Doe',
      role: 'Founder & CEO',
      bio: 'Former HR executive with 15+ years of experience in talent acquisition.'
    },
    {
      name: 'Jane Smith',
      role: 'CTO',
      bio: 'Tech visionary with expertise in AI and machine learning applications.'
    },
    {
      name: 'Mike Johnson',
      role: 'Head of Operations',
      bio: 'Operations expert ensuring smooth platform functionality and user satisfaction.'
    },
    {
      name: 'Sarah Williams',
      role: 'Customer Success',
      bio: 'Dedicated to helping users achieve their career goals.'
    }
  ];

  const testimonials = [
    {
      name: 'Robert Chen',
      role: 'Software Engineer',
      company: 'Tech Corp',
      content: 'This platform helped me land my dream job within 2 weeks. The interface is intuitive and the job matches were perfect!',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Marketing Manager',
      company: 'Growth Inc',
      content: 'As a company, we\'ve found amazing talent through this platform. The verification process ensures quality candidates.',
      rating: 5
    },
    {
      name: 'David Kim',
      role: 'Product Designer',
      company: 'Design Studio',
      content: 'The CV analysis feature helped me improve my resume significantly. Highly recommended!',
      rating: 5
    }
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < rating ? '#fbbf24' : '#e5e7eb'} />
    ));
  };

  return (
    <div className="ab-about-us">
      {/* Hero Section */}
      <section className="ab-hero">
        <div className="ab-container">
          <h1>About <span className="ab-highlight">JobPortal</span></h1>
          <p className="ab-subtitle">
            Connecting talented professionals with forward-thinking companies since 2020
          </p>
          <div className="ab-stats">
            {stats.map((stat, index) => (
              <div key={index} className="ab-stat-item">
                <div className="ab-stat-icon">{stat.icon}</div>
                <div className="ab-stat-content">
                  <h3>{stat.number}</h3>
                  <p>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="ab-story">
        <div className="ab-container">
          <div className="ab-story-grid">
            <div className="ab-story-content">
              <h2>Our Story</h2>
              <p className="ab-lead">
                JobPortal was born from a simple idea: make job searching easier and more effective for everyone.
              </p>
              <p>
                Founded in 2020, we started as a small team of HR professionals and tech enthusiasts who saw the need for a better job search platform. Traditional job boards were cluttered, inefficient, and often left both job seekers and employers frustrated.
              </p>
              <p>
                Today, we've grown into a trusted platform serving thousands of students and companies worldwide. Our AI-powered matching system ensures that the right opportunities find the right candidates, making the hiring process faster and more successful for everyone involved.
              </p>
              <div className="ab-highlights">
                <div className="ab-highlight-item">
                  <FaCheckCircle className="ab-icon" />
                  <span>100% Free for Students</span>
                </div>
                <div className="ab-highlight-item">
                  <FaCheckCircle className="ab-icon" />
                  <span>Verified Companies Only</span>
                </div>
                <div className="ab-highlight-item">
                  <FaCheckCircle className="ab-icon" />
                  <span>AI-Powered Matching</span>
                </div>
                <div className="ab-highlight-item">
                  <FaCheckCircle className="ab-icon" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            <div className="ab-story-image">
              <div className="ab-image-placeholder">
                <FaBriefcase className="ab-placeholder-icon" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="ab-mission">
        <div className="ab-container">
          <div className="ab-mission-grid">
            <div className="ab-mission-card">
              <div className="ab-card-icon">
                <FaRocket />
              </div>
              <h3>Our Mission</h3>
              <p>
                To empower professionals worldwide by providing them with the tools and opportunities they need to build successful careers and achieve their full potential.
              </p>
            </div>
            <div className="ab-mission-card">
              <div className="ab-card-icon">
                <FaGlobe />
              </div>
              <h3>Our Vision</h3>
              <p>
                To create a world where every professional can find their ideal job and every company can find their ideal candidate, seamlessly and efficiently.
              </p>
            </div>
            <div className="ab-mission-card">
              <div className="ab-card-icon">
                <FaAward />
              </div>
              <h3>Our Values</h3>
              <ul>
                <li>Integrity in every interaction</li>
                <li>Innovation in everything we do</li>
                <li>Inclusivity for all users</li>
                <li>Impact on careers and businesses</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="ab-features">
        <div className="ab-container">
          <h2 className="ab-section-title">Why Choose JobPortal?</h2>
          <p className="ab-section-subtitle">
            We provide the best tools and features to help you succeed in your career journey
          </p>
          <div className="ab-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="ab-feature-card">
                <div className="ab-feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="ab-testimonials">
        <div className="ab-container">
          <h2 className="ab-section-title">What Our Users Say</h2>
          <p className="ab-section-subtitle">
            Don't just take our word for it - hear from our community
          </p>
          <div className="ab-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="ab-testimonial-card">
                <div className="ab-quote-icon">
                  <FaQuoteLeft />
                </div>
                <p className="ab-testimonial-content">{testimonial.content}</p>
                <div className="ab-testimonial-rating">
                  {renderStars(testimonial.rating)}
                </div>
                <div className="ab-testimonial-author">
                  <div className="ab-author-avatar">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ab-author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
                <div className="ab-quote-icon-end">
                  <FaQuoteRight />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="ab-team">
        <div className="ab-container">
          <h2 className="ab-section-title">Meet Our Team</h2>
          <p className="ab-section-subtitle">
            The passionate people behind JobPortal
          </p>
          <div className="ab-team-grid">
            {team.map((member, index) => (
              <div key={index} className="ab-team-card">
                <div className="ab-member-avatar">
                  {member.name.charAt(0)}
                </div>
                <h3>{member.name}</h3>
                <p className="ab-member-role">{member.role}</p>
                <p className="ab-member-bio">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="ab-cta">
        <div className="ab-container">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join thousands of professionals and companies already using JobPortal</p>
          <div className="ab-cta-buttons">
            <Link to="/register" className="ab-btn ab-btn-primary ab-btn-lg">
              Get Started <FaArrowRight />
            </Link>
            <Link to="/contact" className="ab-btn ab-btn-outline-light ab-btn-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="ab-footer">
        <div className="ab-container">
          <div className="ab-footer-grid">
            <div className="ab-footer-col">
              <div className="ab-footer-logo">
                <FaBriefcase className="ab-logo-icon" />
                <span>JobPortal</span>
              </div>
              <p>Connecting talented professionals with forward-thinking companies since 2020.</p>
              <div className="ab-social-links">
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

            <div className="ab-footer-col">
              <h4>For Job Seekers</h4>
              <ul>
                <li><Link to="/student/jobs">Browse Jobs</Link></li>
                <li><Link to="/student/cv-manager">CV Manager</Link></li>
                <li><Link to="/student/job-alerts">Job Alerts</Link></li>
                <li><Link to="/student/saved-jobs">Saved Jobs</Link></li>
              </ul>
            </div>

            <div className="ab-footer-col">
              <h4>For Employers</h4>
              <ul>
                <li><Link to="/company/post-job">Post a Job</Link></li>
                <li><Link to="/company/manage-jobs">Manage Jobs</Link></li>
                <li><Link to="/company/applicants">Browse Candidates</Link></li>
                <li><Link to="/company/pricing">Pricing</Link></li>
              </ul>
            </div>

            <div className="ab-footer-col">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="ab-footer-bottom">
            <p>&copy; 2024 JobPortal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;