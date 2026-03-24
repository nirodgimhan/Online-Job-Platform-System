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
  FaGraduationCap,
  FaBriefcase,
  FaUsers,
  FaClock,
  FaCheckCircle,
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
    <div className="ds-services">
      {/* Hero Section */}
      <section className="ds-services-hero">
        <div className="ds-container">
          <h1>Our <span className="ds-highlight">Services</span></h1>
          <p className="ds-subtitle">
            Comprehensive career solutions for job seekers and employers
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="ds-services-grid-section">
        <div className="ds-container">
          <div className="ds-services-grid">
            {services.map((service, index) => (
              <div key={index} className="ds-service-card">
                <div className="ds-service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <div className="ds-service-features">
                  {service.features.map((feature, i) => (
                    <div key={i} className="ds-service-feature">
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
      <section className="ds-services-students">
        <div className="ds-container">
          <div className="ds-services-students-grid">
            <div className="ds-services-students-content">
              <h2>For Job Seekers</h2>
              <p className="ds-lead">Everything you need to land your dream job</p>
              <ul className="ds-services-list">
                <li><FaCheckCircle /> Create a professional profile</li>
                <li><FaCheckCircle /> Upload and manage multiple CVs</li>
                <li><FaCheckCircle /> Get AI-powered job recommendations</li>
                <li><FaCheckCircle /> Track applications in real-time</li>
                <li><FaCheckCircle /> Receive job alerts</li>
                <li><FaCheckCircle /> Access career resources</li>
              </ul>
              <Link to="/register" className="ds-btn ds-btn-primary">
                Get Started <FaArrowRight />
              </Link>
            </div>
            <div className="ds-services-students-image">
              <div className="ds-image-placeholder">
                <FaGraduationCap className="ds-placeholder-icon" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Companies Section */}
      <section className="ds-services-companies">
        <div className="ds-container">
          <div className="ds-services-companies-grid">
            <div className="ds-services-companies-image">
              <div className="ds-image-placeholder">
                <FaBuilding className="ds-placeholder-icon" />
              </div>
            </div>
            <div className="ds-services-companies-content">
              <h2>For Employers</h2>
              <p className="ds-lead">Find the best talent for your organization</p>
              <ul className="ds-services-list">
                <li><FaCheckCircle /> Post jobs and manage applications</li>
                <li><FaCheckCircle /> Access candidate database</li>
                <li><FaCheckCircle /> AI-powered candidate matching</li>
                <li><FaCheckCircle /> Schedule and manage interviews</li>
                <li><FaCheckCircle /> Company branding and profiles</li>
                <li><FaCheckCircle /> Analytics and insights</li>
              </ul>
              <Link to="/register" className="ds-btn ds-btn-primary">
                Start Hiring <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="ds-services-cta">
        <div className="ds-container">
          <h2>Ready to Transform Your Career?</h2>
          <p>Join thousands of satisfied users who have found success with JobPortal</p>
          <div className="ds-services-cta-buttons">
            <Link to="/register" className="ds-btn ds-btn-primary ds-btn-lg">
              Sign Up Now
            </Link>
            <Link to="/contact" className="ds-btn ds-btn-outline-light ds-btn-lg">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;