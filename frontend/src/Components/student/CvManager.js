import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaFileAlt, FaUpload, FaDownload, FaTrash, FaStar, FaRegStar,
  FaSearch, FaFilter, FaSyncAlt, FaEye, FaCheckCircle, FaTimesCircle,
  FaFilePdf, FaFileWord, FaFile, FaInfoCircle, FaExclamationTriangle,
  FaSpinner, FaChartLine, FaShare, FaLink, FaEnvelope, FaWhatsapp,FaSortUp,FaSortDown,
  FaTelegram, FaTwitter, FaLinkedin, FaCalendarAlt, FaClock, FaTimes
} from 'react-icons/fa';

const CvManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [cvTitle, setCvTitle] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCv, setSelectedCv] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    primary: 0,
    pdf: 0,
    doc: 0,
    other: 0,
    totalSize: 0
  });

  useEffect(() => {
    checkAuthAndFetchCVs();
  }, []);

  useEffect(() => {
    if (cvs.length > 0) {
      calculateStats();
    }
  }, [cvs]);

  const checkAuthAndFetchCVs = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Please login to view your CVs');
      setTimeout(() => navigate('/login'), 2000);
      setLoading(false);
      return;
    }

    if (!user) {
      setError('User data not found. Please login again.');
      setTimeout(() => navigate('/login'), 2000);
      setLoading(false);
      return;
    }

    if (user.role !== 'student') {
      setError('Access denied. Only students can manage CVs.');
      setTimeout(() => navigate('/'), 2000);
      setLoading(false);
      return;
    }

    await fetchCVs();
  };

  const fetchCVs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.get('/cv');
      
      if (response.data && response.data.success) {
        const cvsData = response.data.cvs || [];
        setCvs(cvsData);
      } else {
        setError('Failed to load CVs');
      }
    } catch (err) {
      console.error('Error fetching CVs:', err);
      
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else if (err.response) {
        if (err.response.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
        } else if (err.response.status === 403) {
          setError('You are not authorized to view CVs.');
        } else if (err.response.status === 404) {
          setCvs([]);
        } else {
          setError(err.response.data?.message || `Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        setError('No response from server. Please check if backend is running.');
      } else {
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = () => {
    const newStats = {
      total: cvs.length,
      primary: cvs.filter(cv => cv.isPrimary).length,
      pdf: cvs.filter(cv => cv.fileType?.includes('pdf')).length,
      doc: cvs.filter(cv => cv.fileType?.includes('document') || cv.fileType?.includes('msword')).length,
      other: cvs.filter(cv => !cv.fileType?.includes('pdf') && !cv.fileType?.includes('document') && !cv.fileType?.includes('msword')).length,
      totalSize: cvs.reduce((sum, cv) => sum + (cv.fileSize || 0), 0)
    };
    setStats(newStats);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, DOC, DOCX, and TXT files are allowed');
        return;
      }
      
      setSelectedFile(file);
      setCvTitle(file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('cv', selectedFile);
    formData.append('title', cvTitle || selectedFile.name);
    formData.append('isPrimary', isPrimary);

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await API.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      if (response.data.success) {
        toast.success('CV uploaded successfully!');
        setSelectedFile(null);
        setCvTitle('');
        setIsPrimary(false);
        setShowUploadModal(false);
        setUploadProgress(0);
        fetchCVs();
      }
    } catch (err) {
      console.error('Error uploading CV:', err);
      toast.error(err.response?.data?.message || 'Failed to upload CV');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (cvId) => {
    try {
      const response = await API.put(`/cv/${cvId}/primary`);
      if (response.data.success) {
        toast.success('CV set as primary successfully');
        fetchCVs();
      }
    } catch (err) {
      console.error('Error setting primary CV:', err);
      toast.error(err.response?.data?.message || 'Failed to set primary CV');
    }
  };

  const handleDelete = async (cvId) => {
    setDeleting(true);
    try {
      const response = await API.delete(`/cv/${cvId}`);
      if (response.data.success) {
        toast.success('CV deleted successfully');
        setShowDeleteModal(false);
        setSelectedCv(null);
        fetchCVs();
      }
    } catch (err) {
      console.error('Error deleting CV:', err);
      toast.error(err.response?.data?.message || 'Failed to delete CV');
    } finally {
      setDeleting(false);
    }
  };

  const handleAnalyze = (cvId) => {
    navigate(`/student/cv-analysis/${cvId}`);
  };

  const handleDownload = (cv) => {
    if (cv.filePath) {
      window.open(`http://localhost:5000/${cv.filePath}`, '_blank');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCVs();
  };

  const handleViewDetails = (cv) => {
    setSelectedCv(cv);
    setShowPreviewModal(true);
  };

  const handleShare = (cv) => {
    setSelectedCv(cv);
    setShowShareModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  const getFilteredAndSortedCVs = () => {
    let filtered = [...cvs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cv => 
        cv.title?.toLowerCase().includes(term) ||
        cv.filename?.toLowerCase().includes(term)
      );
    }

    if (filterType) {
      if (filterType === 'pdf') {
        filtered = filtered.filter(cv => cv.fileType?.includes('pdf'));
      } else if (filterType === 'doc') {
        filtered = filtered.filter(cv => cv.fileType?.includes('document') || cv.fileType?.includes('msword'));
      } else if (filterType === 'primary') {
        filtered = filtered.filter(cv => cv.isPrimary);
      }
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'name') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'size') {
        comparison = (a.fileSize || 0) - (b.fileSize || 0);
      } else if (sortBy === 'type') {
        comparison = (a.fileType || '').localeCompare(b.fileType || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FaFilePdf className="ds-file-icon-pdf" />;
    if (fileType?.includes('word') || fileType?.includes('document')) return <FaFileWord className="ds-file-icon-word" />;
    return <FaFileAlt className="ds-file-icon-default" />;
  };

  const filteredCVs = getFilteredAndSortedCVs();

  if (loading) {
    return (
      <div className="ds-loading-container">
        <div className="ds-spinner"></div>
        <h4>Loading your CVs...</h4>
        <p>Please wait while we fetch your documents</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ds-error-container">
        <div className="ds-error-card">
          <FaExclamationTriangle className="ds-error-icon" />
          <h3>Error Loading CVs</h3>
          <p>{error}</p>
          <div className="ds-error-actions">
            <button className="ds-btn ds-btn-primary" onClick={fetchCVs}>
              <FaSyncAlt /> Try Again
            </button>
            <button className="ds-btn ds-btn-outline-secondary" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-cv-manager">
      <div className="ds-cv-container">
        {/* Header */}
        <div className="ds-page-header">
          <div className="ds-header-left">
            <div className="ds-header-icon-wrapper">
              <FaFileAlt className="ds-header-icon" />
            </div>
            <div>
              <h1>CV Manager</h1>
              <p className="ds-header-subtitle">Upload and manage your resumes and CVs</p>
            </div>
          </div>
          <div className="ds-header-actions">
            <button className="ds-btn ds-btn-outline-primary" onClick={handleRefresh} disabled={refreshing}>
              <FaSyncAlt className={refreshing ? 'ds-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="ds-btn ds-btn-primary" onClick={() => setShowUploadModal(true)}>
              <FaUpload /> Upload New CV
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {cvs.length > 0 && (
          <div className="ds-stats-grid">
            <div className="ds-stat-card ds-stat-total">
              <div className="ds-stat-icon"><FaFileAlt /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{stats.total}</span>
                <span className="ds-stat-label">Total CVs</span>
              </div>
            </div>
            <div className="ds-stat-card ds-stat-primary">
              <div className="ds-stat-icon"><FaStar /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{stats.primary}</span>
                <span className="ds-stat-label">Primary CV</span>
              </div>
            </div>
            <div className="ds-stat-card ds-stat-pdf">
              <div className="ds-stat-icon"><FaFilePdf /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{stats.pdf}</span>
                <span className="ds-stat-label">PDF Format</span>
              </div>
            </div>
            <div className="ds-stat-card ds-stat-size">
              <div className="ds-stat-icon"><FaFileAlt /></div>
              <div className="ds-stat-info">
                <span className="ds-stat-value">{formatFileSize(stats.totalSize)}</span>
                <span className="ds-stat-label">Total Size</span>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {cvs.length > 0 && (
          <div className="ds-filters-card">
            <div className="ds-filters-content">
              <div className="ds-search-wrapper">
                <div className="ds-search-input-group">
                  <FaSearch className="ds-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by title or filename..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="ds-filters-row">
                <div className="ds-filter-group">
                  <label>File Type</label>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="primary">Primary CV</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC/DOCX</option>
                  </select>
                </div>
                <div className="ds-filter-group">
                  <label>Sort By</label>
                  <div className="ds-sort-wrapper">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="date">Date</option>
                      <option value="name">Name</option>
                      <option value="size">Size</option>
                      <option value="type">Type</option>
                    </select>
                    <button className="ds-sort-btn" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                      {sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                    </button>
                  </div>
                </div>
                <div className="ds-results-info">
                  <p>Showing <strong>{filteredCVs.length}</strong> of <strong>{cvs.length}</strong> CVs</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CV List */}
        {cvs.length === 0 ? (
          <div className="ds-empty-state">
            <div className="ds-empty-icon-wrapper">
              <FaFileAlt className="ds-empty-icon" />
            </div>
            <h3>No CVs Found</h3>
            <p>You haven't uploaded any CVs yet. Upload your first CV to get started!</p>
            <button className="ds-btn ds-btn-primary ds-btn-lg" onClick={() => setShowUploadModal(true)}>
              <FaUpload /> Upload Your First CV
            </button>
          </div>
        ) : filteredCVs.length === 0 ? (
          <div className="ds-empty-state">
            <div className="ds-empty-icon-wrapper">
              <FaSearch className="ds-empty-icon" />
            </div>
            <h3>No Matching CVs</h3>
            <p>No CVs match your search criteria.</p>
            <button className="ds-btn ds-btn-outline-primary" onClick={() => { setSearchTerm(''); setFilterType(''); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="ds-cvs-grid">
            {filteredCVs.map((cv) => (
              <div key={cv._id} className="ds-cv-card">
                <div className="ds-cv-card-header">
                  <div className="ds-cv-icon">
                    {getFileIcon(cv.fileType)}
                  </div>
                  <div className="ds-cv-info">
                    <h3 className="ds-cv-title">{cv.title}</h3>
                    <p className="ds-cv-meta">
                      {formatFileSize(cv.fileSize)} • {formatDate(cv.createdAt)}
                    </p>
                  </div>
                  {cv.isPrimary && (
                    <span className="ds-primary-badge">
                      <FaStar /> Primary
                    </span>
                  )}
                </div>

                <div className="ds-cv-tags">
                  <span className="ds-tag">{cv.fileType?.split('/')[1] || 'Unknown'}</span>
                  <span className="ds-tag">Views: {cv.analytics?.views || 0}</span>
                  <span className="ds-tag">Downloads: {cv.analytics?.downloads || 0}</span>
                </div>

                <div className="ds-cv-actions">
                  <button className="ds-action-btn ds-view-btn" onClick={() => handleViewDetails(cv)}>
                    <FaEye /> View
                  </button>
                  <button className="ds-action-btn ds-download-btn" onClick={() => handleDownload(cv)}>
                    <FaDownload /> Download
                  </button>
                  <button className="ds-action-btn ds-analyze-btn" onClick={() => handleAnalyze(cv._id)}>
                    <FaChartLine /> Analyze
                  </button>
                  {!cv.isPrimary && (
                    <button className="ds-action-btn ds-primary-btn" onClick={() => handleSetPrimary(cv._id)}>
                      <FaStar /> Set Primary
                    </button>
                  )}
                  <button className="ds-action-btn ds-share-btn" onClick={() => handleShare(cv)}>
                    <FaShare /> Share
                  </button>
                  <button className="ds-action-btn ds-delete-btn" onClick={() => { setSelectedCv(cv); setShowDeleteModal(true); }}>
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="ds-modal-overlay" onClick={() => { setShowUploadModal(false); setSelectedFile(null); setCvTitle(''); setIsPrimary(false); setUploadProgress(0); }}>
          <div className="ds-modal" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header">
              <FaUpload className="ds-modal-icon" />
              <h3>Upload New CV</h3>
              <button className="ds-modal-close" onClick={() => { setShowUploadModal(false); setSelectedFile(null); setCvTitle(''); setIsPrimary(false); setUploadProgress(0); }}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-form-group">
                <label>Select CV File</label>
                <input type="file" className="ds-file-input" accept=".pdf,.doc,.docx,.txt" onChange={handleFileSelect} />
                <small>Allowed formats: PDF, DOC, DOCX, TXT (Max 5MB)</small>
              </div>

              {selectedFile && (
                <>
                  <div className="ds-form-group">
                    <label>CV Title</label>
                    <input type="text" value={cvTitle} onChange={(e) => setCvTitle(e.target.value)} placeholder="Enter a title for your CV" />
                  </div>

                  <div className="ds-checkbox">
                    <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} id="isPrimary" />
                    <label htmlFor="isPrimary">Set as primary CV</label>
                  </div>

                  {uploadProgress > 0 && (
                    <div className="ds-progress">
                      <div className="ds-progress-bar" style={{ width: `${uploadProgress}%` }}>{uploadProgress}%</div>
                    </div>
                  )}

                  <div className="ds-file-details">
                    <h4>File Details:</h4>
                    <p><strong>Name:</strong> {selectedFile.name}</p>
                    <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
                    <p><strong>Type:</strong> {selectedFile.type}</p>
                  </div>
                </>
              )}
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" onClick={() => { setShowUploadModal(false); setSelectedFile(null); setCvTitle(''); setIsPrimary(false); setUploadProgress(0); }}>
                Cancel
              </button>
              <button className="ds-btn ds-btn-primary" onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading ? <><FaSpinner className="ds-spin" /> Uploading...</> : <><FaUpload /> Upload CV</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedCv && (
        <div className="ds-modal-overlay" onClick={() => { setShowPreviewModal(false); setSelectedCv(null); }}>
          <div className="ds-modal ds-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-info">
              <FaEye className="ds-modal-icon" />
              <h3>CV Details</h3>
              <button className="ds-modal-close" onClick={() => { setShowPreviewModal(false); setSelectedCv(null); }}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              <div className="ds-preview-content">
                <div className="ds-preview-icon">
                  {getFileIcon(selectedCv.fileType)}
                  {selectedCv.isPrimary && <span className="ds-primary-badge"><FaStar /> Primary CV</span>}
                </div>
                <div className="ds-preview-info">
                  <h4>{selectedCv.title}</h4>
                  <table className="ds-info-table">
                    <tbody>
                      <tr><th>Filename:</th><td>{selectedCv.filename}</td></tr>
                      <tr><th>File Type:</th><td>{selectedCv.fileType}</td></tr>
                      <tr><th>File Size:</th><td>{formatFileSize(selectedCv.fileSize)}</td></tr>
                      <tr><th>Uploaded:</th><td>{formatDate(selectedCv.createdAt)}</td></tr>
                      <tr><th>Last Updated:</th><td>{formatDate(selectedCv.updatedAt)}</td></tr>
                      <tr><th>Views:</th><td>{selectedCv.analytics?.views || 0}</td></tr>
                      <tr><th>Downloads:</th><td>{selectedCv.analytics?.downloads || 0}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-primary" onClick={() => handleDownload(selectedCv)}><FaDownload /> Download</button>
              <button className="ds-btn ds-btn-secondary" onClick={() => { setShowPreviewModal(false); setSelectedCv(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCv && (
        <div className="ds-modal-overlay" onClick={() => { setShowDeleteModal(false); setSelectedCv(null); }}>
          <div className="ds-modal" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header ds-modal-header-danger">
              <FaTrash className="ds-modal-icon" />
              <h3>Confirm Delete</h3>
              <button className="ds-modal-close" onClick={() => { setShowDeleteModal(false); setSelectedCv(null); }}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              <p>Are you sure you want to delete this CV?</p>
              <div className="ds-job-preview">
                <h4>{selectedCv.title}</h4>
                <p>{selectedCv.filename}</p>
                <small>{formatFileSize(selectedCv.fileSize)}</small>
              </div>
              {selectedCv.isPrimary && (
                <div className="ds-warning-text">
                  <FaExclamationTriangle /> This is your primary CV. Deleting it may affect your job applications.
                </div>
              )}
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" onClick={() => { setShowDeleteModal(false); setSelectedCv(null); }}>Cancel</button>
              <button className="ds-btn ds-btn-danger" onClick={() => handleDelete(selectedCv._id)} disabled={deleting}>
                {deleting ? <><FaSpinner className="ds-spin" /> Deleting...</> : <><FaTrash /> Delete CV</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedCv && (
        <div className="ds-modal-overlay" onClick={() => { setShowShareModal(false); setSelectedCv(null); }}>
          <div className="ds-modal" onClick={e => e.stopPropagation()}>
            <div className="ds-modal-header">
              <FaShare className="ds-modal-icon" />
              <h3>Share CV</h3>
              <button className="ds-modal-close" onClick={() => { setShowShareModal(false); setSelectedCv(null); }}>
                <FaTimes />
              </button>
            </div>
            <div className="ds-modal-body">
              <p>Share your CV with others:</p>
              <div className="ds-share-link">
                <input type="text" value={`http://localhost:3000/cv/${selectedCv._id}`} readOnly />
                <button onClick={() => copyToClipboard(`http://localhost:3000/cv/${selectedCv._id}`)}><FaLink /> Copy</button>
              </div>
              <div className="ds-share-buttons">
                <a href={`mailto:?subject=Check out my CV&body=Here's my CV: http://localhost:3000/cv/${selectedCv._id}`} className="ds-share-email"><FaEnvelope /> Email</a>
                <a href={`https://wa.me/?text=Check out my CV: http://localhost:3000/cv/${selectedCv._id}`} target="_blank" rel="noopener noreferrer" className="ds-share-whatsapp"><FaWhatsapp /> WhatsApp</a>
                <a href={`https://t.me/share/url?url=http://localhost:3000/cv/${selectedCv._id}&text=Check out my CV`} target="_blank" rel="noopener noreferrer" className="ds-share-telegram"><FaTelegram /> Telegram</a>
                <a href={`https://twitter.com/intent/tweet?url=http://localhost:3000/cv/${selectedCv._id}&text=Check out my CV`} target="_blank" rel="noopener noreferrer" className="ds-share-twitter"><FaTwitter /> Twitter</a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=http://localhost:3000/cv/${selectedCv._id}`} target="_blank" rel="noopener noreferrer" className="ds-share-linkedin"><FaLinkedin /> LinkedIn</a>
              </div>
            </div>
            <div className="ds-modal-footer">
              <button className="ds-btn ds-btn-secondary" onClick={() => { setShowShareModal(false); setSelectedCv(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CvManager;