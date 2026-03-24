import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaSave, 
  FaTimes, 
  FaPlus, 
  FaTrash, 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaDollarSign,
  FaClock,
  FaGlobe,
  FaGraduationCap,
  FaCode,
  FaHeart,
  FaBuilding,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUserTie,
  FaTasks,
  FaListUl,
  FaCalendarAlt,
  FaTag
} from 'react-icons/fa';

const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    employmentType: 'Full-time',
    workMode: 'Remote',
    location: {
      city: '',
      state: '',
      country: '',
      address: ''
    },
    salary: {
      min: '',
      max: '',
      currency: 'USD',
      isNegotiable: false
    },
    experience: {
      min: '',
      max: '',
      level: 'Entry'
    },
    education: {
      level: '',
      field: ''
    },
    skills: [{ name: '', importance: 'Required' }],
    benefits: [''],
    applicationDeadline: '',
    category: '',
    tags: []
  });

  // Check company profile on component mount
  useEffect(() => {
    checkCompanyProfile();
  }, []);

  const checkCompanyProfile = async () => {
    try {
      setCheckingProfile(true);
      console.log('Checking company profile...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      const response = await API.get('/companies/profile');
      console.log('Company profile response:', response.data);
      
      if (response.data.success && response.data.company) {
        const profile = response.data.company;
        setCompanyProfile(profile);
        
        const hasRequiredFields = profile.companyName && profile.companyName.trim() !== '';
        
        if (hasRequiredFields) {
          setProfileComplete(true);
          console.log('Company profile is complete');
        } else {
          console.log('Company profile is incomplete');
          setProfileComplete(false);
          toast.info('Please complete your company profile before posting a job');
        }
      } else {
        console.log('No company profile found');
        setProfileComplete(false);
        toast.warning('Please create your company profile first');
      }
    } catch (error) {
      console.error('Error checking company profile:', error);
      
      if (error.response?.status === 404) {
        setProfileComplete(false);
        toast.warning('Please create your company profile first');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to verify company profile');
      }
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleChange = (e) => {
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
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    });
  };

  const removeArrayItem = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  const handleSkillChange = (index, field, value) => {
    const newSkills = [...formData.skills];
    newSkills[index][field] = value;
    setFormData({ ...formData, skills: newSkills });
  };

  const addSkill = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, { name: '', importance: 'Required' }]
    });
  };

  const removeSkill = (index) => {
    const newSkills = formData.skills.filter((_, i) => i !== index);
    setFormData({ ...formData, skills: newSkills });
  };

  const handleTagsChange = (e) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setFormData({ ...formData, tags: tagsArray });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Job title is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Job description is required');
      return false;
    }
    if (formData.description.trim().length < 50) {
      toast.error('Job description must be at least 50 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileComplete) {
      toast.error('Please complete your company profile first');
      navigate('/company/profile');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting job data:', formData);
      
      const jobData = {
        ...formData,
        salary: {
          ...formData.salary,
          min: formData.salary.min ? parseInt(formData.salary.min) : 0,
          max: formData.salary.max ? parseInt(formData.salary.max) : 0
        },
        experience: {
          ...formData.experience,
          min: formData.experience.min ? parseInt(formData.experience.min) : 0,
          max: formData.experience.max ? parseInt(formData.experience.max) : 0
        },
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        responsibilities: formData.responsibilities.filter(resp => resp.trim() !== ''),
        benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
        skills: formData.skills.filter(skill => skill.name.trim() !== ''),
        tags: formData.tags || []
      };

      const response = await API.post('/jobs', jobData);
      
      if (response.data.success) {
        toast.success('Job posted successfully!');
        navigate('/company/manage-jobs');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      
      if (error.response) {
        if (error.response.status === 404 && error.response.data?.message.includes('Company profile')) {
          toast.error('Company profile not found. Please complete your profile first.');
          navigate('/company/profile');
        } else {
          toast.error(error.response.data?.message || 'Failed to post job');
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const goToProfile = () => {
    navigate('/company/profile');
  };

  if (checkingProfile) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Checking company profile...</h4>
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div className="ds-container">
        <div className="ds-card ds-card-warning">
          <div className="ds-card-body ds-text-center">
            <div className="ds-warning-icon">
              <FaBuilding size={60} className="ds-text-warning" />
            </div>
            <h3 className="ds-mt-3">Company Profile Required</h3>
            <p className="ds-text-muted">
              You need to complete your company profile before you can post jobs.
              This helps candidates learn more about your company.
            </p>
            {companyProfile && !companyProfile.companyName && (
              <div className="ds-alert ds-alert-info ds-mt-3">
                <FaExclamationTriangle className="ds-mr-2" />
                Your profile is missing the company name. Please add it to continue.
              </div>
            )}
            <div className="ds-button-group ds-mt-4">
              <button className="ds-btn ds-btn-primary" onClick={goToProfile}>
                Complete Company Profile
              </button>
              <button className="ds-btn ds-btn-outline-secondary" onClick={() => navigate('/company/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-post-job">
      <div className="ds-post-job-header">
        <div className="ds-header-left">
          <FaBriefcase className="ds-header-icon" />
          <h1>Post a New Job</h1>
        </div>
      </div>

      {/* Verification Status Banner */}
      {companyProfile && !companyProfile.verified && (
        <div className="ds-alert ds-alert-warning">
          <FaExclamationTriangle className="ds-alert-icon" />
          <div className="ds-alert-content">
            <strong>Your company profile is pending verification.</strong>
            <p>You can still post jobs, but verified companies receive more visibility and trust from candidates.</p>
          </div>
        </div>
      )}

      {/* Company Info Banner */}
      <div className="ds-alert ds-alert-success">
        <FaCheckCircle className="ds-alert-icon" />
        <div className="ds-alert-content">
          <strong>Posting as: {companyProfile?.companyName}</strong>
          <p>All jobs will be posted under this company name</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ds-post-job-form">
        {/* Basic Information */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaBriefcase className="ds-section-icon" />
            <h3>Basic Information</h3>
          </div>
          <div className="ds-section-body">
            <div className="ds-form-group">
              <label>Job Title <span className="ds-required">*</span></label>
              <input
                type="text"
                className="ds-form-control"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            <div className="ds-form-row">
              <div className="ds-form-group">
                <label>Employment Type <span className="ds-required">*</span></label>
                <select
                  className="ds-form-control"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>

              <div className="ds-form-group">
                <label>Work Mode <span className="ds-required">*</span></label>
                <select
                  className="ds-form-control"
                  name="workMode"
                  value={formData.workMode}
                  onChange={handleChange}
                >
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaMapMarkerAlt className="ds-section-icon" />
            <h3>Location</h3>
          </div>
          <div className="ds-section-body">
            <div className="ds-form-row">
              <div className="ds-form-group">
                <label>City</label>
                <input
                  type="text"
                  className="ds-form-control"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="e.g., Colombo"
                />
              </div>
              <div className="ds-form-group">
                <label>Country</label>
                <input
                  type="text"
                  className="ds-form-control"
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleChange}
                  placeholder="e.g., Sri Lanka"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaDollarSign className="ds-section-icon" />
            <h3>Salary</h3>
          </div>
          <div className="ds-section-body">
            <div className="ds-form-row">
              <div className="ds-form-group">
                <label>Minimum (per year)</label>
                <input
                  type="number"
                  className="ds-form-control"
                  name="salary.min"
                  value={formData.salary.min}
                  onChange={handleChange}
                  placeholder="e.g., 50000"
                />
              </div>
              <div className="ds-form-group">
                <label>Maximum (per year)</label>
                <input
                  type="number"
                  className="ds-form-control"
                  name="salary.max"
                  value={formData.salary.max}
                  onChange={handleChange}
                  placeholder="e.g., 80000"
                />
              </div>
              <div className="ds-form-group">
                <label>Currency</label>
                <select
                  className="ds-form-control"
                  name="salary.currency"
                  value={formData.salary.currency}
                  onChange={handleChange}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="LKR">LKR (Rs)</option>
                </select>
              </div>
            </div>
            <div className="ds-checkbox">
              <input
                type="checkbox"
                id="isNegotiable"
                name="salary.isNegotiable"
                checked={formData.salary.isNegotiable}
                onChange={(e) => setFormData({
                  ...formData,
                  salary: { ...formData.salary, isNegotiable: e.target.checked }
                })}
              />
              <label htmlFor="isNegotiable">Salary is negotiable</label>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaClock className="ds-section-icon" />
            <h3>Experience Required</h3>
          </div>
          <div className="ds-section-body">
            <div className="ds-form-row">
              <div className="ds-form-group">
                <label>Minimum Years</label>
                <input
                  type="number"
                  className="ds-form-control"
                  name="experience.min"
                  value={formData.experience.min}
                  onChange={handleChange}
                  placeholder="e.g., 2"
                />
              </div>
              <div className="ds-form-group">
                <label>Maximum Years</label>
                <input
                  type="number"
                  className="ds-form-control"
                  name="experience.max"
                  value={formData.experience.max}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                />
              </div>
              <div className="ds-form-group">
                <label>Level</label>
                <select
                  className="ds-form-control"
                  name="experience.level"
                  value={formData.experience.level}
                  onChange={handleChange}
                >
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                  <option value="Lead">Lead</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaGraduationCap className="ds-section-icon" />
            <h3>Education</h3>
          </div>
          <div className="ds-section-body">
            <div className="ds-form-row">
              <div className="ds-form-group">
                <label>Education Level</label>
                <input
                  type="text"
                  className="ds-form-control"
                  name="education.level"
                  value={formData.education.level}
                  onChange={handleChange}
                  placeholder="e.g., Bachelor's Degree"
                />
              </div>
              <div className="ds-form-group">
                <label>Field of Study</label>
                <input
                  type="text"
                  className="ds-form-control"
                  name="education.field"
                  value={formData.education.field}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaGlobe className="ds-section-icon" />
            <h3>Job Description <span className="ds-required">*</span></h3>
          </div>
          <div className="ds-section-body">
            <textarea
              className="ds-form-control"
              rows="6"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the job, including responsibilities, qualifications, and any other relevant information..."
            />
            <div className="ds-form-hint">
              Minimum 50 characters. Currently: <strong>{formData.description.length}</strong> characters
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaListUl className="ds-section-icon" />
            <h3>Requirements</h3>
            <button type="button" className="ds-btn-icon" onClick={() => addArrayItem('requirements')}>
              <FaPlus /> Add Requirement
            </button>
          </div>
          <div className="ds-section-body">
            {formData.requirements.length === 0 ? (
              <p className="ds-empty-message-small">No requirements added</p>
            ) : (
              formData.requirements.map((req, index) => (
                <div key={index} className="ds-input-group">
                  <input
                    type="text"
                    className="ds-form-control"
                    value={req}
                    onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                    placeholder={`Requirement ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="ds-btn-remove"
                    onClick={() => removeArrayItem('requirements', index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Responsibilities */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaTasks className="ds-section-icon" />
            <h3>Responsibilities</h3>
            <button type="button" className="ds-btn-icon" onClick={() => addArrayItem('responsibilities')}>
              <FaPlus /> Add Responsibility
            </button>
          </div>
          <div className="ds-section-body">
            {formData.responsibilities.length === 0 ? (
              <p className="ds-empty-message-small">No responsibilities added</p>
            ) : (
              formData.responsibilities.map((resp, index) => (
                <div key={index} className="ds-input-group">
                  <input
                    type="text"
                    className="ds-form-control"
                    value={resp}
                    onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="ds-btn-remove"
                    onClick={() => removeArrayItem('responsibilities', index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaCode className="ds-section-icon" />
            <h3>Skills</h3>
            <button type="button" className="ds-btn-icon" onClick={addSkill}>
              <FaPlus /> Add Skill
            </button>
          </div>
          <div className="ds-section-body">
            {formData.skills.length === 0 ? (
              <p className="ds-empty-message-small">No skills added</p>
            ) : (
              formData.skills.map((skill, index) => (
                <div key={index} className="ds-skill-row">
                  <input
                    type="text"
                    className="ds-form-control"
                    placeholder="Skill name (e.g., JavaScript)"
                    value={skill.name}
                    onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                  />
                  <select
                    className="ds-form-control"
                    value={skill.importance}
                    onChange={(e) => handleSkillChange(index, 'importance', e.target.value)}
                  >
                    <option value="Required">Required</option>
                    <option value="Preferred">Preferred</option>
                    <option value="Optional">Optional</option>
                  </select>
                  <button
                    type="button"
                    className="ds-btn-remove"
                    onClick={() => removeSkill(index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaHeart className="ds-section-icon" />
            <h3>Benefits</h3>
            <button type="button" className="ds-btn-icon" onClick={() => addArrayItem('benefits')}>
              <FaPlus /> Add Benefit
            </button>
          </div>
          <div className="ds-section-body">
            {formData.benefits.length === 0 ? (
              <p className="ds-empty-message-small">No benefits added</p>
            ) : (
              formData.benefits.map((benefit, index) => (
                <div key={index} className="ds-input-group">
                  <input
                    type="text"
                    className="ds-form-control"
                    value={benefit}
                    onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                    placeholder={`Benefit ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="ds-btn-remove"
                    onClick={() => removeArrayItem('benefits', index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="ds-form-section">
          <div className="ds-section-header">
            <FaTag className="ds-section-icon" />
            <h3>Additional Information</h3>
          </div>
          <div className="ds-section-body">
            <div className="ds-form-row">
              <div className="ds-form-group">
                <label>Category</label>
                <input
                  type="text"
                  className="ds-form-control"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>
              <div className="ds-form-group">
                <label>Application Deadline</label>
                <input
                  type="date"
                  className="ds-form-control"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="ds-form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                className="ds-form-control"
                placeholder="e.g., remote, urgent, senior"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="ds-form-actions">
          <button 
            type="submit" 
            className="ds-btn ds-btn-primary ds-btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="ds-spinner-small"></div>
                Posting...
              </>
            ) : (
              <>
                <FaSave /> Post Job
              </>
            )}
          </button>
          <button 
            type="button" 
            className="ds-btn ds-btn-outline-secondary ds-btn-lg"
            onClick={() => navigate('/company/dashboard')}
          >
            <FaTimes /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJob;