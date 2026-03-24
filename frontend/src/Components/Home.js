import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../Components/context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaBriefcase, 
  FaSearch, 
  FaFileAlt, 
  FaBuilding, 
  FaUsers,
  FaChartLine,
  FaCheckCircle,
  FaStar,
  FaArrowRight,
  FaClock,
  FaMapMarkerAlt,
  FaDollarSign,
  FaRocket,
  FaShieldAlt,
  FaHandshake,
  FaGlobe,
  FaHeart,
  FaQuoteLeft,
  FaQuoteRight,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaGithub,
  FaUserGraduate,
  FaRegHeart,
  FaRegComment,
  FaRegShareSquare,
  FaImage,
  FaVideo,
  FaSmile,
  FaEllipsisH,
  FaSpinner,
  FaUserPlus,
  FaEye,
  FaFire,
  FaNewspaper,
  FaRegClock,
  FaGraduationCap,
  FaTimes,
  FaLink,
  FaUserCircle
} from 'react-icons/fa';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for feed and posts
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState('following'); // following, trending, latest
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // State for suggestions
  const [suggestedCompanies, setSuggestedCompanies] = useState([]);
  const [suggestedStudents, setSuggestedStudents] = useState([]);
  
  // State for stats
  const [stats, setStats] = useState({
    jobs: 0,
    companies: 0,
    students: 0,
    placements: 0,
    userStats: {
      posts: 0,
      followers: 0,
      following: 0
    }
  });

  // State for featured jobs
  const [featuredJobs, setFeaturedJobs] = useState([]);
  
  // State for post creation modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [postMedia, setPostMedia] = useState([]);
  const [postVisibility, setPostVisibility] = useState('public');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Simulate data loading
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFeed();
      fetchSuggestions();
      fetchUserStats();
    }
  }, [user, feedType, page]);

  const fetchInitialData = () => {
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        jobs: 10000,
        companies: 5000,
        students: 50000,
        placements: 9500
      }));

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
    }, 1000);
  };

  const fetchFeed = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        // For non-logged in users, show public feed
        generateMockFeed();
        return;
      }

      let endpoint = '';
      if (user.role === 'student') {
        endpoint = '/students/feed';
      } else if (user.role === 'company') {
        endpoint = '/companies/feed';
      } else {
        endpoint = '/posts/feed';
      }

      if (feedType === 'trending') {
        endpoint = '/posts/trending';
      } else if (feedType === 'latest') {
        endpoint = '/posts/feed?sort=latest';
      }

      const response = await API.get(endpoint, {
        params: { page, limit: 10 }
      });

      if (response.data.success) {
        if (page === 1) {
          setPosts(response.data.posts || []);
        } else {
          setPosts(prev => [...prev, ...(response.data.posts || [])]);
        }
        setHasMore(response.data.posts?.length === 10);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
      generateMockFeed();
    } finally {
      setLoading(false);
    }
  };

  const generateMockFeed = () => {
    const mockPosts = [
      {
        _id: '1',
        userId: {
          _id: '101',
          name: 'Tech Corp',
          profilePicture: null,
          role: 'company'
        },
        userType: 'company',
        content: 'We are hiring! Join our team of innovative engineers. Multiple positions available for software developers, data scientists, and product managers. Apply now! 🚀',
        media: [{
          type: 'image',
          url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        }],
        likes: [{ userId: '1' }, { userId: '2' }],
        comments: [
          {
            _id: 'c1',
            userId: { name: 'John Doe', profilePicture: null },
            content: 'Interested! How to apply?',
            createdAt: new Date().toISOString()
          }
        ],
        shares: 5,
        createdAt: new Date().toISOString(),
        visibility: 'public',
        isLiked: false
      },
      {
        _id: '2',
        userId: {
          _id: '102',
          name: 'Sarah Johnson',
          profilePicture: null,
          role: 'student'
        },
        userType: 'student',
        content: 'Excited to announce that I have completed my AWS Certification! Ready for new opportunities in cloud computing. ☁️ #AWS #CloudComputing #CareerGrowth',
        media: [{
          type: 'image',
          url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
        }],
        likes: [{ userId: '3' }, { userId: '4' }, { userId: '5' }],
        comments: [],
        shares: 2,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        visibility: 'public',
        isLiked: true
      },
      {
        _id: '3',
        userId: {
          _id: '103',
          name: 'InnovateTech',
          profilePicture: null,
          role: 'company'
        },
        userType: 'company',
        content: 'Throwback to our annual tech conference! Great to see so many talented developers and innovative ideas. Stay tuned for next year\'s event! 🎉',
        media: [
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          },
          {
            type: 'image',
            url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
          }
        ],
        likes: [{ userId: '6' }, { userId: '7' }],
        comments: [],
        shares: 8,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        visibility: 'public',
        isLiked: false
      }
    ];
    
    setPosts(mockPosts);
    setHasMore(false);
    setLoading(false);
  };

  const fetchSuggestions = async () => {
    try {
      if (user?.role === 'student') {
        const response = await API.get('/students/search/companies', {
          params: { limit: 5 }
        });
        if (response.data.success) {
          setSuggestedCompanies(response.data.companies);
        }
      } else if (user?.role === 'company') {
        const response = await API.get('/companies/search/students', {
          params: { limit: 5 }
        });
        if (response.data.success) {
          setSuggestedStudents(response.data.students);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Mock suggestions
      if (user?.role === 'student') {
        setSuggestedCompanies([
          { 
            _id: 'c1', 
            companyName: 'Tech Corp', 
            industry: 'Software', 
            logo: null, 
            isFollowing: false,
            followersCount: 1200
          },
          { 
            _id: 'c2', 
            companyName: 'InnovateTech', 
            industry: 'AI/ML', 
            logo: null, 
            isFollowing: false,
            followersCount: 850
          },
          { 
            _id: 'c3', 
            companyName: 'DataWorks', 
            industry: 'Data Science', 
            logo: null, 
            isFollowing: false,
            followersCount: 2100
          },
          { 
            _id: 'c4', 
            companyName: 'Creative Studio', 
            industry: 'Design', 
            logo: null, 
            isFollowing: false,
            followersCount: 650
          },
          { 
            _id: 'c5', 
            companyName: 'Growth Inc', 
            industry: 'Marketing', 
            logo: null, 
            isFollowing: false,
            followersCount: 430
          }
        ]);
      } else if (user?.role === 'company') {
        setSuggestedStudents([
          { 
            _id: 's1', 
            name: 'John Doe', 
            skills: ['React', 'Node.js', 'MongoDB'], 
            profilePicture: null, 
            isFollowing: false,
            education: 'BSc Computer Science'
          },
          { 
            _id: 's2', 
            name: 'Sarah Johnson', 
            skills: ['AWS', 'Python', 'Docker'], 
            profilePicture: null, 
            isFollowing: false,
            education: 'MSc Data Science'
          },
          { 
            _id: 's3', 
            name: 'Mike Chen', 
            skills: ['Java', 'Spring', 'Microservices'], 
            profilePicture: null, 
            isFollowing: false,
            education: 'BSc Software Engineering'
          },
          { 
            _id: 's4', 
            name: 'Priya Kumar', 
            skills: ['UI/UX', 'Figma', 'Adobe XD'], 
            profilePicture: null, 
            isFollowing: false,
            education: 'BDes Design'
          },
          { 
            _id: 's5', 
            name: 'Alex Thompson', 
            skills: ['Marketing', 'SEO', 'Content Strategy'], 
            profilePicture: null, 
            isFollowing: false,
            education: 'MBA Marketing'
          }
        ]);
      }
    }
  };

  const fetchUserStats = async () => {
    try {
      if (user?.role === 'student') {
        const response = await API.get('/students/profile');
        if (response.data.success) {
          setStats(prev => ({
            ...prev,
            userStats: {
              posts: response.data.student.posts?.length || 0,
              followers: response.data.student.followers?.length || 0,
              following: response.data.student.following?.length || 0
            }
          }));
        }
      } else if (user?.role === 'company') {
        const response = await API.get('/companies/profile');
        if (response.data.success) {
          setStats(prev => ({
            ...prev,
            userStats: {
              posts: response.data.company.posts?.length || 0,
              followers: response.data.company.followersCount || 0,
              following: response.data.company.followingCount || 0
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await API.put(`/posts/${postId}/like`);
      if (response.data.success) {
        setPosts(posts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                likes: response.data.isLiked 
                  ? [...post.likes, { userId: user?.id }]
                  : post.likes.filter(like => like.userId !== user?.id),
                isLiked: response.data.isLiked
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Optimistic update
      setPosts(posts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: post.isLiked 
                ? post.likes.filter(like => like.userId !== user?.id)
                : [...post.likes, { userId: user?.id }],
              isLiked: !post.isLiked 
            }
          : post
      ));
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && postMedia.length === 0) {
      toast.error('Please add content to your post');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('content', newPost);
      formData.append('visibility', postVisibility);
      
      postMedia.forEach((media, index) => {
        if (media.file) {
          formData.append('media', media.file);
        }
      });

      const response = await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setPosts([response.data.post, ...posts]);
        setNewPost('');
        setPostMedia([]);
        setPostVisibility('public');
        setShowPostModal(false);
        toast.success('Post created successfully!');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const handleFollow = async (userId, userType) => {
    try {
      let endpoint = '';
      if (user?.role === 'student' && userType === 'company') {
        endpoint = `/students/follow-company/${userId}`;
      } else if (user?.role === 'company' && userType === 'student') {
        endpoint = `/companies/follow/${userId}`;
      }

      const response = await API.post(endpoint);
      
      if (response.data.success) {
        if (userType === 'company') {
          setSuggestedCompanies(prev => 
            prev.map(company => 
              company._id === userId 
                ? { ...company, isFollowing: true }
                : company
            )
          );
        } else {
          setSuggestedStudents(prev => 
            prev.map(student => 
              student._id === userId 
                ? { ...student, isFollowing: true }
                : student
            )
          );
        }
        toast.success('Followed successfully!');
        
        // Update following count
        setStats(prev => ({
          ...prev,
          userStats: {
            ...prev.userStats,
            following: prev.userStats.following + 1
          }
        }));
      }
    } catch (error) {
      console.error('Error following:', error);
      toast.error('Failed to follow');
    }
  };

  const handleUnfollow = async (userId, userType) => {
    try {
      let endpoint = '';
      if (user?.role === 'student' && userType === 'company') {
        endpoint = `/students/follow-company/${userId}`;
      } else if (user?.role === 'company' && userType === 'student') {
        endpoint = `/companies/follow/${userId}`;
      }

      const response = await API.delete(endpoint);
      
      if (response.data.success) {
        if (userType === 'company') {
          setSuggestedCompanies(prev => 
            prev.map(company => 
              company._id === userId 
                ? { ...company, isFollowing: false }
                : company
            )
          );
        } else {
          setSuggestedStudents(prev => 
            prev.map(student => 
              student._id === userId 
                ? { ...student, isFollowing: false }
                : student
            )
          );
        }
        toast.success('Unfollowed successfully!');
        
        // Update following count
        setStats(prev => ({
          ...prev,
          userStats: {
            ...prev.userStats,
            following: Math.max(0, prev.userStats.following - 1)
          }
        }));
      }
    } catch (error) {
      console.error('Error unfollowing:', error);
      toast.error('Failed to unfollow');
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      let endpoint = '';
      if (user?.role === 'student') {
        endpoint = `/students/search/companies?q=${query}`;
      } else if (user?.role === 'company') {
        endpoint = `/companies/search/students?q=${query}`;
      } else {
        // For non-logged in users, search public companies
        endpoint = `/companies/public?search=${query}`;
      }

      const response = await API.get(endpoint);
      if (response.data.success) {
        setSearchResults(response.data.companies || response.data.students || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const getProfileLink = (userData) => {
    if (userData.role === 'student') {
      return `/profile/student/${userData._id}`;
    } else if (userData.role === 'company') {
      return `/profile/company/${userData._id}`;
    }
    return '#';
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
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>
              Find Your <span className="gradient-text">Dream Job</span> Today
            </h1>
            <p className="hero-subtitle">
              Connect with thousands of employers and find the perfect opportunity that matches your skills and aspirations.
            </p>
            
            <div className="hero-buttons">
              {user ? (
                <Link to={user.role === 'student' ? '/student/jobs' : '/company/dashboard'} className="btn btn-primary btn-lg">
                  Go to Dashboard <FaArrowRight />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started <FaArrowRight />
                  </Link>
                  <Link to="/about" className="btn btn-outline btn-lg">
                    Learn More
                  </Link>
                </>
              )}
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">{stats.jobs.toLocaleString()}+</div>
                <div className="stat-label">Active Jobs</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.companies.toLocaleString()}+</div>
                <div className="stat-label">Companies</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.students.toLocaleString()}+</div>
                <div className="stat-label">Students</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.placements.toLocaleString()}+</div>
                <div className="stat-label">Placements</div>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Hero" />
          </div>
        </div>
      </section>

      {/* Main Content with Feed - Only visible when logged in */}
      {user && (
        <section className="main-feed-section">
          <div className="container">
            <div className="feed-layout">
              {/* Left Sidebar - User Profile & Stats */}
              <div className="feed-sidebar left-sidebar">
                <div className="profile-card">
                  <div className="profile-cover"></div>
                  <div className="profile-info">
                    <div className="profile-avatar">
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {getInitials(user?.name)}
                        </div>
                      )}
                    </div>
                    <h3>{user?.name}</h3>
                    <p className="profile-role">
                      {user?.role === 'student' ? <FaUserGraduate /> : <FaBuilding />}
                      {user?.role === 'student' ? 'Student' : 'Company'}
                    </p>
                    <Link to={user?.role === 'student' ? '/profile' : '/company/profile'} className="view-profile-btn">
                      View Profile
                    </Link>
                  </div>
                  <div className="profile-stats">
                    <div className="stat-item">
                      <span className="stat-value">{stats.userStats.posts}</span>
                      <span className="stat-label">Posts</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{stats.userStats.followers}</span>
                      <span className="stat-label">Followers</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{stats.userStats.following}</span>
                      <span className="stat-label">Following</span>
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="suggestions-card">
                  <h4>
                    {user?.role === 'student' ? 'Suggested Companies' : 'Suggested Students'}
                  </h4>
                  <div className="suggestions-list">
                    {user?.role === 'student' 
                      ? suggestedCompanies.map(company => (
                          <div key={company._id} className="suggestion-item">
                            <div className="suggestion-avatar">
                              {company.logo ? (
                                <img src={company.logo} alt={company.companyName} />
                              ) : (
                                <div className="avatar-placeholder small">
                                  {getInitials(company.companyName)}
                                </div>
                              )}
                            </div>
                            <div className="suggestion-info">
                              <h5>{company.companyName}</h5>
                              <p>{company.industry}</p>
                              <small>{company.followersCount} followers</small>
                            </div>
                            <button 
                              className={`follow-btn ${company.isFollowing ? 'following' : ''}`}
                              onClick={() => company.isFollowing 
                                ? handleUnfollow(company._id, 'company')
                                : handleFollow(company._id, 'company')
                              }
                            >
                              {company.isFollowing ? 'Following' : 'Follow'}
                            </button>
                          </div>
                        ))
                      : suggestedStudents.map(student => (
                          <div key={student._id} className="suggestion-item">
                            <div className="suggestion-avatar">
                              {student.profilePicture ? (
                                <img src={student.profilePicture} alt={student.name} />
                              ) : (
                                <div className="avatar-placeholder small">
                                  {getInitials(student.name)}
                                </div>
                              )}
                            </div>
                            <div className="suggestion-info">
                              <h5>{student.name}</h5>
                              <p>{student.skills?.slice(0, 2).join(', ')}</p>
                              <small>{student.education}</small>
                            </div>
                            <button 
                              className={`follow-btn ${student.isFollowing ? 'following' : ''}`}
                              onClick={() => student.isFollowing 
                                ? handleUnfollow(student._id, 'student')
                                : handleFollow(student._id, 'student')
                              }
                            >
                              {student.isFollowing ? 'Following' : 'Follow'}
                            </button>
                          </div>
                        ))
                    }
                  </div>
                </div>

                {/* Trending Topics */}
                <div className="trending-card">
                  <h4>Trending Topics</h4>
                  <div className="trending-list">
                    <div className="trending-item">
                      <span className="trending-tag">#Hiring</span>
                      <span className="trending-count">1.2k posts</span>
                    </div>
                    <div className="trending-item">
                      <span className="trending-tag">#TechJobs</span>
                      <span className="trending-count">856 posts</span>
                    </div>
                    <div className="trending-item">
                      <span className="trending-tag">#RemoteWork</span>
                      <span className="trending-count">654 posts</span>
                    </div>
                    <div className="trending-item">
                      <span className="trending-tag">#Internship</span>
                      <span className="trending-count">432 posts</span>
                    </div>
                    <div className="trending-item">
                      <span className="trending-tag">#CareerGrowth</span>
                      <span className="trending-count">321 posts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Feed */}
              <div className="feed-main">
                {/* Create Post */}
                <div className="create-post-card" onClick={() => setShowPostModal(true)}>
                  <div className="create-post-avatar">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder small">
                        {getInitials(user?.name)}
                      </div>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
                    readOnly
                  />
                  <div className="create-post-icons">
                    <FaImage />
                    <FaVideo />
                    <FaSmile />
                  </div>
                </div>

                {/* Feed Tabs */}
                <div className="feed-tabs">
                  <button 
                    className={`tab-btn ${feedType === 'following' ? 'active' : ''}`}
                    onClick={() => {
                      setFeedType('following');
                      setPage(1);
                    }}
                  >
                    <FaUsers /> Following
                  </button>
                  <button 
                    className={`tab-btn ${feedType === 'trending' ? 'active' : ''}`}
                    onClick={() => {
                      setFeedType('trending');
                      setPage(1);
                    }}
                  >
                    <FaFire /> Trending
                  </button>
                  <button 
                    className={`tab-btn ${feedType === 'latest' ? 'active' : ''}`}
                    onClick={() => {
                      setFeedType('latest');
                      setPage(1);
                    }}
                  >
                    <FaClock /> Latest
                  </button>
                </div>

                {/* Posts Feed */}
                <div className="posts-feed">
                  {loading && page === 1 ? (
                    <div className="loading-spinner">
                      <FaSpinner className="fa-spin" />
                      <p>Loading posts...</p>
                    </div>
                  ) : (
                    <>
                      {posts.map(post => (
                        <div key={post._id} className="post-card">
                          <div className="post-header">
                            <div className="post-author">
                              <Link to={getProfileLink(post.userId)} className="post-author-avatar">
                                {post.userId?.profilePicture ? (
                                  <img src={post.userId.profilePicture} alt={post.userId.name} />
                                ) : (
                                  <div className="avatar-placeholder small">
                                    {getInitials(post.userId?.name)}
                                  </div>
                                )}
                              </Link>
                              <div className="post-author-info">
                                <Link to={getProfileLink(post.userId)} className="post-author-name">
                                  {post.userId?.name}
                                </Link>
                                <span className="post-author-type">
                                  {post.userType === 'student' ? <FaUserGraduate /> : <FaBuilding />}
                                  {post.userType === 'student' ? 'Student' : 'Company'}
                                </span>
                                <span className="post-time">
                                  <FaRegClock /> {formatDate(post.createdAt)}
                                </span>
                              </div>
                            </div>
                            <button className="post-menu-btn">
                              <FaEllipsisH />
                            </button>
                          </div>

                          <div className="post-content">
                            <p>{post.content}</p>
                            
                            {post.media && post.media.length > 0 && (
                              <div className={`post-media ${post.media.length > 1 ? 'multiple' : ''}`}>
                                {post.media.map((media, index) => (
                                  <div key={index} className="media-item">
                                    {media.type === 'image' ? (
                                      <img src={media.url} alt={`Post media ${index + 1}`} />
                                    ) : media.type === 'video' ? (
                                      <video controls>
                                        <source src={media.url} type="video/mp4" />
                                      </video>
                                    ) : (
                                      <div className="document-placeholder">
                                        <FaFileAlt />
                                        <span>Document {index + 1}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="post-stats">
                            <span>{post.likes?.length || 0} Likes</span>
                            <span>{post.comments?.length || 0} Comments</span>
                            <span>{post.shares || 0} Shares</span>
                          </div>

                          <div className="post-actions">
                            <button 
                              className={`action-btn ${post.isLiked ? 'liked' : ''}`}
                              onClick={() => handleLike(post._id)}
                            >
                              {post.isLiked ? <FaHeart /> : <FaRegHeart />}
                              Like
                            </button>
                            <button className="action-btn">
                              <FaRegComment /> Comment
                            </button>
                            <button className="action-btn">
                              <FaRegShareSquare /> Share
                            </button>
                          </div>

                          {post.comments && post.comments.length > 0 && (
                            <div className="post-comments">
                              {post.comments.slice(0, 2).map(comment => (
                                <div key={comment._id} className="comment-item">
                                  <div className="comment-avatar">
                                    {comment.userId?.profilePicture ? (
                                      <img src={comment.userId.profilePicture} alt={comment.userId.name} />
                                    ) : (
                                      <div className="avatar-placeholder tiny">
                                        {getInitials(comment.userId?.name)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="comment-content">
                                    <strong>{comment.userId?.name}</strong>
                                    <p>{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                              {post.comments.length > 2 && (
                                <button className="view-more-comments">
                                  View all {post.comments.length} comments
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {hasMore && (
                        <div className="load-more">
                          <button onClick={loadMore} disabled={loading}>
                            {loading ? <FaSpinner className="fa-spin" /> : 'Load More'}
                          </button>
                        </div>
                      )}

                      {posts.length === 0 && !loading && (
                        <div className="no-posts">
                          <FaNewspaper />
                          <h3>No posts yet</h3>
                          <p>Follow more {user?.role === 'student' ? 'companies' : 'students'} to see their posts here</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Sidebar - Search & Trends */}
              <div className="feed-sidebar right-sidebar">
                {/* Search */}
                <div className="search-card">
                  <div className="search-box">
                    <FaSearch />
                    <input
                      type="text"
                      placeholder={`Search ${user?.role === 'student' ? 'companies' : 'students'}...`}
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => setShowSearch(true)}
                      onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                    />
                    {searching && <FaSpinner className="fa-spin" />}
                  </div>
                  
                  {showSearch && searchQuery.length >= 2 && (
                    <div className="search-results">
                      {searchResults.length > 0 ? (
                        searchResults.map(result => (
                          <Link 
                            key={result._id} 
                            to={user?.role === 'student' 
                              ? `/profile/company/${result._id}`
                              : `/profile/student/${result._id}`
                            }
                            className="search-result-item"
                          >
                            <div className="result-avatar">
                              {result.logo || result.profilePicture ? (
                                <img src={result.logo || result.profilePicture} alt={result.companyName || result.name} />
                              ) : (
                                <div className="avatar-placeholder tiny">
                                  {getInitials(result.companyName || result.name)}
                                </div>
                              )}
                            </div>
                            <div className="result-info">
                              <h5>{result.companyName || result.name}</h5>
                              <p>{result.industry || result.skills?.slice(0, 2).join(', ')}</p>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className="no-results">No results found</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Upcoming Events */}
                <div className="events-card">
                  <h4>Upcoming Events</h4>
                  <div className="events-list">
                    <div className="event-item">
                      <div className="event-date">
                        <span className="event-day">15</span>
                        <span className="event-month">MAR</span>
                      </div>
                      <div className="event-info">
                        <h5>Tech Career Fair 2024</h5>
                        <p>Virtual Event</p>
                      </div>
                    </div>
                    <div className="event-item">
                      <div className="event-date">
                        <span className="event-day">22</span>
                        <span className="event-month">MAR</span>
                      </div>
                      <div className="event-info">
                        <h5>Resume Workshop</h5>
                        <p>Online Workshop</p>
                      </div>
                    </div>
                    <div className="event-item">
                      <div className="event-date">
                        <span className="event-day">05</span>
                        <span className="event-month">APR</span>
                      </div>
                      <div className="event-info">
                        <h5>Networking Mixer</h5>
                        <p>In-Person Event</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Alerts */}
                <div className="job-alerts-card">
                  <h4>Job Alerts</h4>
                  <p>Get notified about new jobs matching your profile</p>
                  <button className="btn btn-primary btn-block">
                    Create Job Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section - Show for all users */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose JobPortal?</h2>
            <p>We provide the best tools and features to help you succeed</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="jobs-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Jobs</h2>
            <p>Discover the latest opportunities from top companies</p>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div className="jobs-grid">
                {featuredJobs.map((job) => (
                  <div key={job.id} className="job-card">
                    <div className="job-card-header">
                      <div className="company-logo">
                        {job.logo ? (
                          <img src={job.logo} alt={job.company} />
                        ) : (
                          <div className="logo-placeholder">
                            {job.company.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="job-title">
                        <h3>{job.title}</h3>
                        <p className="company-name">{job.company}</p>
                      </div>
                    </div>

                    <div className="job-details">
                      <div className="job-detail">
                        <FaMapMarkerAlt />
                        <span>{job.location}</span>
                      </div>
                      <div className="job-detail">
                        <FaBriefcase />
                        <span>{job.type}</span>
                      </div>
                      <div className="job-detail">
                        <FaDollarSign />
                        <span>{job.salary}</span>
                      </div>
                      <div className="job-detail">
                        <FaClock />
                        <span>{job.posted}</span>
                      </div>
                    </div>

                    <div className="job-card-footer">
                      <Link to={`/job/${job.id}`} className="btn btn-outline-primary btn-sm">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="view-more">
                <Link to="/jobs" className="btn btn-outline-primary">
                  View All Jobs <FaArrowRight />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Three simple steps to your dream job</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">
                <FaUserGraduate />
              </div>
              <h3>Create Account</h3>
              <p>Sign up as a student or company in minutes with your email or social media.</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">
                <FaFileAlt />
              </div>
              <h3>Build Profile</h3>
              <p>Complete your profile with education, experience, skills, and upload your CV.</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">
                <FaCheckCircle />
              </div>
              <h3>Start Applying</h3>
              <p>Find and apply to jobs that match your profile with one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Users Say</h2>
            <p>Success stories from our community</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="quote-icon">
                  <FaQuoteLeft />
                </div>
                <p className="testimonial-content">{testimonial.content}</p>
                <div className="testimonial-rating">
                  {renderStars(testimonial.rating)}
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonial.image ? (
                      <img src={testimonial.image} alt={testimonial.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {testimonial.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
                <div className="quote-icon-end">
                  <FaQuoteRight />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Companies Section */}
      <section className="companies-section">
        <div className="container">
          <div className="section-header">
            <h2>Trusted By Leading Companies</h2>
            <p>Join thousands of companies hiring through JobPortal</p>
          </div>

          <div className="companies-grid">
            {companies.map((company, index) => (
              <div key={index} className="company-card">
                {company.logo ? (
                  <img src={company.logo} alt={company.name} />
                ) : (
                  <div className="company-logo-placeholder">
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
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to Start Your Journey?</h2>
            <p>Join thousands of professionals and companies already using JobPortal</p>
            <div className="cta-buttons">
              {user ? (
                <Link to={user.role === 'student' ? '/student/dashboard' : '/company/dashboard'} className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started Now
                  </Link>
                  <Link to="/contact" className="btn btn-outline-light btn-lg">
                    Contact Us
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div className="modal create-post-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Post</h3>
              <button className="close-btn" onClick={() => setShowPostModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="post-author-info">
                <div className="post-author-avatar">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} />
                  ) : (
                    <div className="avatar-placeholder small">
                      {getInitials(user?.name)}
                    </div>
                  )}
                </div>
                <div className="post-author-details">
                  <h4>{user?.name}</h4>
                  <select 
                    value={postVisibility} 
                    onChange={(e) => setPostVisibility(e.target.value)}
                    className="visibility-select"
                  >
                    <option value="public">Public</option>
                    <option value="followers">Followers Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <textarea
                className="post-textarea"
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows="5"
              />

              {postMedia.length > 0 && (
                <div className="media-preview">
                  {postMedia.map((media, index) => (
                    <div key={index} className="media-preview-item">
                      {media.type.startsWith('image/') ? (
                        <img src={media.preview} alt={`Preview ${index}`} />
                      ) : (
                        <video src={media.preview} controls />
                      )}
                      <button 
                        className="remove-media"
                        onClick={() => setPostMedia(prev => prev.filter((_, i) => i !== index))}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="post-media-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const newMedia = files.map(file => ({
                      file,
                      type: file.type,
                      preview: URL.createObjectURL(file)
                    }));
                    setPostMedia(prev => [...prev, ...newMedia]);
                  }}
                  style={{ display: 'none' }}
                />
                
                <button 
                  className="media-action-btn"
                  onClick={() => fileInputRef.current.click()}
                >
                  <FaImage /> Photo/Video
                </button>
                <button className="media-action-btn">
                  <FaSmile /> Feeling
                </button>
                <button className="media-action-btn">
                  <FaLink /> Link
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="post-btn"
                onClick={handleCreatePost}
                disabled={uploading || (!newPost.trim() && postMedia.length === 0)}
              >
                {uploading ? <FaSpinner className="fa-spin" /> : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo">
                <FaBriefcase className="logo-icon" />
                <span>JobPortal</span>
              </div>
              <p>Connecting talented professionals with forward-thinking companies since 2020.</p>
              <div className="social-links">
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

            <div className="footer-col">
              <h4>For Job Seekers</h4>
              <ul>
                <li><Link to="/student/jobs">Browse Jobs</Link></li>
                <li><Link to="/student/cv-manager">CV Manager</Link></li>
                <li><Link to="/student/job-alerts">Job Alerts</Link></li>
                <li><Link to="/student/saved-jobs">Saved Jobs</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>For Employers</h4>
              <ul>
                <li><Link to="/company/post-job">Post a Job</Link></li>
                <li><Link to="/company/manage-jobs">Manage Jobs</Link></li>
                <li><Link to="/company/applicants">Browse Candidates</Link></li>
                <li><Link to="/company/pricing">Pricing</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 JobPortal. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .home-page {
          overflow-x: hidden;
        }

        /* Hero Section */
        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 100px 0;
          position: relative;
          overflow: hidden;
        }

        .hero-section .container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          align-items: center;
        }

        .hero-content h1 {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .gradient-text {
          background: linear-gradient(135deg, #ffd700, #ffa500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.2rem;
          margin-bottom: 30px;
          opacity: 0.95;
        }

        .hero-buttons {
          display: flex;
          gap: 20px;
          margin-bottom: 40px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s;
          cursor: pointer;
          border: none;
        }

        .btn-primary {
          background: white;
          color: #667eea;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .btn-outline {
          background: transparent;
          border: 2px solid white;
          color: white;
        }

        .btn-outline:hover {
          background: white;
          color: #667eea;
        }

        .btn-lg {
          padding: 15px 40px;
          font-size: 1.1rem;
        }

        .hero-stats {
          display: flex;
          gap: 40px;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .hero-image img {
          width: 100%;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        /* Feed Layout */
        .main-feed-section {
          padding: 40px 0;
          background: #f3f4f6;
        }

        .feed-layout {
          display: grid;
          grid-template-columns: 280px 1fr 280px;
          gap: 20px;
        }

        /* Sidebar Cards */
        .feed-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .profile-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .profile-cover {
          height: 80px;
          background: linear-gradient(135deg, #667eea, #764ba2);
        }

        .profile-info {
          padding: 0 20px 20px;
          text-align: center;
          position: relative;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          margin: -40px auto 15px;
          border-radius: 50%;
          border: 3px solid white;
          overflow: hidden;
          background: #667eea;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-weight: 600;
          font-size: 2rem;
        }

        .avatar-placeholder.small {
          font-size: 1rem;
        }

        .avatar-placeholder.tiny {
          font-size: 0.8rem;
        }

        .profile-info h3 {
          margin: 0 0 5px;
          color: #1a202c;
          font-size: 1.2rem;
        }

        .profile-role {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          color: #718096;
          margin-bottom: 15px;
          font-size: 0.9rem;
        }

        .view-profile-btn {
          display: inline-block;
          padding: 8px 20px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 20px;
          font-size: 0.9rem;
          transition: all 0.3s;
        }

        .view-profile-btn:hover {
          background: #5a67d8;
          transform: translateY(-2px);
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid #e2e8f0;
          padding: 15px;
        }

        .profile-stats .stat-item {
          text-align: center;
        }

        .profile-stats .stat-value {
          display: block;
          font-weight: 700;
          color: #1a202c;
        }

        .profile-stats .stat-label {
          font-size: 0.8rem;
          color: #718096;
        }

        /* Suggestions Card */
        .suggestions-card,
        .trending-card,
        .events-card,
        .job-alerts-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .suggestions-card h4,
        .trending-card h4,
        .events-card h4,
        .job-alerts-card h4 {
          margin: 0 0 15px;
          color: #1a202c;
          font-size: 1rem;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .suggestion-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: #667eea;
          flex-shrink: 0;
        }

        .suggestion-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .suggestion-info {
          flex: 1;
          min-width: 0;
        }

        .suggestion-info h5 {
          margin: 0;
          font-size: 0.9rem;
          color: #1a202c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-info p {
          margin: 2px 0;
          font-size: 0.75rem;
          color: #718096;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-info small {
          font-size: 0.7rem;
          color: #a0aec0;
        }

        .follow-btn {
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.3s;
          border: 1px solid;
          flex-shrink: 0;
        }

        .follow-btn:not(.following) {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .follow-btn:not(.following):hover {
          background: #5a67d8;
        }

        .follow-btn.following {
          background: white;
          color: #48bb78;
          border-color: #48bb78;
        }

        /* Trending */
        .trending-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .trending-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .trending-tag {
          color: #667eea;
          font-weight: 500;
          cursor: pointer;
        }

        .trending-tag:hover {
          text-decoration: underline;
        }

        .trending-count {
          color: #a0aec0;
          font-size: 0.85rem;
        }

        /* Main Feed */
        .feed-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Create Post */
        .create-post-card {
          background: white;
          border-radius: 16px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s;
        }

        .create-post-card:hover {
          box-shadow: 0 4px 12px rgba(102,126,234,0.2);
        }

        .create-post-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          background: #667eea;
          flex-shrink: 0;
        }

        .create-post-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .create-post-card input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #e2e8f0;
          border-radius: 30px;
          font-size: 0.95rem;
          background: #f7fafc;
          cursor: pointer;
        }

        .create-post-icons {
          display: flex;
          gap: 15px;
          color: #718096;
        }

        .create-post-icons svg {
          cursor: pointer;
          transition: color 0.3s;
        }

        .create-post-icons svg:hover {
          color: #667eea;
        }

        /* Feed Tabs */
        .feed-tabs {
          display: flex;
          gap: 10px;
          background: white;
          padding: 10px;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .tab-btn {
          flex: 1;
          padding: 10px;
          background: none;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #718096;
          cursor: pointer;
          transition: all 0.3s;
        }

        .tab-btn:hover {
          background: #f7fafc;
          color: #667eea;
        }

        .tab-btn.active {
          background: #667eea;
          color: white;
        }

        /* Posts */
        .posts-feed {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .post-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .post-author {
          display: flex;
          gap: 12px;
        }

        .post-author-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          background: #667eea;
        }

        .post-author-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .post-author-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .post-author-name {
          font-weight: 600;
          color: #1a202c;
          text-decoration: none;
        }

        .post-author-name:hover {
          color: #667eea;
        }

        .post-author-type {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          color: #718096;
        }

        .post-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #a0aec0;
        }

        .post-menu-btn {
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
        }

        .post-menu-btn:hover {
          background: #f7fafc;
          color: #718096;
        }

        .post-content p {
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 15px;
        }

        .post-media {
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 15px;
        }

        .post-media.multiple {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .media-item img,
        .media-item video {
          width: 100%;
          max-height: 400px;
          object-fit: cover;
        }

        .document-placeholder {
          background: #f7fafc;
          padding: 30px;
          text-align: center;
          color: #718096;
        }

        .post-stats {
          display: flex;
          gap: 20px;
          padding: 10px 0;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 10px;
          color: #718096;
          font-size: 0.85rem;
        }

        .post-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .action-btn {
          flex: 1;
          padding: 8px;
          background: none;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #718096;
          cursor: pointer;
          transition: all 0.3s;
        }

        .action-btn:hover {
          background: #f7fafc;
          color: #667eea;
        }

        .action-btn.liked {
          color: #e53e3e;
        }

        .post-comments {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
        }

        .comment-item {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: #667eea;
          flex-shrink: 0;
        }

        .comment-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .comment-content {
          flex: 1;
          background: #f7fafc;
          padding: 8px 12px;
          border-radius: 12px;
        }

        .comment-content strong {
          font-size: 0.85rem;
          color: #1a202c;
          margin-right: 8px;
        }

        .comment-content p {
          margin: 4px 0 0;
          font-size: 0.9rem;
          color: #4a5568;
        }

        .view-more-comments {
          background: none;
          border: none;
          color: #667eea;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 5px;
        }

        .view-more-comments:hover {
          text-decoration: underline;
        }

        /* Right Sidebar */
        .right-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .search-card {
          background: white;
          border-radius: 16px;
          padding: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          position: relative;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f7fafc;
          padding: 8px 15px;
          border-radius: 30px;
        }

        .search-box svg {
          color: #a0aec0;
        }

        .search-box input {
          flex: 1;
          border: none;
          background: none;
          font-size: 0.9rem;
        }

        .search-box input:focus {
          outline: none;
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border-radius: 12px;
          margin-top: 5px;
          padding: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10;
          max-height: 300px;
          overflow-y: auto;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }

        .search-result-item:hover {
          background: #f7fafc;
        }

        .result-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: #667eea;
        }

        .result-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .result-info h5 {
          margin: 0;
          font-size: 0.9rem;
          color: #1a202c;
        }

        .result-info p {
          margin: 2px 0 0;
          font-size: 0.75rem;
          color: #718096;
        }

        .no-results {
          text-align: center;
          color: #a0aec0;
          padding: 10px;
        }

        /* Events */
        .events-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .event-item {
          display: flex;
          gap: 15px;
        }

        .event-date {
          text-align: center;
          min-width: 50px;
        }

        .event-day {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
          line-height: 1;
        }

        .event-month {
          font-size: 0.8rem;
          color: #a0aec0;
        }

        .event-info h5 {
          margin: 0 0 4px;
          color: #1a202c;
          font-size: 0.95rem;
        }

        .event-info p {
          margin: 0;
          color: #718096;
          font-size: 0.85rem;
        }

        /* Job Alerts */
        .job-alerts-card p {
          color: #718096;
          font-size: 0.9rem;
          margin-bottom: 15px;
        }

        .btn-block {
          width: 100%;
        }

        /* Features Section */
        .features-section {
          padding: 80px 0;
          background: white;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .section-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .section-header h2 {
          font-size: 2.5rem;
          color: #333;
          margin-bottom: 10px;
        }

        .section-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }

        .feature-card {
          padding: 40px 30px;
          background: #f7fafc;
          border-radius: 20px;
          text-align: center;
          transition: all 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.1);
        }

        .feature-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: white;
          font-size: 2rem;
        }

        .feature-card h3 {
          font-size: 1.3rem;
          margin-bottom: 15px;
          color: #333;
        }

        .feature-card p {
          color: #666;
          line-height: 1.6;
        }

        /* Jobs Section */
        .jobs-section {
          padding: 80px 0;
          background: #f7fafc;
        }

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-bottom: 40px;
        }

        .job-card {
          background: white;
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }

        .job-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(102, 126, 234, 0.15);
        }

        .job-card-header {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .company-logo {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          overflow: hidden;
        }

        .logo-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .job-title h3 {
          font-size: 1.1rem;
          margin-bottom: 5px;
          color: #333;
        }

        .company-name {
          color: #667eea;
          font-weight: 500;
        }

        .job-details {
          margin-bottom: 20px;
        }

        .job-detail {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          color: #666;
          font-size: 0.95rem;
        }

        .job-detail svg {
          color: #667eea;
        }

        .btn-outline-primary {
          background: transparent;
          border: 1px solid #667eea;
          color: #667eea;
          padding: 8px 16px;
          border-radius: 20px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s;
        }

        .btn-outline-primary:hover {
          background: #667eea;
          color: white;
        }

        .btn-sm {
          font-size: 0.9rem;
        }

        .view-more {
          text-align: center;
        }

        /* How It Works */
        .how-it-works {
          padding: 80px 0;
          background: white;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }

        .step-card {
          text-align: center;
          padding: 40px 30px;
          background: #f7fafc;
          border-radius: 20px;
          position: relative;
        }

        .step-number {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin: 0 auto 20px;
        }

        .step-icon {
          font-size: 2.5rem;
          color: #667eea;
          margin-bottom: 20px;
        }

        .step-card h3 {
          font-size: 1.3rem;
          margin-bottom: 15px;
          color: #333;
        }

        .step-card p {
          color: #666;
          line-height: 1.6;
        }

        /* Testimonials Section */
        .testimonials-section {
          padding: 80px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .testimonials-section .section-header h2,
        .testimonials-section .section-header p {
          color: white;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }

        .testimonial-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 40px 30px;
          border-radius: 20px;
          position: relative;
        }

        .quote-icon {
          color: rgba(255, 255, 255, 0.2);
          font-size: 2rem;
          margin-bottom: 20px;
        }

        .testimonial-content {
          font-size: 1rem;
          line-height: 1.8;
          margin-bottom: 20px;
          font-style: italic;
        }

        .testimonial-rating {
          margin-bottom: 20px;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .author-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
        }

        .author-info h4 {
          font-size: 1rem;
          margin-bottom: 5px;
        }

        .author-info p {
          font-size: 0.85rem;
          opacity: 0.9;
        }

        .quote-icon-end {
          text-align: right;
          color: rgba(255, 255, 255, 0.2);
          font-size: 2rem;
          margin-top: 20px;
        }

        /* Companies Section */
        .companies-section {
          padding: 80px 0;
          background: white;
        }

        .companies-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 30px;
          align-items: center;
        }

        .company-card {
          text-align: center;
        }

        .company-logo-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #667eea;
        }

        .company-logo-placeholder svg {
          font-size: 2rem;
        }

        .company-logo-placeholder span {
          font-size: 0.9rem;
          color: #666;
        }

        /* CTA Section */
        .cta-section {
          padding: 80px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .cta-card {
          text-align: center;
          color: white;
        }

        .cta-card h2 {
          font-size: 2.5rem;
          margin-bottom: 15px;
        }

        .cta-card p {
          font-size: 1.1rem;
          margin-bottom: 30px;
          opacity: 0.95;
        }

        .cta-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
        }

        .btn-outline-light {
          background: transparent;
          border: 2px solid white;
          color: white;
        }

        .btn-outline-light:hover {
          background: white;
          color: #667eea;
        }

        /* Footer */
        .footer {
          background: #1a202c;
          color: white;
          padding: 80px 0 20px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 50px;
          margin-bottom: 50px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .footer-logo .logo-icon {
          color: #667eea;
        }

        .footer-col p {
          color: #a0aec0;
          line-height: 1.8;
          margin-bottom: 20px;
        }

        .social-links {
          display: flex;
          gap: 15px;
        }

        .social-links a {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.3s;
        }

        .social-links a:hover {
          background: #667eea;
          transform: translateY(-3px);
        }

        .footer-col h4 {
          font-size: 1.1rem;
          margin-bottom: 20px;
        }

        .footer-col ul {
          list-style: none;
          padding: 0;
        }

        .footer-col ul li {
          margin-bottom: 10px;
        }

        .footer-col ul li a {
          color: #a0aec0;
          text-decoration: none;
          transition: color 0.3s;
        }

        .footer-col ul li a:hover {
          color: #667eea;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #2d3748;
          color: #a0aec0;
        }

        /* Loading Spinner */
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          color: #667eea;
        }

        .loading-spinner svg {
          font-size: 2rem;
          margin-bottom: 15px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .fa-spin {
          animation: spin 1s linear infinite;
        }

        /* Load More */
        .load-more {
          text-align: center;
          padding: 20px;
        }

        .load-more button {
          padding: 10px 30px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 30px;
          color: #667eea;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .load-more button:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .load-more button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* No Posts */
        .no-posts {
          text-align: center;
          padding: 50px;
          background: white;
          border-radius: 16px;
          color: #a0aec0;
        }

        .no-posts svg {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .no-posts h3 {
          margin: 0 0 10px;
          color: #718096;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          color: #1a202c;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #a0aec0;
          padding: 5px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: #f7fafc;
          color: #718096;
        }

        .modal-body {
          padding: 20px;
        }

        .post-author-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
        }

        .post-author-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          background: #667eea;
        }

        .post-author-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .post-author-details h4 {
          margin: 0 0 5px;
          color: #1a202c;
        }

        .visibility-select {
          padding: 5px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.85rem;
          color: #718096;
          background: white;
        }

        .post-textarea {
          width: 100%;
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          resize: none;
          margin-bottom: 15px;
        }

        .post-textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .media-preview {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .media-preview-item {
          position: relative;
          aspect-ratio: 16/9;
          border-radius: 8px;
          overflow: hidden;
        }

        .media-preview-item img,
        .media-preview-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-media {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .remove-media:hover {
          background: rgba(0,0,0,0.7);
        }

        .post-media-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .media-action-btn {
          flex: 1;
          padding: 10px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #718096;
          cursor: pointer;
          transition: all 0.3s;
        }

        .media-action-btn:hover {
          background: #edf2f7;
          color: #667eea;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .post-btn {
          width: 100%;
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .post-btn:hover {
          background: #5a67d8;
        }

        .post-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .feed-layout {
            grid-template-columns: 250px 1fr 250px;
          }
        }

        @media (max-width: 1024px) {
          .hero-section .container {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero-stats {
            justify-content: center;
          }

          .feed-layout {
            grid-template-columns: 1fr;
          }

          .feed-sidebar {
            display: none;
          }

          .features-grid,
          .jobs-grid,
          .steps-grid,
          .testimonials-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .companies-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 2.5rem;
          }

          .hero-buttons {
            flex-direction: column;
          }

          .hero-stats {
            flex-wrap: wrap;
            gap: 20px;
          }

          .features-grid,
          .jobs-grid,
          .steps-grid,
          .testimonials-grid {
            grid-template-columns: 1fr;
          }

          .companies-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .footer-grid {
            grid-template-columns: 1fr;
          }

          .cta-buttons {
            flex-direction: column;
          }

          .section-header h2 {
            font-size: 2rem;
          }

          .feed-tabs {
            flex-wrap: wrap;
          }

          .post-actions {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;