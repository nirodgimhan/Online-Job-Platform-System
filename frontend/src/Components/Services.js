import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaSearch,
  FaFileAlt,
  FaBuilding,
  FaChartLine,
  FaRocket,
  FaShieldAlt,
  FaHandshake,
  FaGlobe,
  FaHeart,
  FaGraduationCap,FaFacebook,FaTwitter,FaGithub,
  FaBriefcase,
  FaUsers,
  FaClock,
  FaCheckCircle,FaLinkedin,
  FaArrowRight
} from 'react-icons/fa';

const Services = () => {
  const services = [
    {
      icon: <FaSearch />,
      title: 'Smart Job Search',
      description: 'AI-powered job matching that connects you with the perfect opportunities based on your skills and preferences.',
      features: ['Personalized recommendations', 'Advanced filters', 'Location-based search', 'Salary insights']
    },
    {
      icon: <FaFileAlt />,
      title: 'CV Analysis & Optimization',
      description: 'Get intelligent feedback on your resume with AI-powered analysis and suggestions for improvement.',
      features: ['ATS compatibility check', 'Keyword optimization', 'Format suggestions', 'Score tracking']
    },
    {
      icon: <FaBuilding />,
      title: 'Company Profiles',
      description: 'Explore detailed company information, culture, and reviews to make informed career decisions.',
      features: ['Company reviews', 'Salary information', 'Interview experiences', 'Culture insights']
    },
    {
      icon: <FaChartLine />,
      title: 'Application Tracking',
      description: 'Monitor all your job applications in one place with real-time status updates and analytics.',
      features: ['Status tracking', 'Interview schedules', 'Application history', 'Success analytics']
    },
    {
      icon: <FaRocket />,
      title: 'Quick Apply',
      description: 'Apply to multiple jobs instantly with your saved profile and CV, saving time and effort.',
      features: ['One-click apply', 'Profile management', 'CV storage', 'Application history']
    },
    {
      icon: <FaShieldAlt />,
      title: 'Verified Employers',
      description: 'All companies are verified to ensure a safe and trustworthy job search experience.',
      features: ['Verified badges', 'Company verification', 'Secure messaging', 'Report system']
    },
    {
      icon: <FaHandshake />,
      title: 'Direct Messaging',
      description: 'Connect directly with employers and recruiters through our integrated messaging system.',
      features: ['Real-time chat', 'File sharing', 'Interview scheduling', 'Message history']
    },
    {
      icon: <FaGlobe />,
      title: 'Global Opportunities',
      description: 'Access job opportunities from companies around the world, with remote and relocation options.',
      features: ['International jobs', 'Remote work', 'Visa sponsorship', 'Relocation assistance']
    },
    {
      icon: <FaHeart />,
      title: 'Career Resources',
      description: 'Access a wealth of resources including interview tips, resume guides, and career advice.',
      features: ['Interview tips', 'Resume guides', 'Career blogs', 'Webinars']
    }
  ];

  return (
    <div className="sv-services">
      {/* Hero Section */}
      <section className="sv-hero">
        <div className="sv-container">
          <h1>Our <span className="sv-highlight">Services</span></h1>
          <p className="sv-subtitle">
            Comprehensive career solutions for job seekers and employers
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="sv-grid-section">
        <div className="sv-container">
          <div className="sv-services-grid">
            {services.map((service, index) => (
              <div key={index} className="sv-service-card">
                <div className="sv-service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <div className="sv-service-features">
                  {service.features.map((feature, i) => (
                    <div key={i} className="sv-service-feature">
                      <FaCheckCircle /> {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Students Section */}
      <section className="sv-students-section">
        <div className="sv-container">
          <div className="sv-students-grid">
            <div className="sv-students-content">
              <h2>For Job Seekers</h2>
              <p className="sv-lead">Everything you need to land your dream job</p>
              <ul className="sv-feature-list">
                <li><FaCheckCircle /> Create a professional profile</li>
                <li><FaCheckCircle /> Upload and manage multiple CVs</li>
                <li><FaCheckCircle /> Get AI-powered job recommendations</li>
                <li><FaCheckCircle /> Track applications in real-time</li>
                <li><FaCheckCircle /> Receive job alerts</li>
                <li><FaCheckCircle /> Access career resources</li>
              </ul>
              <Link to="/register" className="sv-btn sv-btn-primary">
                Get Started <FaArrowRight />
              </Link>
            </div>
            <div className="sv-students-image">
              <div className="sv-image-placeholder">
                <FaGraduationCap className="sv-placeholder-icon" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Companies Section */}
      <section className="sv-companies-section">
        <div className="sv-container">
          <div className="sv-companies-grid">
            <div className="sv-companies-image">
              <div className="sv-image-placeholder">
                <FaBuilding className="sv-placeholder-icon" />
              </div>
            </div>
            <div className="sv-companies-content">
              <h2>For Employers</h2>
              <p className="sv-lead">Find the best talent for your organization</p>
              <ul className="sv-feature-list">
                <li><FaCheckCircle /> Post jobs and manage applications</li>
                <li><FaCheckCircle /> Access candidate database</li>
                <li><FaCheckCircle /> AI-powered candidate matching</li>
                <li><FaCheckCircle /> Schedule and manage interviews</li>
                <li><FaCheckCircle /> Company branding and profiles</li>
                <li><FaCheckCircle /> Analytics and insights</li>
              </ul>
              <Link to="/register" className="sv-btn sv-btn-primary">
                Start Hiring <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="sv-cta">
        <div className="sv-container">
          <h2>Ready to Transform Your Career?</h2>
          <p>Join thousands of satisfied users who have found success with JobPortal</p>
          <div className="sv-cta-buttons">
            <Link to="/register" className="sv-btn sv-btn-primary sv-btn-lg">
              Sign Up Now
            </Link>
            <Link to="/contact" className="sv-btn sv-btn-outline-light sv-btn-lg">
              Contact Sales
            </Link>
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

export default Services;