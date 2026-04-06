import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGraduationCap, FaBriefcase, FaCode, FaLanguage, FaCertificate,
  FaGithub, FaLinkedin, FaGlobe, FaTwitter, FaSave, FaEdit, FaTimes, FaPlus, FaTrash,
  FaCamera, FaSpinner, FaMapPin, FaExternalLinkAlt, FaUserPlus, FaUserCheck, FaTrophy, FaRocket
} from 'react-icons/fa';

const StudentProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  
  // State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [missingFields, setMissingFields] = useState([]);
  
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
    socialLinks: { linkedin: '', github: '', portfolio: '', twitter: '' }
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
          socialLinks: studentData.socialLinks || { linkedin: '', github: '', portfolio: '', twitter: '' }
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
        socialLinks: profile.socialLinks || { linkedin: '', github: '', portfolio: '', twitter: '' }
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

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="jobp-loading-container">
        <div className="jobp-spinner"></div>
        <h4>Loading profile...</h4>
      </div>
    );
  }

  return (
    <div className="jobp-student-profile">
      <div className="jobp-profile-container">
        {/* Cover Photo */}
        <div className="jobp-cover-photo" style={{ 
          backgroundImage: coverPreview ? `url(${coverPreview})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          {!editing && (
            <div className="jobp-cover-actions">
              <label className="jobp-cover-upload-btn">
                {uploadingCover ? <FaSpinner className="jobp-fa-spin" /> : <FaCamera />}
                <input type="file" ref={coverInputRef} accept="image/*" onChange={handleCoverPhotoUpload} style={{ display: 'none' }} disabled={uploadingCover} />
              </label>
            </div>
          )}
        </div>

        {/* Profile Header */}
        <div className="jobp-profile-header">
          <div className="jobp-profile-photo-wrapper">
            <div className="jobp-profile-photo">
              {profilePreview ? (
                <img src={profilePreview} alt={user?.name} />
              ) : (
                <div className="jobp-photo-placeholder">{getInitials(user?.name)}</div>
              )}
              {!editing && (
                <label className="jobp-photo-upload-btn">
                  {uploadingPhoto ? <FaSpinner className="jobp-fa-spin" /> : <FaCamera />}
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleProfilePhotoUpload} style={{ display: 'none' }} disabled={uploadingPhoto} />
                </label>
              )}
            </div>
          </div>

          <div className="jobp-profile-info">
            <div className="jobp-profile-name-section">
              <h1>{user?.name || 'Student Name'}</h1>
              <div className="jobp-edit-lock-icon" onClick={() => setEditing(true)}>
                <FaEdit /> <span>Edit Profile</span>
              </div>
            </div>

            <div className="jobp-profile-stats">
              <div className="jobp-stat"><span className="jobp-stat-value">{formatNumber(followers)}</span><span className="jobp-stat-label">Followers</span></div>
              <div className="jobp-stat"><span className="jobp-stat-value">{formatNumber(following)}</span><span className="jobp-stat-label">Following</span></div>
              <div className="jobp-stat"><span className="jobp-stat-value">{formData.skills.length}</span><span className="jobp-stat-label">Skills</span></div>
            </div>

            {!editing && (
              <div className="jobp-profile-bio">
                <div className="jobp-bio-header">
                  <FaUser className="jobp-bio-icon" />
                  <span className="jobp-bio-label">About Me</span>
                </div>
                <p>{formData.summary || 'No bio added. Click edit to add your bio.'}</p>
              </div>
            )}

            {!editing && (
              <div className="jobp-profile-actions">
                <button className="jobp-follow-btn" onClick={handleFollow}>
                  {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            )}

            {editing && (
              <div className="jobp-edit-actions">
                <button className="jobp-cancel-btn" onClick={handleCancelEdit}><FaTimes /> Cancel</button>
                <button className="jobp-save-btn" onClick={handleSubmit} disabled={saving}>
                  {saving ? <><FaSpinner className="jobp-fa-spin" /> Saving...</> : <><FaSave /> Save Changes</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Completeness Alert */}
        {!editing && profileCompleteness < 100 && (
          <div className="jobp-alert jobp-alert-warning">
            <div className="jobp-alert-content">
              <div className="jobp-progress-circle" style={{ background: `conic-gradient(#ffc107 ${profileCompleteness * 3.6}deg, #e9ecef 0deg)` }}>
                <div className="jobp-progress-value">{profileCompleteness}%</div>
              </div>
              <div className="jobp-alert-text">
                <strong>Complete your profile!</strong>
                <p>Your profile is {profileCompleteness}% complete. Click Edit Profile to add missing information.</p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information Section */}
        <div className="jobp-profile-section">
          <div className="jobp-section-title">
            <div className="jobp-section-title-icon"><FaUser /></div>
            <h2>Contact Information</h2>
          </div>
          <div className="jobp-section-content">
            <div className="jobp-contact-grid">
              <div className="jobp-contact-item">
                <div className="jobp-contact-icon"><FaEnvelope /></div>
                <div className="jobp-contact-details">
                  <label>Email</label>
                  <p>{user?.email || 'Not specified'}</p>
                </div>
              </div>
              <div className="jobp-contact-item">
                <div className="jobp-contact-icon"><FaPhone /></div>
                <div className="jobp-contact-details">
                  <label>Phone</label>
                  <p>{formData.phoneNumber || 'Not specified'}</p>
                </div>
              </div>
              <div className="jobp-contact-item">
                <div className="jobp-contact-icon"><FaMapMarkerAlt /></div>
                <div className="jobp-contact-details">
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

        {/* Social Links Section */}
        <div className="jobp-profile-section">
          <div className="jobp-section-title">
            <div className="jobp-section-title-icon"><FaGlobe /></div>
            <h2>Social Links & Portfolio</h2>
          </div>
          <div className="jobp-section-content">
            <div className="jobp-social-links">
              {formData.socialLinks?.linkedin && <a href={formData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="jobp-social-link jobp-linkedin"><FaLinkedin /> LinkedIn</a>}
              {formData.socialLinks?.github && <a href={formData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="jobp-social-link jobp-github"><FaGithub /> GitHub</a>}
              {formData.socialLinks?.twitter && <a href={formData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="jobp-social-link jobp-twitter"><FaTwitter /> Twitter</a>}
              {formData.portfolio && <a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="jobp-social-link jobp-portfolio"><FaGlobe /> Portfolio Website</a>}
              {!formData.socialLinks?.linkedin && !formData.socialLinks?.github && !formData.socialLinks?.twitter && !formData.portfolio && <span className="jobp-empty-text">No links added</span>}
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div className="jobp-profile-section">
          <div className="jobp-section-title">
            <div className="jobp-section-title-icon"><FaGraduationCap /></div>
            <h2>Education</h2>
            {!editing && formData.education.length === 0 && <span className="jobp-badge-empty">Not added</span>}
          </div>
          <div className="jobp-section-content">
            {formData.education?.length > 0 ? (
              <div className="jobp-list-items">
                {safeRenderArray(formData.education, (edu, index) => (
                  <div key={index} className="jobp-list-item">
                    <div className="jobp-list-item-header">
                      <h3>{edu.degree}</h3>
                      <span className="jobp-list-date">{edu.startDate} - {edu.endDate || 'Present'}</span>
                    </div>
                    <div className="jobp-list-subtitle">{edu.institution}</div>
                    {edu.fieldOfStudy && <div className="jobp-list-description">{edu.fieldOfStudy}</div>}
                    {edu.grade && <div className="jobp-list-description">Grade: {edu.grade}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="jobp-empty-text">No education added yet</p>
            )}
          </div>
        </div>

        {/* Experience Section */}
        <div className="jobp-profile-section">
          <div className="jobp-section-title">
            <div className="jobp-section-title-icon"><FaBriefcase /></div>
            <h2>Work Experience</h2>
            {!editing && formData.experience.length === 0 && <span className="jobp-badge-empty">Not added</span>}
          </div>
          <div className="jobp-section-content">
            {formData.experience?.length > 0 ? (
              <div className="jobp-list-items">
                {safeRenderArray(formData.experience, (exp, index) => (
                  <div key={index} className="jobp-list-item">
                    <div className="jobp-list-item-header">
                      <h3>{exp.jobTitle}</h3>
                      <span className="jobp-list-date">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                    </div>
                    <div className="jobp-list-subtitle">{exp.company}</div>
                    {exp.location && <div className="jobp-list-description"><FaMapPin /> {exp.location}</div>}
                    {exp.description && <div className="jobp-list-description">{exp.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="jobp-empty-text">No experience added yet</p>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="jobp-profile-section">
          <div className="jobp-section-title">
            <div className="jobp-section-title-icon"><FaCode /></div>
            <h2>Skills</h2>
            {!editing && formData.skills.length === 0 && <span className="jobp-badge-empty">Not added</span>}
          </div>
          <div className="jobp-section-content">
            {formData.skills?.length > 0 ? (
              <div className="jobp-skills-tags">
                {safeRenderArray(formData.skills, (skill, index) => (
                  <div key={index} className="jobp-skill-tag">
                    <span>{skill.name}</span>
                    <span className="jobp-skill-level" style={{ backgroundColor: getSkillLevelColor(skill.level) }}>{skill.level}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="jobp-empty-text">No skills added yet</p>
            )}
          </div>
        </div>

        {/* Languages Section */}
        <div className="jobp-profile-section">
          <div className="jobp-section-title">
            <div className="jobp-section-title-icon"><FaLanguage /></div>
            <h2>Languages</h2>
            {!editing && formData.languages.length === 0 && <span className="jobp-badge-empty">Not added</span>}
          </div>
          <div className="jobp-section-content">
            {formData.languages?.length > 0 ? (
              <div className="jobp-list-items">
                {safeRenderArray(formData.languages, (lang, index) => (
                  <div key={index} className="jobp-language-item">
                    <span className="jobp-language-name">{lang.language}</span>
                    <span className="jobp-language-proficiency">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="jobp-empty-text">No languages added yet</p>
            )}
          </div>
        </div>

        {/* Certifications Section */}
        <div className="jobp-profile-section">
          <div className="jobp-section-title">
            <div className="jobp-section-title-icon"><FaCertificate /></div>
            <h2>Certifications</h2>
            {!editing && formData.certifications.length === 0 && <span className="jobp-badge-empty">Not added</span>}
          </div>
          <div className="jobp-section-content">
            {formData.certifications?.length > 0 ? (
              <div className="jobp-list-items">
                {safeRenderArray(formData.certifications, (cert, index) => (
                  <div key={index} className="jobp-list-item">
                    <div className="jobp-list-item-header">
                      <h3>{cert.name}</h3>
                      <span className="jobp-list-date">Issued: {cert.issueDate}</span>
                    </div>
                    <div className="jobp-list-subtitle">{cert.issuingOrganization}</div>
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="jobp-cert-link">Verify Certificate <FaExternalLinkAlt /></a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="jobp-empty-text">No certifications added yet</p>
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div className="jobp-profile-section">
          <div className="jobp-section-title">
            <div className="jobp-section-title-icon"><FaRocket /></div>
            <h2>Projects</h2>
            {!editing && formData.projects.length === 0 && <span className="jobp-badge-empty">Not added</span>}
          </div>
          <div className="jobp-section-content">
            {formData.projects?.length > 0 ? (
              <div className="jobp-list-items">
                {safeRenderArray(formData.projects, (project, index) => (
                  <div key={index} className="jobp-list-item">
                    <div className="jobp-list-item-header">
                      <h3>{project.title}</h3>
                      <span className="jobp-list-date">{project.startDate} - {project.current ? 'Present' : project.endDate}</span>
                    </div>
                    <div className="jobp-list-description">{project.description}</div>
                    {project.technologies?.length > 0 && (
                      <div className="jobp-tech-tags">
                        {project.technologies.map((tech, i) => <span key={i} className="jobp-tech-tag">{tech}</span>)}
                      </div>
                    )}
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="jobp-project-link">View Project <FaExternalLinkAlt /></a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="jobp-empty-text">No projects added yet</p>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="jobp-profile-section">
          <div className="jobp-section-title">
            <div className="jobp-section-title-icon"><FaTrophy /></div>
            <h2>Achievements</h2>
            {!editing && formData.achievements.length === 0 && <span className="jobp-badge-empty">Not added</span>}
          </div>
          <div className="jobp-section-content">
            {formData.achievements?.length > 0 ? (
              <div className="jobp-list-items">
                {safeRenderArray(formData.achievements, (achievement, index) => (
                  <div key={index} className="jobp-list-item">
                    <div className="jobp-list-item-header">
                      <h3>{achievement.title}</h3>
                      <span className="jobp-list-date">{achievement.date}</span>
                    </div>
                    <div className="jobp-list-subtitle">{achievement.organization}</div>
                    <div className="jobp-list-description">{achievement.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="jobp-empty-text">No achievements added yet</p>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {editing && (
          <div className="jobp-edit-overlay">
            <div className="jobp-edit-modal">
              <div className="jobp-edit-modal-body">
                <button className="jobp-modal-close-btn" onClick={handleCancelEdit}>
                  <FaTimes />
                </button>

                {/* Basic Information */}
                <div className="jobp-edit-section">
                  <h3>Basic Information</h3>
                  <div className="jobp-form-group">
                    <label>Bio</label>
                    <textarea name="summary" value={formData.summary} onChange={handleInputChange} rows="4" placeholder="Tell us about yourself..." />
                  </div>
                  <div className="jobp-form-group">
                    <label>Phone Number</label>
                    <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="+94 XX XXX XXXX" />
                  </div>
                  <h4>Address</h4>
                  <div className="jobp-form-row">
                    <div className="jobp-form-group">
                      <input type="text" name="address.city" value={formData.address.city} onChange={handleInputChange} placeholder="City" />
                    </div>
                    <div className="jobp-form-group">
                      <input type="text" name="address.country" value={formData.address.country} onChange={handleInputChange} placeholder="Country" />
                    </div>
                  </div>
                  <div className="jobp-form-group">
                    <label>Portfolio Website</label>
                    <input type="url" name="portfolio" value={formData.portfolio} onChange={handleInputChange} placeholder="https://yourportfolio.com" />
                  </div>
                </div>

                {/* Social Links */}
                <div className="jobp-edit-section">
                  <h3>Social Links</h3>
                  <div className="jobp-form-group">
                    <label>LinkedIn</label>
                    <input type="url" name="socialLinks.linkedin" value={formData.socialLinks.linkedin} onChange={handleInputChange} placeholder="https://linkedin.com/in/username" />
                  </div>
                  <div className="jobp-form-group">
                    <label>GitHub</label>
                    <input type="url" name="socialLinks.github" value={formData.socialLinks.github} onChange={handleInputChange} placeholder="https://github.com/username" />
                  </div>
                  <div className="jobp-form-group">
                    <label>Twitter</label>
                    <input type="url" name="socialLinks.twitter" value={formData.socialLinks.twitter} onChange={handleInputChange} placeholder="https://twitter.com/username" />
                  </div>
                </div>

                {/* Education Section */}
                <div className="jobp-edit-section">
                  <div className="jobp-section-header">
                    <h3>Education</h3>
                    <button className="jobp-add-btn" onClick={() => setShowEducationForm(true)}><FaPlus /> Add Education</button>
                  </div>
                  {safeRenderArray(formData.education, (edu, index) => (
                    <div key={index} className="jobp-item-card">
                      <div className="jobp-item-content">
                        <h4>{edu.degree}</h4>
                        <p>{edu.institution}</p>
                        <p className="jobp-date">{edu.startDate} - {edu.endDate || 'Present'}</p>
                      </div>
                      <div className="jobp-item-actions">
                        <button className="jobp-edit-btn" onClick={() => handleEditEducation(index)}><FaEdit /></button>
                        <button className="jobp-delete-btn" onClick={() => handleRemoveEducation(index)}><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Experience Section */}
                <div className="jobp-edit-section">
                  <div className="jobp-section-header">
                    <h3>Experience</h3>
                    <button className="jobp-add-btn" onClick={() => setShowExperienceForm(true)}><FaPlus /> Add Experience</button>
                  </div>
                  {safeRenderArray(formData.experience, (exp, index) => (
                    <div key={index} className="jobp-item-card">
                      <div className="jobp-item-content">
                        <h4>{exp.jobTitle}</h4>
                        <p>{exp.company}</p>
                        <p className="jobp-date">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                      </div>
                      <div className="jobp-item-actions">
                        <button className="jobp-edit-btn" onClick={() => handleEditExperience(index)}><FaEdit /></button>
                        <button className="jobp-delete-btn" onClick={() => handleRemoveExperience(index)}><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Skills Section */}
                <div className="jobp-edit-section">
                  <div className="jobp-section-header">
                    <h3>Skills</h3>
                    <button className="jobp-add-btn" onClick={() => setShowSkillForm(true)}><FaPlus /> Add Skill</button>
                  </div>
                  <div className="jobp-skills-tags">
                    {safeRenderArray(formData.skills, (skill, index) => (
                      <div key={index} className="jobp-skill-chip">
                        <span>{skill.name}</span>
                        <button onClick={() => handleRemoveSkill(index)}><FaTimes /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Languages Section */}
                <div className="jobp-edit-section">
                  <div className="jobp-section-header">
                    <h3>Languages</h3>
                    <button className="jobp-add-btn" onClick={() => setShowLanguageForm(true)}><FaPlus /> Add Language</button>
                  </div>
                  {safeRenderArray(formData.languages, (lang, index) => (
                    <div key={index} className="jobp-item-card">
                      <div className="jobp-item-content">
                        <h4>{lang.language}</h4>
                        <p className="jobp-level">{lang.proficiency}</p>
                      </div>
                      <div className="jobp-item-actions">
                        <button className="jobp-edit-btn" onClick={() => handleEditLanguage(index)}><FaEdit /></button>
                        <button className="jobp-delete-btn" onClick={() => handleRemoveLanguage(index)}><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Certifications Section */}
                <div className="jobp-edit-section">
                  <div className="jobp-section-header">
                    <h3>Certifications</h3>
                    <button className="jobp-add-btn" onClick={() => setShowCertForm(true)}><FaPlus /> Add Certification</button>
                  </div>
                  {safeRenderArray(formData.certifications, (cert, index) => (
                    <div key={index} className="jobp-item-card">
                      <div className="jobp-item-content">
                        <h4>{cert.name}</h4>
                        <p>{cert.issuingOrganization}</p>
                      </div>
                      <div className="jobp-item-actions">
                        <button className="jobp-edit-btn" onClick={() => handleEditCertification(index)}><FaEdit /></button>
                        <button className="jobp-delete-btn" onClick={() => handleRemoveCertification(index)}><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Projects Section */}
                <div className="jobp-edit-section">
                  <div className="jobp-section-header">
                    <h3>Projects</h3>
                    <button className="jobp-add-btn" onClick={() => setShowProjectForm(true)}><FaPlus /> Add Project</button>
                  </div>
                  {safeRenderArray(formData.projects, (project, index) => (
                    <div key={index} className="jobp-item-card">
                      <div className="jobp-item-content">
                        <h4>{project.title}</h4>
                        <p className="jobp-date">{project.startDate} - {project.current ? 'Present' : project.endDate}</p>
                      </div>
                      <div className="jobp-item-actions">
                        <button className="jobp-edit-btn" onClick={() => handleEditProject(index)}><FaEdit /></button>
                        <button className="jobp-delete-btn" onClick={() => handleRemoveProject(index)}><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Achievements Section */}
                <div className="jobp-edit-section">
                  <div className="jobp-section-header">
                    <h3>Achievements</h3>
                    <button className="jobp-add-btn" onClick={() => setShowAchievementForm(true)}><FaPlus /> Add Achievement</button>
                  </div>
                  {safeRenderArray(formData.achievements, (achievement, index) => (
                    <div key={index} className="jobp-item-card">
                      <div className="jobp-item-content">
                        <h4>{achievement.title}</h4>
                        <p>{achievement.organization} • {achievement.date}</p>
                      </div>
                      <div className="jobp-item-actions">
                        <button className="jobp-edit-btn" onClick={() => handleEditAchievement(index)}><FaEdit /></button>
                        <button className="jobp-delete-btn" onClick={() => handleRemoveAchievement(index)}><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="jobp-form-actions">
                  <button className="jobp-cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                  <button className="jobp-save-btn" onClick={handleSubmit} disabled={saving}>
                    {saving ? <><FaSpinner className="jobp-fa-spin" /> Saving...</> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Education Modal */}
        {showEducationForm && (
          <div className="jobp-modal-overlay" onClick={() => { setShowEducationForm(false); resetEducationForm(); setEditingIndex(null); setEditingType(null); }}>
            <div className="jobp-modal" onClick={e => e.stopPropagation()}>
              <div className="jobp-modal-header">
                <h3>{editingIndex !== null ? 'Edit Education' : 'Add Education'}</h3>
                <button className="jobp-close-btn" onClick={() => { setShowEducationForm(false); resetEducationForm(); }}><FaTimes /></button>
              </div>
              <div className="jobp-modal-body">
                <input type="text" placeholder="Degree *" value={newEducation.degree} onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})} />
                <input type="text" placeholder="Institution *" value={newEducation.institution} onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})} />
                <input type="text" placeholder="Field of Study" value={newEducation.fieldOfStudy} onChange={(e) => setNewEducation({...newEducation, fieldOfStudy: e.target.value})} />
                <div className="jobp-form-row">
                  <input type="text" placeholder="Start Date" value={newEducation.startDate} onChange={(e) => setNewEducation({...newEducation, startDate: e.target.value})} />
                  <input type="text" placeholder="End Date" value={newEducation.endDate} onChange={(e) => setNewEducation({...newEducation, endDate: e.target.value})} />
                </div>
                <input type="text" placeholder="Grade" value={newEducation.grade} onChange={(e) => setNewEducation({...newEducation, grade: e.target.value})} />
                <textarea placeholder="Description" value={newEducation.description} onChange={(e) => setNewEducation({...newEducation, description: e.target.value})} rows="3" />
              </div>
              <div className="jobp-modal-footer">
                <button className="jobp-cancel-btn" onClick={() => { setShowEducationForm(false); resetEducationForm(); }}>Cancel</button>
                <button className="jobp-save-btn" onClick={handleAddEducation}>{editingIndex !== null ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Experience Modal */}
        {showExperienceForm && (
          <div className="jobp-modal-overlay" onClick={() => { setShowExperienceForm(false); resetExperienceForm(); setEditingIndex(null); setEditingType(null); }}>
            <div className="jobp-modal" onClick={e => e.stopPropagation()}>
              <div className="jobp-modal-header">
                <h3>{editingIndex !== null ? 'Edit Experience' : 'Add Experience'}</h3>
                <button className="jobp-close-btn" onClick={() => { setShowExperienceForm(false); resetExperienceForm(); }}><FaTimes /></button>
              </div>
              <div className="jobp-modal-body">
                <input type="text" placeholder="Job Title *" value={newExperience.jobTitle} onChange={(e) => setNewExperience({...newExperience, jobTitle: e.target.value})} />
                <input type="text" placeholder="Company *" value={newExperience.company} onChange={(e) => setNewExperience({...newExperience, company: e.target.value})} />
                <input type="text" placeholder="Location" value={newExperience.location} onChange={(e) => setNewExperience({...newExperience, location: e.target.value})} />
                <div className="jobp-form-row">
                  <input type="text" placeholder="Start Date" value={newExperience.startDate} onChange={(e) => setNewExperience({...newExperience, startDate: e.target.value})} />
                  <input type="text" placeholder="End Date" value={newExperience.endDate} onChange={(e) => setNewExperience({...newExperience, endDate: e.target.value})} disabled={newExperience.current} />
                </div>
                <label className="jobp-checkbox">
                  <input type="checkbox" checked={newExperience.current} onChange={(e) => setNewExperience({...newExperience, current: e.target.checked})} />
                  I currently work here
                </label>
                <textarea placeholder="Description" value={newExperience.description} onChange={(e) => setNewExperience({...newExperience, description: e.target.value})} rows="3" />
              </div>
              <div className="jobp-modal-footer">
                <button className="jobp-cancel-btn" onClick={() => { setShowExperienceForm(false); resetExperienceForm(); }}>Cancel</button>
                <button className="jobp-save-btn" onClick={handleAddExperience}>{editingIndex !== null ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Skill Modal */}
        {showSkillForm && (
          <div className="jobp-modal-overlay" onClick={() => { setShowSkillForm(false); setEditingIndex(null); setEditingType(null); }}>
            <div className="jobp-modal" onClick={e => e.stopPropagation()}>
              <div className="jobp-modal-header">
                <h3>{editingIndex !== null ? 'Edit Skill' : 'Add Skill'}</h3>
                <button className="jobp-close-btn" onClick={() => { setShowSkillForm(false); }}><FaTimes /></button>
              </div>
              <div className="jobp-modal-body">
                <input type="text" placeholder="Skill Name *" value={newSkill.name} onChange={(e) => setNewSkill({...newSkill, name: e.target.value})} />
                <select value={newSkill.level} onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
                <input type="text" placeholder="Years of Experience" value={newSkill.yearsOfExperience} onChange={(e) => setNewSkill({...newSkill, yearsOfExperience: e.target.value})} />
              </div>
              <div className="jobp-modal-footer">
                <button className="jobp-cancel-btn" onClick={() => { setShowSkillForm(false); }}>Cancel</button>
                <button className="jobp-save-btn" onClick={handleAddSkill}>{editingIndex !== null ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Language Modal */}
        {showLanguageForm && (
          <div className="jobp-modal-overlay" onClick={() => { setShowLanguageForm(false); setEditingIndex(null); setEditingType(null); }}>
            <div className="jobp-modal" onClick={e => e.stopPropagation()}>
              <div className="jobp-modal-header">
                <h3>{editingIndex !== null ? 'Edit Language' : 'Add Language'}</h3>
                <button className="jobp-close-btn" onClick={() => { setShowLanguageForm(false); }}><FaTimes /></button>
              </div>
              <div className="jobp-modal-body">
                <input type="text" placeholder="Language *" value={newLanguage.language} onChange={(e) => setNewLanguage({...newLanguage, language: e.target.value})} />
                <select value={newLanguage.proficiency} onChange={(e) => setNewLanguage({...newLanguage, proficiency: e.target.value})}>
                  <option value="Basic">Basic</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Professional">Professional</option>
                  <option value="Native">Native</option>
                </select>
                <input type="text" placeholder="Certification (optional)" value={newLanguage.certification} onChange={(e) => setNewLanguage({...newLanguage, certification: e.target.value})} />
              </div>
              <div className="jobp-modal-footer">
                <button className="jobp-cancel-btn" onClick={() => { setShowLanguageForm(false); }}>Cancel</button>
                <button className="jobp-save-btn" onClick={handleAddLanguage}>{editingIndex !== null ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Certification Modal */}
        {showCertForm && (
          <div className="jobp-modal-overlay" onClick={() => { setShowCertForm(false); resetCertForm(); setEditingIndex(null); setEditingType(null); }}>
            <div className="jobp-modal" onClick={e => e.stopPropagation()}>
              <div className="jobp-modal-header">
                <h3>{editingIndex !== null ? 'Edit Certification' : 'Add Certification'}</h3>
                <button className="jobp-close-btn" onClick={() => { setShowCertForm(false); resetCertForm(); }}><FaTimes /></button>
              </div>
              <div className="jobp-modal-body">
                <input type="text" placeholder="Certification Name *" value={newCertification.name} onChange={(e) => setNewCertification({...newCertification, name: e.target.value})} />
                <input type="text" placeholder="Issuing Organization *" value={newCertification.issuingOrganization} onChange={(e) => setNewCertification({...newCertification, issuingOrganization: e.target.value})} />
                <div className="jobp-form-row">
                  <input type="text" placeholder="Issue Date" value={newCertification.issueDate} onChange={(e) => setNewCertification({...newCertification, issueDate: e.target.value})} />
                  <input type="text" placeholder="Expiration Date" value={newCertification.expirationDate} onChange={(e) => setNewCertification({...newCertification, expirationDate: e.target.value})} />
                </div>
                <input type="text" placeholder="Credential ID" value={newCertification.credentialId} onChange={(e) => setNewCertification({...newCertification, credentialId: e.target.value})} />
                <input type="url" placeholder="Credential URL" value={newCertification.credentialUrl} onChange={(e) => setNewCertification({...newCertification, credentialUrl: e.target.value})} />
              </div>
              <div className="jobp-modal-footer">
                <button className="jobp-cancel-btn" onClick={() => { setShowCertForm(false); resetCertForm(); }}>Cancel</button>
                <button className="jobp-save-btn" onClick={handleAddCertification}>{editingIndex !== null ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Project Modal */}
        {showProjectForm && (
          <div className="jobp-modal-overlay" onClick={() => { setShowProjectForm(false); resetProjectForm(); setEditingIndex(null); setEditingType(null); }}>
            <div className="jobp-modal" onClick={e => e.stopPropagation()}>
              <div className="jobp-modal-header">
                <h3>{editingIndex !== null ? 'Edit Project' : 'Add Project'}</h3>
                <button className="jobp-close-btn" onClick={() => { setShowProjectForm(false); resetProjectForm(); }}><FaTimes /></button>
              </div>
              <div className="jobp-modal-body">
                <input type="text" placeholder="Project Title *" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} />
                <textarea placeholder="Description" value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} rows="3" />
                <div className="jobp-form-row">
                  <input type="text" placeholder="Start Date" value={newProject.startDate} onChange={(e) => setNewProject({...newProject, startDate: e.target.value})} />
                  <input type="text" placeholder="End Date" value={newProject.endDate} onChange={(e) => setNewProject({...newProject, endDate: e.target.value})} disabled={newProject.current} />
                </div>
                <label className="jobp-checkbox">
                  <input type="checkbox" checked={newProject.current} onChange={(e) => setNewProject({...newProject, current: e.target.checked})} />
                  Ongoing project
                </label>
                <input type="url" placeholder="Project URL" value={newProject.url} onChange={(e) => setNewProject({...newProject, url: e.target.value})} />
                <input type="text" placeholder="Technologies (comma separated)" value={newProject.technologies.join(', ')} onChange={(e) => setNewProject({...newProject, technologies: e.target.value.split(',').map(t => t.trim())})} />
              </div>
              <div className="jobp-modal-footer">
                <button className="jobp-cancel-btn" onClick={() => { setShowProjectForm(false); resetProjectForm(); }}>Cancel</button>
                <button className="jobp-save-btn" onClick={handleAddProject}>{editingIndex !== null ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Achievement Modal */}
        {showAchievementForm && (
          <div className="jobp-modal-overlay" onClick={() => { setShowAchievementForm(false); resetAchievementForm(); setEditingIndex(null); setEditingType(null); }}>
            <div className="jobp-modal" onClick={e => e.stopPropagation()}>
              <div className="jobp-modal-header">
                <h3>{editingIndex !== null ? 'Edit Achievement' : 'Add Achievement'}</h3>
                <button className="jobp-close-btn" onClick={() => { setShowAchievementForm(false); resetAchievementForm(); }}><FaTimes /></button>
              </div>
              <div className="jobp-modal-body">
                <input type="text" placeholder="Title *" value={newAchievement.title} onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})} />
                <select value={newAchievement.type} onChange={(e) => setNewAchievement({...newAchievement, type: e.target.value})}>
                  <option value="award">Award</option>
                  <option value="honor">Honor</option>
                  <option value="recognition">Recognition</option>
                </select>
                <input type="text" placeholder="Organization" value={newAchievement.organization} onChange={(e) => setNewAchievement({...newAchievement, organization: e.target.value})} />
                <input type="text" placeholder="Date" value={newAchievement.date} onChange={(e) => setNewAchievement({...newAchievement, date: e.target.value})} />
                <textarea placeholder="Description" value={newAchievement.description} onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})} rows="3" />
              </div>
              <div className="jobp-modal-footer">
                <button className="jobp-cancel-btn" onClick={() => { setShowAchievementForm(false); resetAchievementForm(); }}>Cancel</button>
                <button className="jobp-save-btn" onClick={handleAddAchievement}>{editingIndex !== null ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;