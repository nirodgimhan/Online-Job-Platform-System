import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGraduationCap, FaBriefcase, FaCode, FaLanguage, FaCertificate,
  FaGithub, FaLinkedin, FaGlobe, FaTwitter, FaSave, FaEdit, FaTimes, FaPlus, FaTrash, FaCheckCircle,
  FaCalendarAlt, FaFileAlt, FaCamera, FaSpinner, FaMapPin, FaCalendar, FaHeart, FaRegHeart, FaComment,
  FaImage, FaExternalLinkAlt, FaEye, FaUserPlus, FaUserCheck, FaTrophy, FaRocket, FaFilePdf, FaDownload, FaUpload
} from 'react-icons/fa';

const StudentProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const cvInputRef = useRef(null);
  
  // State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [missingFields, setMissingFields] = useState([]);
  
  // New post states
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [uploadingPost, setUploadingPost] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    summary: '',
    education: [],
    experience: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
    achievements: [],
    portfolio: '',
    phoneNumber: '',
    address: { street: '', city: '', state: '', country: '', zipCode: '' },
    socialLinks: { linkedin: '', github: '', portfolio: '', twitter: '' },
    cv: { url: '', filename: '', uploadedAt: null }
  });

  // Preview URLs
  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // New entry forms
  const [newEducation, setNewEducation] = useState({ degree: '', institution: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '', description: '' });
  const [newExperience, setNewExperience] = useState({ jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' });
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate', yearsOfExperience: '' });
  const [newLanguage, setNewLanguage] = useState({ language: '', proficiency: 'Conversational', certification: '' });
  const [newCertification, setNewCertification] = useState({ name: '', issuingOrganization: '', issueDate: '', expirationDate: '', credentialId: '', credentialUrl: '' });
  const [newProject, setNewProject] = useState({ title: '', description: '', url: '', technologies: [], startDate: '', endDate: '', current: false });
  const [newAchievement, setNewAchievement] = useState({ title: '', description: '', date: '', organization: '', type: 'award' });

  // UI States
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showLanguageForm, setShowLanguageForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingType, setEditingType] = useState(null);

  const safeRenderArray = (array, renderFn) => {
    if (!array || !Array.isArray(array)) return null;
    return array.map((item, index) => {
      try { return renderFn(item, index); } catch (error) { return null; }
    });
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    fetchStats();
  }, []);

  useEffect(() => {
    calculateProfileCompleteness();
  }, [formData]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await API.get('/students/profile');
      if (response.data.success) {
        const studentData = response.data.student;
        setProfile(studentData);
        setFormData({
          summary: studentData.summary || '',
          education: studentData.education || [],
          experience: studentData.experience || [],
          skills: studentData.skills || [],
          languages: studentData.languages || [],
          certifications: studentData.certifications || [],
          projects: studentData.projects || [],
          achievements: studentData.achievements || [],
          portfolio: studentData.portfolio || '',
          phoneNumber: studentData.phoneNumber || user?.phoneNumber || '',
          address: studentData.address || { street: '', city: '', state: '', country: '', zipCode: '' },
          socialLinks: studentData.socialLinks || { linkedin: '', github: '', portfolio: '', twitter: '' },
          cv: studentData.cv || { url: '', filename: '', uploadedAt: null }
        });
        if (studentData.profilePhoto) setProfilePreview(`http://localhost:5000${studentData.profilePhoto}`);
        if (studentData.coverPhoto) setCoverPreview(`http://localhost:5000${studentData.coverPhoto}`);
        toast.success('Profile loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching student profile:', error);
      if (error.response?.status === 404) {
        toast.info('Please create your student profile first');
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
      const response = await API.get('/students/posts');
      if (response.data.success) setPosts(response.data.posts || []);
    } catch (error) { setPosts([]); }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/students/connections/count');
      if (response.data.success) {
        setFollowers(response.data.followers || 0);
        setFollowing(response.data.following || 0);
      }
    } catch (error) {}
  };

  const calculateProfileCompleteness = () => {
    const requiredFields = [
      { name: 'summary', label: 'Bio' }, { name: 'phoneNumber', label: 'Phone Number' },
      { name: 'address.city', label: 'City' }, { name: 'address.country', label: 'Country' },
      { name: 'education', label: 'Education' }, { name: 'experience', label: 'Experience' },
      { name: 'skills', label: 'Skills' }, { name: 'languages', label: 'Languages' }
    ];
    const missing = [];
    let completed = 0;
    requiredFields.forEach(field => {
      if (field.name.includes('.')) {
        const [parent, child] = field.name.split('.');
        const value = formData[parent]?.[child];
        if (value && value.toString().trim() !== '') completed++;
        else missing.push(field.label);
      } else if (['education', 'experience', 'skills', 'languages'].includes(field.name)) {
        if (formData[field.name] && formData[field.name].length > 0) completed++;
        else missing.push(field.label);
      } else {
        const value = formData[field.name];
        if (value && value.toString().trim() !== '') completed++;
        else missing.push(field.label);
      }
    });
    const percentage = Math.round((completed / requiredFields.length) * 100);
    setProfileCompleteness(percentage);
    setMissingFields(missing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({ ...formData, [parent]: { ...formData[parent], [child]: value } });
    } else if (name.includes('socialLinks.')) {
      const platform = name.split('.')[1];
      setFormData({ ...formData, socialLinks: { ...formData.socialLinks, [platform]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be less than 5MB'); return; }
    try {
      setUploadingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
      const formData = new FormData();
      formData.append('profilePhoto', file);
      const response = await API.post('/students/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) toast.success('Profile photo updated successfully');
    } catch (error) { toast.error('Failed to upload photo'); } finally { setUploadingPhoto(false); }
  };

  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Cover photo must be less than 10MB'); return; }
    try {
      setUploadingCover(true);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);
      const formData = new FormData();
      formData.append('coverPhoto', file);
      const response = await API.post('/students/profile/cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) toast.success('Cover photo updated successfully');
    } catch (error) { toast.error('Failed to upload cover'); } finally { setUploadingCover(false); }
  };

  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('CV must be less than 10MB'); return; }
    try {
      setUploadingCV(true);
      const formData = new FormData();
      formData.append('cv', file);
      const response = await API.post('/students/cv/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        setFormData(prev => ({ ...prev, cv: response.data.cv }));
        toast.success('CV uploaded successfully');
      }
    } catch (error) { toast.error('Failed to upload CV'); } finally { setUploadingCV(false); }
  };

  const handleAddEducation = () => {
    if (!newEducation.degree || !newEducation.institution) { toast.error('Please fill required fields'); return; }
    if (editingType === 'education' && editingIndex !== null) {
      const updated = [...formData.education];
      updated[editingIndex] = newEducation;
      setFormData({ ...formData, education: updated });
      toast.success('Education updated');
    } else {
      setFormData({ ...formData, education: [...formData.education, newEducation] });
      toast.success('Education added');
    }
    resetEducationForm();
    setShowEducationForm(false);
    setEditingIndex(null);
    setEditingType(null);
  };

  const handleEditEducation = (index) => {
    setNewEducation(formData.education[index]);
    setEditingIndex(index);
    setEditingType('education');
    setShowEducationForm(true);
  };

  const handleRemoveEducation = (index) => {
    if (window.confirm('Remove this education?')) {
      const updated = formData.education.filter((_, i) => i !== index);
      setFormData({ ...formData, education: updated });
      toast.success('Education removed');
    }
  };

  const resetEducationForm = () => {
    setNewEducation({ degree: '', institution: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '', description: '' });
  };

  const handleAddExperience = () => {
    if (!newExperience.jobTitle || !newExperience.company) { toast.error('Please fill required fields'); return; }
    if (editingType === 'experience' && editingIndex !== null) {
      const updated = [...formData.experience];
      updated[editingIndex] = newExperience;
      setFormData({ ...formData, experience: updated });
      toast.success('Experience updated');
    } else {
      setFormData({ ...formData, experience: [...formData.experience, newExperience] });
      toast.success('Experience added');
    }
    resetExperienceForm();
    setShowExperienceForm(false);
    setEditingIndex(null);
    setEditingType(null);
  };

  const handleEditExperience = (index) => {
    setNewExperience(formData.experience[index]);
    setEditingIndex(index);
    setEditingType('experience');
    setShowExperienceForm(true);
  };

  const handleRemoveExperience = (index) => {
    if (window.confirm('Remove this experience?')) {
      const updated = formData.experience.filter((_, i) => i !== index);
      setFormData({ ...formData, experience: updated });
      toast.success('Experience removed');
    }
  };

  const resetExperienceForm = () => {
    setNewExperience({ jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' });
  };

  const handleAddSkill = () => {
    if (!newSkill.name.trim()) { toast.error('Enter a skill name'); return; }
    setFormData({ ...formData, skills: [...formData.skills, newSkill] });
    setNewSkill({ name: '', level: 'Intermediate', yearsOfExperience: '' });
    setShowSkillForm(false);
    toast.success('Skill added');
  };

  const handleEditSkill = (index) => {
    setNewSkill(formData.skills[index]);
    setEditingIndex(index);
    setEditingType('skill');
    setShowSkillForm(true);
  };

  const handleRemoveSkill = (index) => {
    if (window.confirm('Remove this skill?')) {
      const updated = formData.skills.filter((_, i) => i !== index);
      setFormData({ ...formData, skills: updated });
      toast.success('Skill removed');
    }
  };

  const getSkillLevelColor = (level) => {
    switch(level) {
      case 'Beginner': return '#48bb78';
      case 'Intermediate': return '#4299e1';
      case 'Advanced': return '#ed8936';
      case 'Expert': return '#9f7aea';
      default: return '#718096';
    }
  };

  const handleAddLanguage = () => {
    if (!newLanguage.language) { toast.error('Enter a language'); return; }
    setFormData({ ...formData, languages: [...formData.languages, newLanguage] });
    setNewLanguage({ language: '', proficiency: 'Conversational', certification: '' });
    setShowLanguageForm(false);
    toast.success('Language added');
  };

  const handleEditLanguage = (index) => {
    setNewLanguage(formData.languages[index]);
    setEditingIndex(index);
    setEditingType('language');
    setShowLanguageForm(true);
  };

  const handleRemoveLanguage = (index) => {
    if (window.confirm('Remove this language?')) {
      const updated = formData.languages.filter((_, i) => i !== index);
      setFormData({ ...formData, languages: updated });
      toast.success('Language removed');
    }
  };

  const handleAddCertification = () => {
    if (!newCertification.name || !newCertification.issuingOrganization) { toast.error('Please fill required fields'); return; }
    if (editingType === 'certification' && editingIndex !== null) {
      const updated = [...formData.certifications];
      updated[editingIndex] = newCertification;
      setFormData({ ...formData, certifications: updated });
      toast.success('Certification updated');
    } else {
      setFormData({ ...formData, certifications: [...formData.certifications, newCertification] });
      toast.success('Certification added');
    }
    resetCertForm();
    setShowCertForm(false);
    setEditingIndex(null);
    setEditingType(null);
  };

  const handleEditCertification = (index) => {
    setNewCertification(formData.certifications[index]);
    setEditingIndex(index);
    setEditingType('certification');
    setShowCertForm(true);
  };

  const handleRemoveCertification = (index) => {
    if (window.confirm('Remove this certification?')) {
      const updated = formData.certifications.filter((_, i) => i !== index);
      setFormData({ ...formData, certifications: updated });
      toast.success('Certification removed');
    }
  };

  const resetCertForm = () => {
    setNewCertification({ name: '', issuingOrganization: '', issueDate: '', expirationDate: '', credentialId: '', credentialUrl: '' });
  };

  const handleAddProject = () => {
    if (!newProject.title) { toast.error('Please enter a project title'); return; }
    if (editingType === 'project' && editingIndex !== null) {
      const updated = [...formData.projects];
      updated[editingIndex] = newProject;
      setFormData({ ...formData, projects: updated });
      toast.success('Project updated');
    } else {
      setFormData({ ...formData, projects: [...formData.projects, newProject] });
      toast.success('Project added');
    }
    resetProjectForm();
    setShowProjectForm(false);
    setEditingIndex(null);
    setEditingType(null);
  };

  const handleEditProject = (index) => {
    setNewProject(formData.projects[index]);
    setEditingIndex(index);
    setEditingType('project');
    setShowProjectForm(true);
  };

  const handleRemoveProject = (index) => {
    if (window.confirm('Remove this project?')) {
      const updated = formData.projects.filter((_, i) => i !== index);
      setFormData({ ...formData, projects: updated });
      toast.success('Project removed');
    }
  };

  const resetProjectForm = () => {
    setNewProject({ title: '', description: '', url: '', technologies: [], startDate: '', endDate: '', current: false });
  };

  const handleAddAchievement = () => {
    if (!newAchievement.title) { toast.error('Please enter a title'); return; }
    if (editingType === 'achievement' && editingIndex !== null) {
      const updated = [...formData.achievements];
      updated[editingIndex] = newAchievement;
      setFormData({ ...formData, achievements: updated });
      toast.success('Achievement updated');
    } else {
      setFormData({ ...formData, achievements: [...formData.achievements, newAchievement] });
      toast.success('Achievement added');
    }
    resetAchievementForm();
    setShowAchievementForm(false);
    setEditingIndex(null);
    setEditingType(null);
  };

  const handleEditAchievement = (index) => {
    setNewAchievement(formData.achievements[index]);
    setEditingIndex(index);
    setEditingType('achievement');
    setShowAchievementForm(true);
  };

  const handleRemoveAchievement = (index) => {
    if (window.confirm('Remove this achievement?')) {
      const updated = formData.achievements.filter((_, i) => i !== index);
      setFormData({ ...formData, achievements: updated });
      toast.success('Achievement removed');
    }
  };

  const resetAchievementForm = () => {
    setNewAchievement({ title: '', description: '', date: '', organization: '', type: 'award' });
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) { toast.error('Please write something'); return; }
    setUploadingPost(true);
    try {
      const formData = new FormData();
      formData.append('content', newPost);
      if (postImage) formData.append('image', postImage);
      const response = await API.post('/students/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        setPosts([response.data.post, ...posts]);
        setNewPost('');
        setPostImage(null);
        setShowPostModal(false);
        toast.success('Post created successfully');
      }
    } catch (error) { toast.error('Failed to create post'); } finally { setUploadingPost(false); }
  };

  const handleLikePost = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.liked ? post.likes - 1 : post.likes + 1, liked: !post.liked } : post
    ));
  };

  const handleFollow = async () => {
    try {
      const response = await API.post(`/students/follow/${profile?.userId}`);
      if (response.data.success) {
        setIsFollowing(!isFollowing);
        setFollowers(prev => isFollowing ? prev - 1 : prev + 1);
        toast.success(isFollowing ? 'Unfollowed' : 'Now following');
      }
    } catch (error) { toast.error('Failed to follow'); }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const response = await API.post('/students/profile', formData);
      if (response.data.success) {
        setProfile(response.data.student);
        setEditing(false);
        toast.success('Profile updated successfully');
        await fetchProfile();
      }
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to update profile'); } finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        summary: profile.summary || '',
        education: profile.education || [],
        experience: profile.experience || [],
        skills: profile.skills || [],
        languages: profile.languages || [],
        certifications: profile.certifications || [],
        projects: profile.projects || [],
        achievements: profile.achievements || [],
        portfolio: profile.portfolio || '',
        phoneNumber: profile.phoneNumber || user?.phoneNumber || '',
        address: profile.address || { street: '', city: '', state: '', country: '', zipCode: '' },
        socialLinks: profile.socialLinks || { linkedin: '', github: '', portfolio: '', twitter: '' },
        cv: profile.cv || { url: '', filename: '', uploadedAt: null }
      });
    }
    if (profile?.profilePhoto) setProfilePreview(`http://localhost:5000${profile.profilePhoto}`);
    if (profile?.coverPhoto) setCoverPreview(`http://localhost:5000${profile.coverPhoto}`);
    setShowEducationForm(false); setShowExperienceForm(false); setShowSkillForm(false);
    setShowLanguageForm(false); setShowCertForm(false); setShowProjectForm(false);
    setShowAchievementForm(false); setEditingIndex(null); setEditingType(null);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
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

  if (loading) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Loading profile...</h4>
      </div>
    );
  }

  return (
    <div className="ds-student-profile">
      <div className="ds-student-profile-container">
        {/* Cover Photo */}
        <div className="ds-cover-photo" style={{ 
          backgroundImage: coverPreview ? `url(${coverPreview})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          {!editing && (
            <div className="ds-cover-actions">
              <label className="ds-cover-upload-btn">
                {uploadingCover ? <FaSpinner className="ds-fa-spin" /> : <FaCamera />}
                <input type="file" ref={coverInputRef} accept="image/*" onChange={handleCoverPhotoUpload} style={{ display: 'none' }} disabled={uploadingCover} />
              </label>
            </div>
          )}
        </div>

        {/* Profile Header */}
        <div className="ds-profile-header">
          <div className="ds-profile-photo-wrapper">
            <div className="ds-profile-photo">
              {profilePreview ? (
                <img src={profilePreview} alt={user?.name} />
              ) : (
                <div className="ds-photo-placeholder">{getInitials(user?.name)}</div>
              )}
              {!editing && (
                <label className="ds-photo-upload-btn">
                  {uploadingPhoto ? <FaSpinner className="ds-fa-spin" /> : <FaCamera />}
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleProfilePhotoUpload} style={{ display: 'none' }} disabled={uploadingPhoto} />
                </label>
              )}
            </div>
          </div>

          <div className="ds-profile-info">
            <div className="ds-profile-name-section">
              <h1>{user?.name || 'Student Name'}</h1>
              <div className="ds-edit-lock-icon" onClick={() => setEditing(true)}>
                <FaEdit /> <span>Edit Profile</span>
              </div>
            </div>

            <div className="ds-profile-stats">
              <div className="ds-stat"><span className="ds-stat-value">{posts.length}</span><span className="ds-stat-label">Posts</span></div>
              <div className="ds-stat"><span className="ds-stat-value">{formatNumber(followers)}</span><span className="ds-stat-label">Followers</span></div>
              <div className="ds-stat"><span className="ds-stat-value">{formatNumber(following)}</span><span className="ds-stat-label">Following</span></div>
              <div className="ds-stat"><span className="ds-stat-value">{formData.skills.length}</span><span className="ds-stat-label">Skills</span></div>
            </div>

            {!editing && (
              <div className="ds-profile-bio">
                <p>{formData.summary || 'No bio added. Click edit to add your bio.'}</p>
              </div>
            )}

            {!editing && (
              <div className="ds-profile-actions">
                <button className="ds-follow-btn" onClick={handleFollow}>
                  {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            )}

            {editing && (
              <div className="ds-edit-actions">
                <button className="ds-cancel-btn" onClick={handleCancelEdit}><FaTimes /> Cancel</button>
                <button className="ds-save-btn" onClick={handleSubmit} disabled={saving}>
                  {saving ? <><FaSpinner className="ds-fa-spin" /> Saving...</> : <><FaSave /> Save Changes</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Completeness Alert */}
        {!editing && profileCompleteness < 100 && (
          <div className="ds-alert ds-alert-warning">
            <div className="ds-alert-content">
              <div className="ds-progress-circle" style={{ background: `conic-gradient(#ffc107 ${profileCompleteness * 3.6}deg, #e9ecef 0deg)` }}>
                <div className="ds-progress-value">{profileCompleteness}%</div>
              </div>
              <div className="ds-alert-text">
                <strong>Complete your profile!</strong>
                <p>Your profile is {profileCompleteness}% complete. Click Edit Profile to add missing information.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PROFILE SECTIONS - ALL IN BOXES ==================== */}

        {/* Contact Information Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaUser /></div>
            <h2>Contact Information</h2>
          </div>
          <div className="ds-section-content">
            <div className="ds-contact-grid">
              <div className="ds-contact-item">
                <div className="ds-contact-icon"><FaEnvelope /></div>
                <div className="ds-contact-details">
                  <label>Email</label>
                  <p>{user?.email || 'Not specified'}</p>
                </div>
              </div>
              <div className="ds-contact-item">
                <div className="ds-contact-icon"><FaPhone /></div>
                <div className="ds-contact-details">
                  <label>Phone</label>
                  <p>{formData.phoneNumber || 'Not specified'}</p>
                </div>
              </div>
              <div className="ds-contact-item">
                <div className="ds-contact-icon"><FaMapMarkerAlt /></div>
                <div className="ds-contact-details">
                  <label>Location</label>
                  <p>
                    {formData.address?.city || formData.address?.country ? (
                      <>{formData.address.city && <span>{formData.address.city}, </span>}{formData.address.country && <span>{formData.address.country}</span>}</>
                    ) : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Me Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaFileAlt /></div>
            <h2>About Me</h2>
          </div>
          <div className="ds-section-content">
            <p className="ds-bio-content">{formData.summary || 'No bio provided'}</p>
          </div>
        </div>

        {/* CV & Portfolio Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaFilePdf /></div>
            <h2>CV & Portfolio</h2>
          </div>
          <div className="ds-section-content">
            <div className="ds-cv-portfolio">
              {formData.cv?.url ? (
                <a href={formData.cv.url} target="_blank" rel="noopener noreferrer" className="ds-cv-link"><FaFilePdf /> {formData.cv.filename || 'Download CV'} <FaDownload /></a>
              ) : (
                <span className="ds-empty-text">No CV uploaded</span>
              )}
              {formData.portfolio ? (
                <a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="ds-portfolio-link"><FaGlobe /> Portfolio Website</a>
              ) : (
                <span className="ds-empty-text">No portfolio added</span>
              )}
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaGlobe /></div>
            <h2>Social Links</h2>
          </div>
          <div className="ds-section-content">
            <div className="ds-social-links">
              {formData.socialLinks?.linkedin && <a href={formData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="ds-social-link ds-linkedin"><FaLinkedin /> LinkedIn</a>}
              {formData.socialLinks?.github && <a href={formData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="ds-social-link ds-github"><FaGithub /> GitHub</a>}
              {formData.socialLinks?.twitter && <a href={formData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="ds-social-link ds-twitter"><FaTwitter /> Twitter</a>}
              {!formData.socialLinks?.linkedin && !formData.socialLinks?.github && !formData.socialLinks?.twitter && <span className="ds-empty-text">No social links added</span>}
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaGraduationCap /></div>
            <h2>Education</h2>
            {!editing && formData.education.length === 0 && <span className="ds-badge-empty">Not added</span>}
          </div>
          <div className="ds-section-content">
            {formData.education?.length > 0 ? (
              <div className="ds-list-items">
                {safeRenderArray(formData.education, (edu, index) => (
                  <div key={index} className="ds-list-item">
                    <div className="ds-list-item-header">
                      <h3>{edu.degree}</h3>
                      <span className="ds-list-date">{edu.startDate} - {edu.endDate || 'Present'}</span>
                    </div>
                    <div className="ds-list-subtitle">{edu.institution}</div>
                    {edu.fieldOfStudy && <div className="ds-list-description">{edu.fieldOfStudy}</div>}
                    {edu.grade && <div className="ds-list-description">Grade: {edu.grade}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="ds-empty-text">No education added yet</p>
            )}
          </div>
        </div>

        {/* Experience Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaBriefcase /></div>
            <h2>Work Experience</h2>
            {!editing && formData.experience.length === 0 && <span className="ds-badge-empty">Not added</span>}
          </div>
          <div className="ds-section-content">
            {formData.experience?.length > 0 ? (
              <div className="ds-list-items">
                {safeRenderArray(formData.experience, (exp, index) => (
                  <div key={index} className="ds-list-item">
                    <div className="ds-list-item-header">
                      <h3>{exp.jobTitle}</h3>
                      <span className="ds-list-date">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                    </div>
                    <div className="ds-list-subtitle">{exp.company}</div>
                    {exp.location && <div className="ds-list-description"><FaMapPin /> {exp.location}</div>}
                    {exp.description && <div className="ds-list-description">{exp.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="ds-empty-text">No experience added yet</p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaCode /></div>
            <h2>Skills</h2>
            {!editing && formData.skills.length === 0 && <span className="ds-badge-empty">Not added</span>}
          </div>
          <div className="ds-section-content">
            {formData.skills?.length > 0 ? (
              <div className="ds-skills-tags">
                {safeRenderArray(formData.skills, (skill, index) => (
                  <div key={index} className="ds-skill-tag">
                    <span>{skill.name}</span>
                    <span className="ds-skill-level" style={{ backgroundColor: getSkillLevelColor(skill.level) }}>{skill.level}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ds-empty-text">No skills added yet</p>
            )}
          </div>
        </div>

        {/* Languages Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaLanguage /></div>
            <h2>Languages</h2>
            {!editing && formData.languages.length === 0 && <span className="ds-badge-empty">Not added</span>}
          </div>
          <div className="ds-section-content">
            {formData.languages?.length > 0 ? (
              <div className="ds-list-items">
                {safeRenderArray(formData.languages, (lang, index) => (
                  <div key={index} className="ds-language-item">
                    <span className="ds-language-name">{lang.language}</span>
                    <span className="ds-language-proficiency">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ds-empty-text">No languages added yet</p>
            )}
          </div>
        </div>

        {/* Certifications Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaCertificate /></div>
            <h2>Certifications</h2>
            {!editing && formData.certifications.length === 0 && <span className="ds-badge-empty">Not added</span>}
          </div>
          <div className="ds-section-content">
            {formData.certifications?.length > 0 ? (
              <div className="ds-list-items">
                {safeRenderArray(formData.certifications, (cert, index) => (
                  <div key={index} className="ds-list-item">
                    <div className="ds-list-item-header">
                      <h3>{cert.name}</h3>
                      <span className="ds-list-date">Issued: {cert.issueDate}</span>
                    </div>
                    <div className="ds-list-subtitle">{cert.issuingOrganization}</div>
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="ds-cert-link">Verify Certificate <FaExternalLinkAlt /></a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="ds-empty-text">No certifications added yet</p>
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaRocket /></div>
            <h2>Projects</h2>
            {!editing && formData.projects.length === 0 && <span className="ds-badge-empty">Not added</span>}
          </div>
          <div className="ds-section-content">
            {formData.projects?.length > 0 ? (
              <div className="ds-list-items">
                {safeRenderArray(formData.projects, (project, index) => (
                  <div key={index} className="ds-list-item">
                    <div className="ds-list-item-header">
                      <h3>{project.title}</h3>
                      <span className="ds-list-date">{project.startDate} - {project.current ? 'Present' : project.endDate}</span>
                    </div>
                    <div className="ds-list-description">{project.description}</div>
                    {project.technologies?.length > 0 && (
                      <div className="ds-tech-tags">
                        {project.technologies.map((tech, i) => <span key={i} className="ds-tech-tag">{tech}</span>)}
                      </div>
                    )}
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="ds-project-link">View Project <FaExternalLinkAlt /></a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="ds-empty-text">No projects added yet</p>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="ds-profile-section">
          <div className="ds-section-title">
            <div className="ds-section-title-icon"><FaTrophy /></div>
            <h2>Achievements</h2>
            {!editing && formData.achievements.length === 0 && <span className="ds-badge-empty">Not added</span>}
          </div>
          <div className="ds-section-content">
            {formData.achievements?.length > 0 ? (
              <div className="ds-list-items">
                {safeRenderArray(formData.achievements, (achievement, index) => (
                  <div key={index} className="ds-list-item">
                    <div className="ds-list-item-header">
                      <h3>{achievement.title}</h3>
                      <span className="ds-list-date">{achievement.date}</span>
                    </div>
                    <div className="ds-list-subtitle">{achievement.organization}</div>
                    <div className="ds-list-description">{achievement.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ds-empty-text">No achievements added yet</p>
            )}
          </div>
        </div>

        {/* Posts Section */}
        <div className="ds-posts-section">
          <div className="ds-posts-header">
            <h3>Posts</h3>
            <button className="ds-create-post-btn" onClick={() => setShowPostModal(true)}><FaPlus /> Create Post</button>
          </div>
          <div className="ds-posts-feed">
            {posts.length > 0 ? (
              safeRenderArray(posts, (post) => (
                <div key={post.id} className="ds-post-card">
                  <div className="ds-post-header">
                    <div className="ds-post-author">
                      <div className="ds-post-avatar">
                        {profilePreview ? <img src={profilePreview} alt={user?.name} /> : <div className="ds-avatar-placeholder">{getInitials(user?.name)}</div>}
                      </div>
                      <div className="ds-post-info">
                        <h4>{user?.name}</h4>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ds-post-content">
                    <p>{post.content}</p>
                    {post.image && (
                      <div className="ds-post-media"><img src={post.image} alt="Post" /></div>
                    )}
                  </div>
                  <div className="ds-post-stats">
                    <span>{post.likes || 0} Likes</span>
                    <span>{post.comments || 0} Comments</span>
                  </div>
                  <div className="ds-post-actions">
                    <button className={`ds-action-btn ${post.liked ? 'liked' : ''}`} onClick={() => handleLikePost(post.id)}>
                      {post.liked ? <FaHeart /> : <FaRegHeart />} Like
                    </button>
                    <button className="ds-action-btn"><FaComment /> Comment</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="ds-no-data">
                <FaFileAlt className="ds-no-data-icon" />
                <h3>No posts yet</h3>
                <p>Share your thoughts and updates</p>
                <button className="ds-create-post-btn" onClick={() => setShowPostModal(true)}>Create First Post</button>
              </div>
            )}
          </div>
        </div>

        {/* ==================== EDIT MODAL ==================== */}
        {editing && (
          <div className="ds-edit-overlay">
            <div className="ds-edit-modal">
              <div className="ds-edit-modal-header">
                <h2>Edit Profile</h2>
                <button className="ds-close-modal" onClick={handleCancelEdit}><FaTimes /></button>
              </div>
              <div className="ds-edit-modal-body">
                {/* Basic Information */}
                <div className="ds-edit-section">
                  <h3>Basic Information</h3>
                  <div className="ds-form-group"><label>Bio</label><textarea name="summary" value={formData.summary} onChange={handleInputChange} rows="4" placeholder="Tell us about yourself..." /></div>
                  <div className="ds-form-group"><label>Phone Number</label><input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="+94 XX XXX XXXX" /></div>
                  <h4>Address</h4>
                  <div className="ds-form-row">
                    <div className="ds-form-group"><input type="text" name="address.city" value={formData.address.city} onChange={handleInputChange} placeholder="City" /></div>
                    <div className="ds-form-group"><input type="text" name="address.country" value={formData.address.country} onChange={handleInputChange} placeholder="Country" /></div>
                  </div>
                  <div className="ds-form-group">
                    <label>CV / Resume</label>
                    <div className="ds-file-upload">
                      <input type="file" ref={cvInputRef} accept=".pdf,.doc,.docx" onChange={handleCVUpload} style={{ display: 'none' }} />
                      <button type="button" className="ds-upload-btn" onClick={() => cvInputRef.current.click()} disabled={uploadingCV}>
                        {uploadingCV ? <FaSpinner className="ds-fa-spin" /> : <FaUpload />}{formData.cv?.url ? 'Update CV' : 'Upload CV'}
                      </button>
                      {formData.cv?.url && <a href={formData.cv.url} target="_blank" rel="noopener noreferrer" className="ds-view-link"><FaFilePdf /> View Current CV</a>}
                    </div>
                  </div>
                  <div className="ds-form-group"><label>Portfolio Website</label><input type="url" name="portfolio" value={formData.portfolio} onChange={handleInputChange} placeholder="https://yourportfolio.com" /></div>
                </div>

                {/* Social Links */}
                <div className="ds-edit-section">
                  <h3>Social Links</h3>
                  <div className="ds-form-group"><label>LinkedIn</label><input type="url" name="socialLinks.linkedin" value={formData.socialLinks.linkedin} onChange={handleInputChange} placeholder="https://linkedin.com/in/username" /></div>
                  <div className="ds-form-group"><label>GitHub</label><input type="url" name="socialLinks.github" value={formData.socialLinks.github} onChange={handleInputChange} placeholder="https://github.com/username" /></div>
                  <div className="ds-form-group"><label>Twitter</label><input type="url" name="socialLinks.twitter" value={formData.socialLinks.twitter} onChange={handleInputChange} placeholder="https://twitter.com/username" /></div>
                </div>

                {/* Education Section */}
                <div className="ds-edit-section">
                  <div className="ds-section-header"><h3>Education</h3><button className="ds-add-btn" onClick={() => setShowEducationForm(true)}><FaPlus /> Add Education</button></div>
                  {safeRenderArray(formData.education, (edu, index) => (
                    <div key={index} className="ds-item-card">
                      <div className="ds-item-content"><h4>{edu.degree}</h4><p>{edu.institution}</p><p className="ds-date">{edu.startDate} - {edu.endDate || 'Present'}</p></div>
                      <div className="ds-item-actions"><button className="ds-edit-btn" onClick={() => handleEditEducation(index)}><FaEdit /></button><button className="ds-delete-btn" onClick={() => handleRemoveEducation(index)}><FaTrash /></button></div>
                    </div>
                  ))}
                </div>

                {/* Experience Section */}
                <div className="ds-edit-section">
                  <div className="ds-section-header"><h3>Experience</h3><button className="ds-add-btn" onClick={() => setShowExperienceForm(true)}><FaPlus /> Add Experience</button></div>
                  {safeRenderArray(formData.experience, (exp, index) => (
                    <div key={index} className="ds-item-card">
                      <div className="ds-item-content"><h4>{exp.jobTitle}</h4><p>{exp.company}</p><p className="ds-date">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p></div>
                      <div className="ds-item-actions"><button className="ds-edit-btn" onClick={() => handleEditExperience(index)}><FaEdit /></button><button className="ds-delete-btn" onClick={() => handleRemoveExperience(index)}><FaTrash /></button></div>
                    </div>
                  ))}
                </div>

                {/* Skills Section */}
                <div className="ds-edit-section">
                  <div className="ds-section-header"><h3>Skills</h3><button className="ds-add-btn" onClick={() => setShowSkillForm(true)}><FaPlus /> Add Skill</button></div>
                  <div className="ds-skills-tags">
                    {safeRenderArray(formData.skills, (skill, index) => (
                      <div key={index} className="ds-skill-chip"><span>{skill.name}</span><button onClick={() => handleRemoveSkill(index)}><FaTimes /></button></div>
                    ))}
                  </div>
                </div>

                {/* Languages Section */}
                <div className="ds-edit-section">
                  <div className="ds-section-header"><h3>Languages</h3><button className="ds-add-btn" onClick={() => setShowLanguageForm(true)}><FaPlus /> Add Language</button></div>
                  {safeRenderArray(formData.languages, (lang, index) => (
                    <div key={index} className="ds-item-card">
                      <div className="ds-item-content"><h4>{lang.language}</h4><p className="ds-level">{lang.proficiency}</p></div>
                      <div className="ds-item-actions"><button className="ds-edit-btn" onClick={() => handleEditLanguage(index)}><FaEdit /></button><button className="ds-delete-btn" onClick={() => handleRemoveLanguage(index)}><FaTrash /></button></div>
                    </div>
                  ))}
                </div>

                {/* Certifications Section */}
                <div className="ds-edit-section">
                  <div className="ds-section-header"><h3>Certifications</h3><button className="ds-add-btn" onClick={() => setShowCertForm(true)}><FaPlus /> Add Certification</button></div>
                  {safeRenderArray(formData.certifications, (cert, index) => (
                    <div key={index} className="ds-item-card">
                      <div className="ds-item-content"><h4>{cert.name}</h4><p>{cert.issuingOrganization}</p></div>
                      <div className="ds-item-actions"><button className="ds-edit-btn" onClick={() => handleEditCertification(index)}><FaEdit /></button><button className="ds-delete-btn" onClick={() => handleRemoveCertification(index)}><FaTrash /></button></div>
                    </div>
                  ))}
                </div>

                {/* Projects Section */}
                <div className="ds-edit-section">
                  <div className="ds-section-header"><h3>Projects</h3><button className="ds-add-btn" onClick={() => setShowProjectForm(true)}><FaPlus /> Add Project</button></div>
                  {safeRenderArray(formData.projects, (project, index) => (
                    <div key={index} className="ds-item-card">
                      <div className="ds-item-content"><h4>{project.title}</h4><p className="ds-date">{project.startDate} - {project.current ? 'Present' : project.endDate}</p></div>
                      <div className="ds-item-actions"><button className="ds-edit-btn" onClick={() => handleEditProject(index)}><FaEdit /></button><button className="ds-delete-btn" onClick={() => handleRemoveProject(index)}><FaTrash /></button></div>
                    </div>
                  ))}
                </div>

                {/* Achievements Section */}
                <div className="ds-edit-section">
                  <div className="ds-section-header"><h3>Achievements</h3><button className="ds-add-btn" onClick={() => setShowAchievementForm(true)}><FaPlus /> Add Achievement</button></div>
                  {safeRenderArray(formData.achievements, (achievement, index) => (
                    <div key={index} className="ds-item-card">
                      <div className="ds-item-content"><h4>{achievement.title}</h4><p>{achievement.organization} • {achievement.date}</p></div>
                      <div className="ds-item-actions"><button className="ds-edit-btn" onClick={() => handleEditAchievement(index)}><FaEdit /></button><button className="ds-delete-btn" onClick={() => handleRemoveAchievement(index)}><FaTrash /></button></div>
                    </div>
                  ))}
                </div>

                <div className="ds-form-actions">
                  <button className="ds-cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                  <button className="ds-save-btn" onClick={handleSubmit} disabled={saving}>{saving ? <><FaSpinner className="ds-fa-spin" /> Saving...</> : 'Save Changes'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODALS ==================== */}
        {/* Education Modal */}
        {showEducationForm && (
          <div className="ds-modal-overlay" onClick={() => { setShowEducationForm(false); resetEducationForm(); setEditingIndex(null); setEditingType(null); }}>
            <div className="ds-modal" onClick={e => e.stopPropagation()}>
              <div className="ds-modal-header"><h3>{editingIndex !== null ? 'Edit Education' : 'Add Education'}</h3><button className="ds-close-btn" onClick={() => { setShowEducationForm(false); resetEducationForm(); }}><FaTimes /></button></div>
              <div className="ds-modal-body">
                <input type="text" placeholder="Degree *" value={newEducation.degree} onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})} />
                <input type="text" placeholder="Institution *" value={newEducation.institution} onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})} />
                <input type="text" placeholder="Field of Study" value={newEducation.fieldOfStudy} onChange={(e) => setNewEducation({...newEducation, fieldOfStudy: e.target.value})} />
                <div className="ds-form-row"><input type="text" placeholder="Start Date" value={newEducation.startDate} onChange={(e) => setNewEducation({...newEducation, startDate: e.target.value})} /><input type="text" placeholder="End Date" value={newEducation.endDate} onChange={(e) => setNewEducation({...newEducation, endDate: e.target.value})} /></div>
                <input type="text" placeholder="Grade" value={newEducation.grade} onChange={(e) => setNewEducation({...newEducation, grade: e.target.value})} />
                <textarea placeholder="Description" value={newEducation.description} onChange={(e) => setNewEducation({...newEducation, description: e.target.value})} rows="3" />
              </div>
              <div className="ds-modal-footer"><button className="ds-cancel-btn" onClick={() => { setShowEducationForm(false); resetEducationForm(); }}>Cancel</button><button className="ds-save-btn" onClick={handleAddEducation}>{editingIndex !== null ? 'Update' : 'Add'}</button></div>
            </div>
          </div>
        )}

        {/* Experience Modal */}
        {showExperienceForm && (
          <div className="ds-modal-overlay" onClick={() => { setShowExperienceForm(false); resetExperienceForm(); setEditingIndex(null); setEditingType(null); }}>
            <div className="ds-modal" onClick={e => e.stopPropagation()}>
              <div className="ds-modal-header"><h3>{editingIndex !== null ? 'Edit Experience' : 'Add Experience'}</h3><button className="ds-close-btn" onClick={() => { setShowExperienceForm(false); resetExperienceForm(); }}><FaTimes /></button></div>
              <div className="ds-modal-body">
                <input type="text" placeholder="Job Title *" value={newExperience.jobTitle} onChange={(e) => setNewExperience({...newExperience, jobTitle: e.target.value})} />
                <input type="text" placeholder="Company *" value={newExperience.company} onChange={(e) => setNewExperience({...newExperience, company: e.target.value})} />
                <input type="text" placeholder="Location" value={newExperience.location} onChange={(e) => setNewExperience({...newExperience, location: e.target.value})} />
                <div className="ds-form-row"><input type="text" placeholder="Start Date" value={newExperience.startDate} onChange={(e) => setNewExperience({...newExperience, startDate: e.target.value})} /><input type="text" placeholder="End Date" value={newExperience.endDate} onChange={(e) => setNewExperience({...newExperience, endDate: e.target.value})} disabled={newExperience.current} /></div>
                <label className="ds-checkbox"><input type="checkbox" checked={newExperience.current} onChange={(e) => setNewExperience({...newExperience, current: e.target.checked})} /> I currently work here</label>
                <textarea placeholder="Description" value={newExperience.description} onChange={(e) => setNewExperience({...newExperience, description: e.target.value})} rows="3" />
              </div>
              <div className="ds-modal-footer"><button className="ds-cancel-btn" onClick={() => { setShowExperienceForm(false); resetExperienceForm(); }}>Cancel</button><button className="ds-save-btn" onClick={handleAddExperience}>{editingIndex !== null ? 'Update' : 'Add'}</button></div>
            </div>
          </div>
        )}

        {/* Skill Modal */}
        {showSkillForm && (
          <div className="ds-modal-overlay" onClick={() => { setShowSkillForm(false); setEditingIndex(null); setEditingType(null); }}>
            <div className="ds-modal" onClick={e => e.stopPropagation()}>
              <div className="ds-modal-header"><h3>{editingIndex !== null ? 'Edit Skill' : 'Add Skill'}</h3><button className="ds-close-btn" onClick={() => { setShowSkillForm(false); }}><FaTimes /></button></div>
              <div className="ds-modal-body">
                <input type="text" placeholder="Skill Name *" value={newSkill.name} onChange={(e) => setNewSkill({...newSkill, name: e.target.value})} />
                <select value={newSkill.level} onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}><option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option><option value="Expert">Expert</option></select>
                <input type="text" placeholder="Years of Experience" value={newSkill.yearsOfExperience} onChange={(e) => setNewSkill({...newSkill, yearsOfExperience: e.target.value})} />
              </div>
              <div className="ds-modal-footer"><button className="ds-cancel-btn" onClick={() => { setShowSkillForm(false); }}>Cancel</button><button className="ds-save-btn" onClick={handleAddSkill}>{editingIndex !== null ? 'Update' : 'Add'}</button></div>
            </div>
          </div>
        )}

        {/* Language Modal */}
        {showLanguageForm && (
          <div className="ds-modal-overlay" onClick={() => { setShowLanguageForm(false); setEditingIndex(null); setEditingType(null); }}>
            <div className="ds-modal" onClick={e => e.stopPropagation()}>
              <div className="ds-modal-header"><h3>{editingIndex !== null ? 'Edit Language' : 'Add Language'}</h3><button className="ds-close-btn" onClick={() => { setShowLanguageForm(false); }}><FaTimes /></button></div>
              <div className="ds-modal-body">
                <input type="text" placeholder="Language *" value={newLanguage.language} onChange={(e) => setNewLanguage({...newLanguage, language: e.target.value})} />
                <select value={newLanguage.proficiency} onChange={(e) => setNewLanguage({...newLanguage, proficiency: e.target.value})}><option value="Basic">Basic</option><option value="Conversational">Conversational</option><option value="Professional">Professional</option><option value="Native">Native</option></select>
                <input type="text" placeholder="Certification (optional)" value={newLanguage.certification} onChange={(e) => setNewLanguage({...newLanguage, certification: e.target.value})} />
              </div>
              <div className="ds-modal-footer"><button className="ds-cancel-btn" onClick={() => { setShowLanguageForm(false); }}>Cancel</button><button className="ds-save-btn" onClick={handleAddLanguage}>{editingIndex !== null ? 'Update' : 'Add'}</button></div>
            </div>
          </div>
        )}

        {/* Certification Modal */}
        {showCertForm && (
          <div className="ds-modal-overlay" onClick={() => { setShowCertForm(false); resetCertForm(); setEditingIndex(null); setEditingType(null); }}>
            <div className="ds-modal" onClick={e => e.stopPropagation()}>
              <div className="ds-modal-header"><h3>{editingIndex !== null ? 'Edit Certification' : 'Add Certification'}</h3><button className="ds-close-btn" onClick={() => { setShowCertForm(false); resetCertForm(); }}><FaTimes /></button></div>
              <div className="ds-modal-body">
                <input type="text" placeholder="Certification Name *" value={newCertification.name} onChange={(e) => setNewCertification({...newCertification, name: e.target.value})} />
                <input type="text" placeholder="Issuing Organization *" value={newCertification.issuingOrganization} onChange={(e) => setNewCertification({...newCertification, issuingOrganization: e.target.value})} />
                <div className="ds-form-row"><input type="text" placeholder="Issue Date" value={newCertification.issueDate} onChange={(e) => setNewCertification({...newCertification, issueDate: e.target.value})} /><input type="text" placeholder="Expiration Date" value={newCertification.expirationDate} onChange={(e) => setNewCertification({...newCertification, expirationDate: e.target.value})} /></div>
                <input type="text" placeholder="Credential ID" value={newCertification.credentialId} onChange={(e) => setNewCertification({...newCertification, credentialId: e.target.value})} />
                <input type="url" placeholder="Credential URL" value={newCertification.credentialUrl} onChange={(e) => setNewCertification({...newCertification, credentialUrl: e.target.value})} />
              </div>
              <div className="ds-modal-footer"><button className="ds-cancel-btn" onClick={() => { setShowCertForm(false); resetCertForm(); }}>Cancel</button><button className="ds-save-btn" onClick={handleAddCertification}>{editingIndex !== null ? 'Update' : 'Add'}</button></div>
            </div>
          </div>
        )}

        {/* Project Modal */}
        {showProjectForm && (
          <div className="ds-modal-overlay" onClick={() => { setShowProjectForm(false); resetProjectForm(); setEditingIndex(null); setEditingType(null); }}>
            <div className="ds-modal" onClick={e => e.stopPropagation()}>
              <div className="ds-modal-header"><h3>{editingIndex !== null ? 'Edit Project' : 'Add Project'}</h3><button className="ds-close-btn" onClick={() => { setShowProjectForm(false); resetProjectForm(); }}><FaTimes /></button></div>
              <div className="ds-modal-body">
                <input type="text" placeholder="Project Title *" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} />
                <textarea placeholder="Description" value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} rows="3" />
                <div className="ds-form-row"><input type="text" placeholder="Start Date" value={newProject.startDate} onChange={(e) => setNewProject({...newProject, startDate: e.target.value})} /><input type="text" placeholder="End Date" value={newProject.endDate} onChange={(e) => setNewProject({...newProject, endDate: e.target.value})} disabled={newProject.current} /></div>
                <label className="ds-checkbox"><input type="checkbox" checked={newProject.current} onChange={(e) => setNewProject({...newProject, current: e.target.checked})} /> Ongoing project</label>
                <input type="url" placeholder="Project URL" value={newProject.url} onChange={(e) => setNewProject({...newProject, url: e.target.value})} />
                <input type="text" placeholder="Technologies (comma separated)" value={newProject.technologies.join(', ')} onChange={(e) => setNewProject({...newProject, technologies: e.target.value.split(',').map(t => t.trim())})} />
              </div>
              <div className="ds-modal-footer"><button className="ds-cancel-btn" onClick={() => { setShowProjectForm(false); resetProjectForm(); }}>Cancel</button><button className="ds-save-btn" onClick={handleAddProject}>{editingIndex !== null ? 'Update' : 'Add'}</button></div>
            </div>
          </div>
        )}

        {/* Achievement Modal */}
        {showAchievementForm && (
          <div className="ds-modal-overlay" onClick={() => { setShowAchievementForm(false); resetAchievementForm(); setEditingIndex(null); setEditingType(null); }}>
            <div className="ds-modal" onClick={e => e.stopPropagation()}>
              <div className="ds-modal-header"><h3>{editingIndex !== null ? 'Edit Achievement' : 'Add Achievement'}</h3><button className="ds-close-btn" onClick={() => { setShowAchievementForm(false); resetAchievementForm(); }}><FaTimes /></button></div>
              <div className="ds-modal-body">
                <input type="text" placeholder="Title *" value={newAchievement.title} onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})} />
                <select value={newAchievement.type} onChange={(e) => setNewAchievement({...newAchievement, type: e.target.value})}><option value="award">Award</option><option value="honor">Honor</option><option value="recognition">Recognition</option></select>
                <input type="text" placeholder="Organization" value={newAchievement.organization} onChange={(e) => setNewAchievement({...newAchievement, organization: e.target.value})} />
                <input type="text" placeholder="Date" value={newAchievement.date} onChange={(e) => setNewAchievement({...newAchievement, date: e.target.value})} />
                <textarea placeholder="Description" value={newAchievement.description} onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})} rows="3" />
              </div>
              <div className="ds-modal-footer"><button className="ds-cancel-btn" onClick={() => { setShowAchievementForm(false); resetAchievementForm(); }}>Cancel</button><button className="ds-save-btn" onClick={handleAddAchievement}>{editingIndex !== null ? 'Update' : 'Add'}</button></div>
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        {showPostModal && (
          <div className="ds-modal-overlay" onClick={() => setShowPostModal(false)}>
            <div className="ds-modal" onClick={e => e.stopPropagation()}>
              <div className="ds-modal-header"><h3>Create Post</h3><button className="ds-close-btn" onClick={() => setShowPostModal(false)}><FaTimes /></button></div>
              <div className="ds-modal-body">
                <textarea className="ds-post-textarea" placeholder="What's on your mind?" value={newPost} onChange={(e) => setNewPost(e.target.value)} rows="4" />
                {postImage && (<div className="ds-image-preview"><img src={URL.createObjectURL(postImage)} alt="Preview" /><button onClick={() => setPostImage(null)}><FaTimes /></button></div>)}
                <div className="ds-post-actions"><label className="ds-media-btn"><FaImage /><input type="file" accept="image/*" onChange={(e) => setPostImage(e.target.files[0])} style={{ display: 'none' }} />Photo</label></div>
              </div>
              <div className="ds-modal-footer"><button className="ds-post-btn" onClick={handleCreatePost} disabled={uploadingPost}>{uploadingPost ? <FaSpinner className="ds-fa-spin" /> : 'Post'}</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;