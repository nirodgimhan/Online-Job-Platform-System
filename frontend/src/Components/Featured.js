import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBriefcase,
  FaBuilding,
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaStar,
  FaArrowRight,
  FaFilter,
  FaSearch
} from 'react-icons/fa';

const Featured = () => {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFeaturedJobs([
        {
          id: 1,
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          location: 'Colombo, Sri Lanka',
          salary: '$80k - $120k',
          type: 'Full-time',
          posted: '2 days ago',
          featured: true,
          category: 'technology'
        },
        {
          id: 2,
          title: 'Product Manager',
          company: 'Innovation Labs',
          location: 'Remote',
          salary: '$70k - $100k',
          type: 'Full-time',
          posted: '3 days ago',
          featured: true,
          category: 'management'
        },
        {
          id: 3,
          title: 'UX/UI Designer',
          company: 'Creative Studio',
          location: 'Kandy, Sri Lanka',
          salary: '$50k - $70k',
          type: 'Contract',
          posted: '1 week ago',
          featured: true,
          category: 'design'
        },
        {
          id: 4,
          title: 'Marketing Specialist',
          company: 'Growth Inc',
          location: 'Remote',
          salary: '$40k - $60k',
          type: 'Part-time',
          posted: '5 days ago',
          featured: false,
          category: 'marketing'
        },
        {
          id: 5,
          title: 'Data Scientist',
          company: 'Analytics Co',
          location: 'Colombo, Sri Lanka',
          salary: '$90k - $130k',
          type: 'Full-time',
          posted: '1 day ago',
          featured: true,
          category: 'technology'
        },
        {
          id: 6,
          title: 'HR Manager',
          company: 'Global Enterprises',
          location: 'Remote',
          salary: '$60k - $85k',
          type: 'Full-time',
          posted: '4 days ago',
          featured: false,
          category: 'hr'
        },
        {
          id: 7,
          title: 'DevOps Engineer',
          company: 'Cloud Solutions',
          location: 'Colombo, Sri Lanka',
          salary: '$75k - $110k',
          type: 'Full-time',
          posted: '3 days ago',
          featured: true,
          category: 'technology'
        },
        {
          id: 8,
          title: 'Sales Manager',
          company: 'SalesForce Ltd',
          location: 'Remote',
          salary: '$55k - $80k',
          type: 'Full-time',
          posted: '2 days ago',
          featured: false,
          category: 'sales'
        },
        {
          id: 9,
          title: 'Content Writer',
          company: 'Media House',
          location: 'Remote',
          salary: '$30k - $45k',
          type: 'Part-time',
          posted: '1 week ago',
          featured: false,
          category: 'content'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredJobs = filter === 'all' 
    ? featuredJobs 
    : featuredJobs.filter(job => job.category === filter);

  const categories = [
    { value: 'all', label: 'All Jobs' },
    { value: 'technology', label: 'Technology' },
    { value: 'management', label: 'Management' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' },
    { value: 'hr', label: 'HR' },
    { value: 'content', label: 'Content' }
  ];

  if (loading) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <p>Loading featured jobs...</p>
      </div>
    );
  }

  return (
    <div className="ds-featured">
      {/* Hero Section */}
      <section className="ds-featured-hero">
        <div className="ds-container">
          <h1>Featured <span className="ds-highlight">Jobs</span></h1>
          <p className="ds-subtitle">
            Discover the latest opportunities from top companies
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="ds-featured-filter">
        <div className="ds-container">
          <div className="ds-filter-bar">
            <div className="ds-search-box">
              <FaSearch className="ds-search-icon" />
              <input 
                type="text" 
                placeholder="Search jobs..." 
                className="ds-search-input"
              />
            </div>
            <div className="ds-filter-dropdown">
              <FaFilter className="ds-filter-icon" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="ds-filter-select"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Grid */}
      <section className="ds-featured-grid-section">
        <div className="ds-container">
          <div className="ds-featured-grid">
            {filteredJobs.map(job => (
              <div key={job.id} className="ds-featured-card">
                {job.featured && (
                  <div className="ds-featured-badge">
                    <FaStar /> Featured
                  </div>
                )}
                <div className="ds-featured-card-header">
                  <div className="ds-company-logo">
                    <FaBuilding />
                  </div>
                  <div className="ds-job-info">
                    <h3>{job.title}</h3>
                    <p className="ds-company-name">{job.company}</p>
                  </div>
                </div>
                <div className="ds-featured-card-body">
                  <div className="ds-job-detail">
                    <FaMapMarkerAlt /> {job.location}
                  </div>
                  <div className="ds-job-detail">
                    <FaBriefcase /> {job.type}
                  </div>
                  <div className="ds-job-detail">
                    <FaDollarSign /> {job.salary}
                  </div>
                  <div className="ds-job-detail">
                    <FaClock /> {job.posted}
                  </div>
                </div>
                <div className="ds-featured-card-footer">
                  <Link to={`/job/${job.id}`} className="ds-btn ds-btn-outline-primary">
                    View Details
                  </Link>
                  <button className="ds-btn ds-btn-primary">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* View More */}
      <section className="ds-featured-more">
        <div className="ds-container">
          <Link to="/jobs" className="ds-btn ds-btn-outline-primary ds-btn-lg">
            View All Jobs <FaArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Featured;