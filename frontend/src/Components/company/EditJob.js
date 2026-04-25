import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';

const EditJob = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  
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
    tags: [],
    status: 'active'
  });

  useEffect(() => {
    fetchJobDetails();
    checkCompanyProfile();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/companies/jobs/${id}`);
      
      if (response.data.success) {
        const jobData = response.data.job;
        setJob(jobData);
        
        // Format the data for the form
        setFormData({
          title: jobData.title || '',
          description: jobData.description || '',
          requirements: jobData.requirements?.length ? jobData.requirements : [''],
          responsibilities: jobData.responsibilities?.length ? jobData.responsibilities : [''],
          employmentType: jobData.employmentType || 'Full-time',
          workMode: jobData.workMode || 'Remote',
          location: {
            city: jobData.location?.city || '',
            state: jobData.location?.state || '',
            country: jobData.location?.country || '',
            address: jobData.location?.address || ''
          },
          salary: {
            min: jobData.salary?.min || '',
            max: jobData.salary?.max || '',
            currency: jobData.salary?.currency || 'USD',
            isNegotiable: jobData.salary?.isNegotiable || false
          },
          experience: {
            min: jobData.experience?.min || '',
            max: jobData.experience?.max || '',
            level: jobData.experience?.level || 'Entry'
          },
          education: {
            level: jobData.education?.level || '',
            field: jobData.education?.field || ''
          },
          skills: jobData.skills?.length ? jobData.skills : [{ name: '', importance: 'Required' }],
          benefits: jobData.benefits?.length ? jobData.benefits : [''],
          applicationDeadline: jobData.applicationDeadline?.split('T')[0] || '',
          category: jobData.category || '',
          tags: jobData.tags || [],
          status: jobData.status || 'active'
        });
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
      navigate('/company/manage-jobs');
    } finally {
      setLoading(false);
    }
  };

  const checkCompanyProfile = async () => {
    try {
      const response = await API.get('/companies/profile');
      if (response.data.success) {
        setCompanyProfile(response.data.company);
      }
    } catch (error) {
      console.error('Error checking company profile:', error);
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

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Clean up the data before sending
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

      const response = await API.put(`/jobs/${id}`, jobData);
      
      if (response.data.success) {
        toast.success('Job updated successfully!');
        navigate('/company/manage-jobs');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      
      if (error.response) {
        toast.error(error.response.data?.message || 'Failed to update job');
      } else {
        toast.error('Error: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading job details...</p>
      </div>
    );
  }

  return (
    <div className="edit-job">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <FaBriefcase className="me-2 text-primary" />
          Edit Job
        </h2>
        <div>
          <span className={`badge bg-${formData.status === 'active' ? 'success' : 'secondary'} me-2`}>
            {formData.status}
          </span>
        </div>
      </div>

      {/* Company Info Banner */}
      {companyProfile && (
        <div className="alert alert-info mb-4 d-flex align-items-center">
          <FaCheckCircle className="me-2 text-info" size={20} />
          <div>
            <strong>Editing job for: {companyProfile.companyName}</strong>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Basic Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold">Job Title *</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Employment Type *</label>
                <select
                  className="form-select"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Work Mode *</label>
                <select
                  className="form-select"
                  name="workMode"
                  value={formData.workMode}
                  onChange={handleChange}
                  required
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
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              <FaMapMarkerAlt className="me-2 text-primary" />
              Location
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="e.g., Colombo"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-control"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  placeholder="e.g., Western"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Countrys</label>
                <input
                  type="text"
                  className="form-control"
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
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              <FaDollarSign className="me-2 text-primary" />
              Salary
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Minimum (per year)</label>
                <input
                  type="number"
                  className="form-control"
                  name="salary.min"
                  value={formData.salary.min}
                  onChange={handleChange}
                  placeholder="e.g., 50000"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Maximum (per year)</label>
                <input
                  type="number"
                  className="form-control"
                  name="salary.max"
                  value={formData.salary.max}
                  onChange={handleChange}
                  placeholder="e.g., 80000"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Currency</label>
                <select
                  className="form-select"
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
              <div className="col-md-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="salary.isNegotiable"
                    checked={formData.salary.isNegotiable}
                    onChange={(e) => setFormData({
                      ...formData,
                      salary: { ...formData.salary, isNegotiable: e.target.checked }
                    })}
                    id="isNegotiable"
                  />
                  <label className="form-check-label" htmlFor="isNegotiable">
                    Salary is negotiable
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              <FaClock className="me-2 text-primary" />
              Experience Required
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Minimum Years</label>
                <input
                  type="number"
                  className="form-control"
                  name="experience.min"
                  value={formData.experience.min}
                  onChange={handleChange}
                  placeholder="e.g., 2"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Maximum Years</label>
                <input
                  type="number"
                  className="form-control"
                  name="experience.max"
                  value={formData.experience.max}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Level</label>
                <select
                  className="form-select"
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
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              <FaGraduationCap className="me-2 text-primary" />
              Education
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Education Level</label>
                <input
                  type="text"
                  className="form-control"
                  name="education.level"
                  value={formData.education.level}
                  onChange={handleChange}
                  placeholder="e.g., Bachelor's Degree"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Field of Study</label>
                <input
                  type="text"
                  className="form-control"
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
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              <FaGlobe className="me-2 text-primary" />
              Job Description *
            </h5>
          </div>
          <div className="card-body">
            <textarea
              className="form-control"
              rows="6"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Provide a detailed description of the job, including responsibilities, qualifications, and any other relevant information..."
            />
            <small className="text-muted">
              Minimum 50 characters. Currently: {formData.description.length} characters
            </small>
          </div>
        </div>

        {/* Requirements */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Requirements</h5>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => addArrayItem('requirements')}>
              <FaPlus /> Add Requirement
            </button>
          </div>
          <div className="card-body">
            {formData.requirements.length === 0 ? (
              <p className="text-muted text-center py-3">No requirements added</p>
            ) : (
              formData.requirements.map((req, index) => (
                <div key={index} className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    value={req}
                    onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                    placeholder={`Requirement ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
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
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Responsibilities</h5>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => addArrayItem('responsibilities')}>
              <FaPlus /> Add Responsibility
            </button>
          </div>
          <div className="card-body">
            {formData.responsibilities.length === 0 ? (
              <p className="text-muted text-center py-3">No responsibilities added</p>
            ) : (
              formData.responsibilities.map((resp, index) => (
                <div key={index} className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    value={resp}
                    onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
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
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaCode className="me-2 text-primary" />
              Skills
            </h5>
            <button type="button" className="btn btn-sm btn-primary" onClick={addSkill}>
              <FaPlus /> Add Skill
            </button>
          </div>
          <div className="card-body">
            {formData.skills.length === 0 ? (
              <p className="text-muted text-center py-3">No skills added</p>
            ) : (
              formData.skills.map((skill, index) => (
                <div key={index} className="row mb-2">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Skill name (e.g., JavaScript)"
                      value={skill.name}
                      onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={skill.importance}
                      onChange={(e) => handleSkillChange(index, 'importance', e.target.value)}
                    >
                      <option value="Required">Required</option>
                      <option value="Preferred">Preferred</option>
                      <option value="Optional">Optional</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button
                      type="button"
                      className="btn btn-outline-danger w-100"
                      onClick={() => removeSkill(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaHeart className="me-2 text-primary" />
              Benefits
            </h5>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => addArrayItem('benefits')}>
              <FaPlus /> Add Benefit
            </button>
          </div>
          <div className="card-body">
            {formData.benefits.length === 0 ? (
              <p className="text-muted text-center py-3">No benefits added</p>
            ) : (
              formData.benefits.map((benefit, index) => (
                <div key={index} className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    value={benefit}
                    onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                    placeholder={`Benefit ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger"
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
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Additional Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-control"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Application Deadline</label>
                <input
                  type="date"
                  className="form-control"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="col-md-12">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., remote, urgent, senior"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="d-flex gap-2 mb-4">
          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            disabled={saving}
          >
            {saving ? (
              <>
                <FaSpinner className="fa-spin me-2" />
                Updating...
              </>
            ) : (
              <>
                <FaSave className="me-2" /> Update Job
              </>
            )}
          </button>
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-lg"
            onClick={() => navigate('/company/manage-jobs')}
          >
            <FaTimes className="me-2" /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditJob;