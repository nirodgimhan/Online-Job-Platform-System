import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaSave,
  FaEdit,
  FaTimes,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaBriefcase,
  FaUsers,
  FaCalendarAlt,
  FaFileAlt,
  FaCamera,
  FaSpinner,
  FaArrowLeft,
  FaMapPin,
  FaCalendar,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaImage,
  FaVideo,
  FaExternalLinkAlt,
  FaSearch,
  FaEye,
  FaClock,
  FaDollarSign,
  FaChartLine,
  FaUserPlus,
  FaUserCheck,
  FaEllipsisH
} from 'react-icons/fa';

const CompanyProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const logoInputRef = useRef(null);
  
  // State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [stats, setStats] = useState({
    followers: 0,
    posts: 0,
    jobs: 0,
    views: 0,
    applications: 0
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // New post states
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [uploadingPost, setUploadingPost] = useState(false);

  // Search/filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState('all');

  // Form Data
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    foundedYear: '',
    website: '',
    description: '',
    shortDescription: '',
    tagline: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    socialMedia: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: ''
    }
  });

  // Preview URLs
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Helper function to safely render arrays
  const safeRenderArray = (array, renderFn) => {
    if (!array || !Array.isArray(array)) return null;
    return array.map((item, index) => {
      try {
        return renderFn(item, index);
      } catch (error) {
        console.error('Error rendering array item:', error);
        return null;
      }
    });
  };

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
    fetchPosts();
    fetchJobs();
    fetchFollowers();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching company profile...');
      
      const response = await API.get('/companies/profile');
      console.log('Profile response:', response.data);
      
      if (response.data.success) {
        const companyData = response.data.company;
        setProfile(companyData);
        
        setFormData({
          companyName: companyData.companyName || '',
          industry: companyData.industry || '',
          companySize: companyData.companySize || '',
          foundedYear: companyData.foundedYear || '',
          website: companyData.website || '',
          description: companyData.description || '',
          shortDescription: companyData.shortDescription || '',
          tagline: companyData.tagline || '',
          contactEmail: companyData.contactEmail || user?.email || '',
          contactPhone: companyData.contactPhone || user?.phoneNumber || '',
          address: companyData.address || {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
          },
          socialMedia: companyData.socialMedia || {
            linkedin: '',
            twitter: '',
            facebook: '',
            instagram: ''
          }
        });

        if (companyData.companyLogo) {
          setLogoPreview(`http://localhost:5000${companyData.companyLogo}`);
        }
        if (companyData.coverPhoto) {
          setCoverPreview(`http://localhost:5000${companyData.coverPhoto}`);
        }

        toast.success('Profile loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
      
      if (error.response?.status === 404) {
        toast.info('Please create your company profile first');
        setEditing(true);
      } else {
        toast.error('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await API.get('/companies/posts');
      if (response.data.success) {
        setPosts(response.data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await API.get('/companies/jobs');
      if (response.data.success) {
        setJobs(response.data.jobs || []);
        setStats(prev => ({ ...prev, jobs: response.data.jobs?.length || 0 }));
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await API.get('/companies/followers');
      if (response.data.success) {
        setFollowers(response.data.followers || []);
        setStats(prev => ({ ...prev, followers: response.data.followers?.length || 0 }));
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
      setFollowers([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/companies/stats');
      if (response.data.success) {
        setStats(prev => ({ ...prev, ...response.data.stats }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else if (name.includes('socialMedia.')) {
      const platform = name.split('.')[1];
      setFormData({
        ...formData,
        socialMedia: {
          ...formData.socialMedia,
          [platform]: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Logo Upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB');
      return;
    }

    try {
      setUploadingLogo(true);
      
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('logo', file);

      const response = await API.post('/companies/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Logo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Cover Photo Upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Cover photo must be less than 10MB');
      return;
    }

    try {
      setUploadingCover(true);
      
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('cover', file);

      const response = await API.post('/companies/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Cover photo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  // Post Management
  const handleCreatePost = async () => {
    if (!newPost.trim()) {
      toast.error('Please write something');
      return;
    }

    setUploadingPost(true);
    try {
      const formData = new FormData();
      formData.append('content', newPost);
      if (postImage) formData.append('image', postImage);

      const response = await API.post('/companies/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setPosts([response.data.post, ...posts]);
        setStats(prev => ({ ...prev, posts: prev.posts + 1 }));
        setNewPost('');
        setPostImage(null);
        setShowPostModal(false);
        toast.success('Post created successfully');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setUploadingPost(false);
    }
  };

  const handleLikePost = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked }
        : post
    ));
  };

  // Submit Profile
  const handleSubmit = async () => {
    if (!formData.companyName) {
      toast.error('Company name is required');
      return;
    }

    setSaving(true);
    
    try {
      const profileData = {
        companyName: formData.companyName,
        industry: formData.industry || null,
        companySize: formData.companySize || null,
        foundedYear: formData.foundedYear || null,
        website: formData.website || null,
        description: formData.description || null,
        shortDescription: formData.shortDescription || null,
        tagline: formData.tagline || null,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null,
        address: formData.address,
        socialMedia: formData.socialMedia
      };

      console.log('Submitting profile:', profileData);

      const response = await API.post('/companies/profile', profileData);
      
      if (response.data.success) {
        setProfile(response.data.company);
        setEditing(false);
        toast.success('Profile updated successfully');
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        companyName: profile.companyName || '',
        industry: profile.industry || '',
        companySize: profile.companySize || '',
        foundedYear: profile.foundedYear || '',
        website: profile.website || '',
        description: profile.description || '',
        shortDescription: profile.shortDescription || '',
        tagline: profile.tagline || '',
        contactEmail: profile.contactEmail || user?.email || '',
        contactPhone: profile.contactPhone || user?.phoneNumber || '',
        address: profile.address || {
          street: '', city: '', state: '', country: '', zipCode: ''
        },
        socialMedia: profile.socialMedia || {
          linkedin: '', twitter: '', facebook: '', instagram: ''
        }
      });
    }
    if (profile?.companyLogo) {
      setLogoPreview(`http://localhost:5000${profile.companyLogo}`);
    }
    if (profile?.coverPhoto) {
      setCoverPreview(`http://localhost:5000${profile.coverPhoto}`);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await API.post(`/companies/follow/${profile?.userId}`);
      if (response.data.success) {
        setIsFollowing(!isFollowing);
        setStats(prev => ({
          ...prev,
          followers: isFollowing ? prev.followers - 1 : prev.followers + 1
        }));
        toast.success(isFollowing ? 'Unfollowed' : 'Now following');
      }
    } catch (error) {
      console.error('Error following:', error);
      toast.error('Failed to follow');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Filter jobs based on status and search
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = jobFilter === 'all' || job.status === jobFilter;
    return matchesSearch && matchesStatus;
  });

  const activeJobsCount = jobs.filter(job => job.status === 'active').length;

  if (loading) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Loading company profile...</h4>
      </div>
    );
  }

  return (
    <div className="ds-company-profile">
      <div className="ds-company-profile-container">
        {/* Cover Photo */}
        <div className="ds-cover-photo" style={{ 
          backgroundImage: coverPreview ? `url(${coverPreview})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          {!editing && (
            <div className="ds-cover-actions">
              <label className="ds-cover-upload-btn">
                {uploadingCover ? <FaSpinner className="ds-fa-spin" /> : <FaCamera />}
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={handleCoverUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingCover}
                />
              </label>
            </div>
          )}
        </div>

        {/* Profile Header */}
        <div className="ds-profile-header">
          <div className="ds-profile-logo-wrapper">
            <div className="ds-profile-logo">
              {logoPreview ? (
                <img src={logoPreview} alt={formData.companyName} />
              ) : (
                <div className="ds-logo-placeholder">
                  {getInitials(formData.companyName || 'Company')}
                </div>
              )}
              {!editing && (
                <label className="ds-logo-upload-btn">
                  {uploadingLogo ? <FaSpinner className="ds-fa-spin" /> : <FaCamera />}
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingLogo}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="ds-profile-info">
            <div className="ds-profile-name-section">
              <h1>{formData.companyName || 'Company Name'}</h1>
              {profile?.verified && (
                <span className="ds-verified-badge">
                  <FaCheckCircle /> Verified
                </span>
              )}
              <p className="ds-profile-tagline">{formData.tagline || formData.shortDescription || 'No tagline added'}</p>
            </div>

            <div className="ds-profile-actions">
              {!editing ? (
                <>
                  <button className="ds-follow-btn" onClick={handleFollow}>
                    {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="ds-edit-profile-btn" onClick={() => setEditing(true)}>
                    <FaEdit /> Edit Profile
                  </button>
                  <button className="ds-post-job-btn" onClick={() => navigate('/company/post-job')}>
                    <FaPlus /> Post Job
                  </button>
                </>
              ) : (
                <div className="ds-edit-actions">
                  <button className="ds-cancel-btn" onClick={handleCancelEdit}>
                    <FaTimes /> Cancel
                  </button>
                  <button className="ds-save-btn" onClick={handleSubmit} disabled={saving}>
                    {saving ? <><FaSpinner className="ds-fa-spin" /> Saving...</> : <><FaSave /> Save Changes</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information Card - Always visible */}
        {!editing && (
          <div className="ds-basic-info-card">
            <div className="ds-basic-info-header">
              <h3>Basic Information</h3>
            </div>
            <div className="ds-basic-info-content">
              <div className="ds-info-row">
                <div className="ds-info-item">
                  <span className="ds-info-label">Industry</span>
                  <span className="ds-info-value">{formData.industry || 'Not specified'}</span>
                </div>
                <div className="ds-info-item">
                  <span className="ds-info-label">Company Size</span>
                  <span className="ds-info-value">{formData.companySize || 'Not specified'}</span>
                </div>
                <div className="ds-info-item">
                  <span className="ds-info-label">Founded</span>
                  <span className="ds-info-value">{formData.foundedYear || 'Not specified'}</span>
                </div>
                <div className="ds-info-item">
                  <span className="ds-info-label">Website</span>
                  <span className="ds-info-value">
                    {formData.website ? (
                      <a href={formData.website} target="_blank" rel="noopener noreferrer">
                        {formData.website} <FaExternalLinkAlt size={12} />
                      </a>
                    ) : 'Not specified'}
                  </span>
                </div>
              </div>
              
              <div className="ds-info-row">
                <div className="ds-info-item ds-full-width">
                  <span className="ds-info-label">Description</span>
                  <p className="ds-info-description">{formData.description || 'No description provided'}</p>
                </div>
              </div>

              <div className="ds-info-row">
                <div className="ds-info-item">
                  <span className="ds-info-label">Contact Email</span>
                  <span className="ds-info-value">{formData.contactEmail || 'Not specified'}</span>
                </div>
                <div className="ds-info-item">
                  <span className="ds-info-label">Contact Phone</span>
                  <span className="ds-info-value">{formData.contactPhone || 'Not specified'}</span>
                </div>
              </div>

              <div className="ds-info-row">
                <div className="ds-info-item ds-full-width">
                  <span className="ds-info-label">Address</span>
                  <span className="ds-info-value">
                    {formData.address?.street || formData.address?.city || formData.address?.country ? (
                      <>
                        {formData.address.street && <span>{formData.address.street}, </span>}
                        {formData.address.city && <span>{formData.address.city}, </span>}
                        {formData.address.state && <span>{formData.address.state}, </span>}
                        {formData.address.country && <span>{formData.address.country}</span>}
                        {formData.address.zipCode && <span> - {formData.address.zipCode}</span>}
                      </>
                    ) : 'No address provided'}
                  </span>
                </div>
              </div>

              <div className="ds-info-row">
                <div className="ds-info-item ds-full-width">
                  <span className="ds-info-label">Social Media</span>
                  <div className="ds-social-info">
                    {formData.socialMedia?.linkedin && (
                      <a href={formData.socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                        <FaLinkedin /> LinkedIn
                      </a>
                    )}
                    {formData.socialMedia?.twitter && (
                      <a href={formData.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                        <FaTwitter /> Twitter
                      </a>
                    )}
                    {formData.socialMedia?.facebook && (
                      <a href={formData.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                        <FaFacebook /> Facebook
                      </a>
                    )}
                    {formData.socialMedia?.instagram && (
                      <a href={formData.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                        <FaInstagram /> Instagram
                      </a>
                    )}
                    {!formData.socialMedia?.linkedin && !formData.socialMedia?.twitter && 
                     !formData.socialMedia?.facebook && !formData.socialMedia?.instagram && (
                      <span>No social media links provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {!editing && (
          <div className="ds-stats-cards">
            <div className="ds-stat-card" onClick={() => setActiveTab('followers')}>
              <FaUsers className="ds-stat-icon" />
              <div className="ds-stat-info">
                <span className="ds-stat-value">{formatNumber(stats.followers)}</span>
                <span className="ds-stat-label">Followers</span>
              </div>
            </div>
            <div className="ds-stat-card" onClick={() => setActiveTab('posts')}>
              <FaFileAlt className="ds-stat-icon" />
              <div className="ds-stat-info">
                <span className="ds-stat-value">{posts.length}</span>
                <span className="ds-stat-label">Posts</span>
              </div>
            </div>
            <div className="ds-stat-card" onClick={() => setActiveTab('jobs')}>
              <FaBriefcase className="ds-stat-icon" />
              <div className="ds-stat-info">
                <span className="ds-stat-value">{activeJobsCount}</span>
                <span className="ds-stat-label">Open Jobs</span>
              </div>
            </div>
            <div className="ds-stat-card">
              <FaEye className="ds-stat-icon" />
              <div className="ds-stat-info">
                <span className="ds-stat-value">{formatNumber(stats.views)}</span>
                <span className="ds-stat-label">Profile Views</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        {!editing && (
          <div className="ds-profile-tabs">
            <button 
              className={`ds-tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
            >
              <FaBriefcase /> Jobs ({activeJobsCount})
            </button>
            <button 
              className={`ds-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <FaFileAlt /> Posts ({posts.length})
            </button>
            <button 
              className={`ds-tab-btn ${activeTab === 'followers' ? 'active' : ''}`}
              onClick={() => setActiveTab('followers')}
            >
              <FaUsers /> Followers ({stats.followers})
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="ds-main-content">
          {/* Jobs Tab */}
          {!editing && activeTab === 'jobs' && (
            <div className="ds-jobs-tab">
              <div className="ds-jobs-header">
                <h2>Job Openings</h2>
                <button className="ds-post-job-btn" onClick={() => navigate('/company/post-job')}>
                  <FaPlus /> Post New Job
                </button>
              </div>

              <div className="ds-jobs-filter">
                <div className="ds-search-box">
                  <FaSearch />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}>
                  <option value="all">All Jobs</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="ds-jobs-list">
                {filteredJobs.length > 0 ? (
                  safeRenderArray(filteredJobs, (job) => (
                    <div key={job.id} className="ds-job-card">
                      <div className="ds-job-header">
                        <h3>{job.title}</h3>
                        <span className={`ds-job-status ${job.status}`}>{job.status}</span>
                      </div>
                      <div className="ds-job-details">
                        <span><FaBriefcase /> {job.type || 'Full-time'}</span>
                        <span><FaMapMarkerAlt /> {job.location || 'Remote'}</span>
                        <span><FaDollarSign /> {job.salary || 'Negotiable'}</span>
                        <span><FaClock /> Posted {formatDate(job.postedAt)}</span>
                        <span><FaUsers /> {job.applicants || 0} applicants</span>
                      </div>
                      <div className="ds-job-actions">
                        <button className="ds-view-btn" onClick={() => navigate(`/job/${job.id}`)}>
                          View Details
                        </button>
                        <button className="ds-edit-btn" onClick={() => navigate(`/company/edit-job/${job.id}`)}>
                          Edit
                        </button>
                        <button className="ds-applicants-btn" onClick={() => navigate(`/company/job/${job.id}/applicants`)}>
                          View Applicants ({job.applicants || 0})
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ds-no-data">
                    <FaBriefcase className="ds-no-data-icon" />
                    <h3>No jobs found</h3>
                    <p>Post your first job opening to start receiving applications</p>
                    <button className="ds-post-job-btn" onClick={() => navigate('/company/post-job')}>
                      Post a Job
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {!editing && activeTab === 'posts' && (
            <div className="ds-posts-tab">
              <div className="ds-posts-header">
                <h2>Company Posts</h2>
                <button className="ds-create-post-btn" onClick={() => setShowPostModal(true)}>
                  <FaPlus /> Create Post
                </button>
              </div>

              <div className="ds-posts-feed">
                {posts.length > 0 ? (
                  safeRenderArray(posts, (post) => (
                    <div key={post.id} className="ds-post-card">
                      <div className="ds-post-header">
                        <div className="ds-post-author">
                          <div className="ds-post-avatar">
                            {logoPreview ? (
                              <img src={logoPreview} alt={formData.companyName} />
                            ) : (
                              <div className="ds-avatar-placeholder">
                                {getInitials(formData.companyName)}
                              </div>
                            )}
                          </div>
                          <div className="ds-post-info">
                            <h4>{formData.companyName}</h4>
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ds-post-content">
                        <p>{post.content}</p>
                        {post.image && (
                          <div className="ds-post-media">
                            <img src={post.image} alt="Post" />
                          </div>
                        )}
                      </div>
                      <div className="ds-post-stats">
                        <span>{post.likes || 0} Likes</span>
                        <span>{post.comments || 0} Comments</span>
                      </div>
                      <div className="ds-post-actions">
                        <button 
                          className={`ds-action-btn ${post.liked ? 'liked' : ''}`}
                          onClick={() => handleLikePost(post.id)}
                        >
                          {post.liked ? <FaHeart /> : <FaRegHeart />} Like
                        </button>
                        <button className="ds-action-btn">
                          <FaComment /> Comment
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ds-no-data">
                    <FaFileAlt className="ds-no-data-icon" />
                    <h3>No posts yet</h3>
                    <p>Share updates about your company</p>
                    <button className="ds-create-post-btn" onClick={() => setShowPostModal(true)}>
                      Create First Post
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Followers Tab */}
          {!editing && activeTab === 'followers' && (
            <div className="ds-followers-tab">
              <h2>Followers ({followers.length})</h2>
              <div className="ds-followers-grid">
                {followers.length > 0 ? (
                  safeRenderArray(followers, (follower) => (
                    <div key={follower.id} className="ds-follower-card">
                      <div className="ds-follower-avatar">
                        {follower.avatar ? (
                          <img src={follower.avatar} alt={follower.name} />
                        ) : (
                          <div className="ds-avatar-placeholder">
                            {getInitials(follower.name)}
                          </div>
                        )}
                      </div>
                      <h4>{follower.name}</h4>
                      <p>{follower.role || 'Student'}</p>
                      <button className="ds-view-profile-btn" onClick={() => navigate(`/profile/student/${follower.id}`)}>
                        View Profile
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="ds-no-data">
                    <FaUsers className="ds-no-data-icon" />
                    <h3>No followers yet</h3>
                    <p>Share your company to get followers</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit Profile Form */}
        {editing && (
          <div className="ds-edit-profile">
            <h2>Edit Company Profile</h2>
            
            {/* Basic Information */}
            <div className="ds-edit-section">
              <h3>Basic Information</h3>
              
              <div className="ds-form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label>Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>
                <div className="ds-form-group">
                  <label>Company Size</label>
                  <select name="companySize" value={formData.companySize} onChange={handleInputChange}>
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label>Founded Year</label>
                  <input
                    type="number"
                    name="foundedYear"
                    value={formData.foundedYear}
                    onChange={handleInputChange}
                    placeholder="e.g., 2020"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="ds-form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="ds-form-group">
                <label>Tagline</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="Short catchy description"
                />
              </div>

              <div className="ds-form-group">
                <label>Short Description</label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Brief overview of your company"
                  rows="2"
                />
              </div>

              <div className="ds-form-group">
                <label>Full Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description of your company"
                  rows="4"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="ds-edit-section">
              <h3>Contact Information</h3>
              
              <div className="ds-form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="hr@company.com"
                />
              </div>

              <div className="ds-form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="+94 XX XXX XXXX"
                />
              </div>

              <h4>Address</h4>
              <div className="ds-form-group">
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  placeholder="Street address"
                />
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                </div>
                <div className="ds-form-group">
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    placeholder="Country"
                  />
                </div>
                <div className="ds-form-group">
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleInputChange}
                    placeholder="Zip Code"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="ds-edit-section">
              <h3>Social Media</h3>
              
              <div className="ds-form-group">
                <label>LinkedIn</label>
                <input
                  type="url"
                  name="socialMedia.linkedin"
                  value={formData.socialMedia.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>

              <div className="ds-form-group">
                <label>Twitter</label>
                <input
                  type="url"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div className="ds-form-group">
                <label>Facebook</label>
                <input
                  type="url"
                  name="socialMedia.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div className="ds-form-group">
                <label>Instagram</label>
                <input
                  type="url"
                  name="socialMedia.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="ds-form-actions">
              <button className="ds-cancel-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="ds-save-btn" onClick={handleSubmit} disabled={saving}>
                {saving ? <><FaSpinner className="ds-fa-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        {showPostModal && (
          <div className="ds-modal-overlay" onClick={() => setShowPostModal(false)}>
            <div className="ds-modal" onClick={e => e.stopPropagation()}>
              <div className="ds-modal-header">
                <h3>Create Post</h3>
                <button className="ds-close-btn" onClick={() => setShowPostModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="ds-modal-body">
                <textarea
                  className="ds-post-textarea"
                  placeholder="Share an update about your company..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  rows="4"
                />
                {postImage && (
                  <div className="ds-image-preview">
                    <img src={URL.createObjectURL(postImage)} alt="Preview" />
                    <button onClick={() => setPostImage(null)}>
                      <FaTimes />
                    </button>
                  </div>
                )}
                <div className="ds-post-actions">
                  <label className="ds-media-btn">
                    <FaImage />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPostImage(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    Photo
                  </label>
                </div>
              </div>
              <div className="ds-modal-footer">
                <button className="ds-post-btn" onClick={handleCreatePost} disabled={uploadingPost}>
                  {uploadingPost ? <FaSpinner className="ds-fa-spin" /> : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;