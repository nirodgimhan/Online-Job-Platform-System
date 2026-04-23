import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaFileAlt, FaUpload, FaDownload, FaTrash, FaStar, 
  FaSearch, FaFilter, FaSyncAlt, FaEye, 
  FaFilePdf, FaFileWord, 
  FaExclamationTriangle,
  FaSpinner, FaChartLine, FaShare, FaLink, FaEnvelope, FaWhatsapp, FaSortUp, FaSortDown,
  FaTelegram, FaTwitter, FaLinkedin, 
  FaTimes, FaPlus, FaCloudUploadAlt, FaCheckCircle, FaTimesCircle,
  FaUserGraduate, FaBriefcase, FaThumbsUp, FaAward
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
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [stats, setStats] = useState({
    total: 0, primary: 0, pdf: 0, doc: 0, other: 0, totalSize: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setError('Please login to view your CVs'); setLoading(false); return; }
    fetchCVs();
  }, []);

  useEffect(() => {
    if (cvs.length) calculateStats();
  }, [cvs]);

  const fetchCVs = async () => {
    try {
      setLoading(true);
      const response = await API.get('/cv');
      if (response.data.success) setCvs(response.data.cvs || []);
      else setError('Failed to load CVs');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) setError('Session expired. Please login again.');
      else setError(err.response?.data?.message || 'Failed to load CVs');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const calculateStats = () => {
    setStats({
      total: cvs.length,
      primary: cvs.filter(cv => cv.isPrimary).length,
      pdf: cvs.filter(cv => cv.fileType?.includes('pdf')).length,
      doc: cvs.filter(cv => cv.fileType?.includes('document') || cv.fileType?.includes('msword')).length,
      other: cvs.filter(cv => !cv.fileType?.includes('pdf') && !cv.fileType?.includes('document')).length,
      totalSize: cvs.reduce((sum, cv) => sum + (cv.fileSize || 0), 0)
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return; }
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) { toast.error('Only PDF, DOC, DOCX, and TXT files are allowed'); return; }
    setSelectedFile(file);
    setCvTitle(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.error('Please select a file to upload'); return; }
    const formData = new FormData();
    formData.append('cv', selectedFile);
    formData.append('title', cvTitle || selectedFile.name);
    formData.append('isPrimary', isPrimary);
    setUploading(true);
    setUploadProgress(0);
    try {
      const response = await API.post('/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => e.total && setUploadProgress(Math.round((e.loaded * 100) / e.total))
      });
      if (response.data.success) {
        toast.success('CV uploaded successfully!');
        setSelectedFile(null); setCvTitle(''); setIsPrimary(false); setShowUploadModal(false); setUploadProgress(0);
        fetchCVs();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to upload CV'); }
    finally { setUploading(false); }
  };

  const handleSetPrimary = async (cvId) => {
    try {
      const response = await API.put(`/cv/${cvId}/primary`);
      if (response.data.success) { toast.success('CV set as primary'); fetchCVs(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to set primary'); }
  };

  const handleDelete = async (cvId) => {
    setDeleting(true);
    try {
      const response = await API.delete(`/cv/${cvId}`);
      if (response.data.success) {
        toast.success('CV deleted');
        setShowDeleteModal(false);
        setSelectedCv(null);
        fetchCVs();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  // Mock analysis function (fallback)
  const generateMockAnalysis = () => ({
    matchPercentage: Math.floor(Math.random() * 40) + 55,
    overallScore: Math.floor(Math.random() * 30) + 65,
    strengths: ['React.js', 'JavaScript', 'CSS', 'Problem solving'],
    missingSkills: ['TypeScript', 'GraphQL', 'AWS'],
    jobRecommendations: [
      { title: 'Frontend Developer', match: 85 },
      { title: 'Full Stack Developer', match: 72 },
      { title: 'React Specialist', match: 68 }
    ],
    summary: 'Your CV is strong in frontend technologies. Consider adding TypeScript and cloud experience to improve match for senior roles.',
    detailedFeedback: ['Good presentation of work experience', 'Skills section is well organized', 'Add more quantifiable achievements']
  });

  const handleAnalyze = async (cv) => {
    setSelectedCv(cv);
    setAnalyzing(true);
    setShowAnalysisModal(true);
    try {
      const response = await API.post(`/cv/analyze/${cv._id}`);
      if (response.data.success) setAnalysisData(response.data.analysis);
      else setAnalysisData(generateMockAnalysis());
    } catch (err) {
      console.error(err);
      setAnalysisData(generateMockAnalysis());
      toast.info('Demo analysis data (backend not available)');
    } finally { setAnalyzing(false); }
  };

  const handleDownload = async (cv) => {
    try {
      const response = await API.get(`/cv/download/${cv._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', cv.filename || cv.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download file');
    }
  };

  const handleRefresh = () => { setRefreshing(true); fetchCVs(); };
  const handleViewDetails = (cv) => { setSelectedCv(cv); setShowPreviewModal(true); };
  const handleShare = (cv) => { setSelectedCv(cv); setShowShareModal(true); };
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Link copied!'); };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';
  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return <FaFilePdf className="cv-file-icon-pdf" />;
    if (type?.includes('word') || type?.includes('document')) return <FaFileWord className="cv-file-icon-word" />;
    return <FaFileAlt className="cv-file-icon-default" />;
  };
  const getMatchColor = (p) => p >= 80 ? '#10b981' : p >= 60 ? '#f59e0b' : '#ef4444';

  const filteredCVs = cvs.filter(cv => {
    if (searchTerm && !cv.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterType === 'pdf' && !cv.fileType?.includes('pdf')) return false;
    if (filterType === 'doc' && !(cv.fileType?.includes('document') || cv.fileType?.includes('msword'))) return false;
    if (filterType === 'primary' && !cv.isPrimary) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date') return sortOrder === 'asc' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'name') return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
    return 0;
  });

  if (loading) return <div className="cv-loading-container"><div className="cv-spinner"></div><h4>Loading your CVs...</h4></div>;
  if (error) return <div className="cv-error-container"><div className="cv-error-card"><FaExclamationTriangle className="cv-error-icon"/><h3>Error</h3><p>{error}</p><button className="cv-btn cv-btn-primary" onClick={fetchCVs}>Try Again</button></div></div>;

  return (
    <div className="cv-cv-manager">
      <div className="cv-container">
        {/* Statistics Cards */}
        <div className="cv-stats-grid">
          <div className="cv-stat-card cv-stat-total"><div className="cv-stat-icon"><FaFileAlt/></div><div className="cv-stat-info"><span className="cv-stat-value">{stats.total}</span><span className="cv-stat-label">Total CVs</span></div></div>
          <div className="cv-stat-card cv-stat-primary"><div className="cv-stat-icon"><FaStar/></div><div className="cv-stat-info"><span className="cv-stat-value">{stats.primary}</span><span className="cv-stat-label">Primary CV</span></div></div>
          <div className="cv-stat-card cv-stat-pdf"><div className="cv-stat-icon"><FaFilePdf/></div><div className="cv-stat-info"><span className="cv-stat-value">{stats.pdf}</span><span className="cv-stat-label">PDF Format</span></div></div>
          <div className="cv-stat-card cv-stat-size"><div className="cv-stat-icon"><FaFileAlt/></div><div className="cv-stat-info"><span className="cv-stat-value">{formatFileSize(stats.totalSize)}</span><span className="cv-stat-label">Total Size</span></div></div>
        </div>

        {/* Filters Card */}
        <div className="cv-filters-card">
          <div className="cv-card-header">
            <div className="cv-header-left"><div className="cv-header-icon-wrapper"><FaFileAlt/></div><div><h1>CV Manager</h1><p className="cv-header-subtitle">Upload and manage your resumes</p></div></div>
      
          </div>
          <div className="cv-search-wrapper"><div className="cv-search-input-group"><FaSearch className="cv-search-icon"/><input type="text" placeholder="Search by title..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>{searchTerm && <button className="cv-clear-search" onClick={()=>setSearchTerm('')}><FaTimes/></button>}</div></div>
          <div className="cv-filters-row">
            <div className="cv-filter-group"><label>File Type</label><select value={filterType} onChange={e=>setFilterType(e.target.value)}><option value="">All</option><option value="pdf">PDF</option><option value="doc">DOC/DOCX</option><option value="primary">Primary CV</option></select></div>
            <div className="cv-filter-group"><label>Sort By</label><select value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="date">Date</option><option value="name">Name</option></select></div>
            <button className="cv-sort-btn" onClick={()=>setSortOrder(sortOrder==='asc'?'desc':'asc')}>{sortOrder==='asc'?<FaSortUp/>:<FaSortDown/>}</button>
            <button className="cv-clear-filters-btn" onClick={()=>{setSearchTerm(''); setFilterType(''); setSortBy('date');}}><FaFilter/> Clear</button>
            <button className="cv-refresh-btn" onClick={handleRefresh} disabled={refreshing}><FaSyncAlt className={refreshing?'cv-spin':''}/> Refresh</button>
            <button className="cv-btn-primary" onClick={()=>setShowUploadModal(true)}><FaPlus/> Upload CV</button>
          </div>
        </div>

        {/* Results Count */}
        <div className="cv-results-info">Showing <strong>{filteredCVs.length}</strong> of <strong>{cvs.length}</strong> CVs</div>

        {/* CV List */}
        {filteredCVs.length === 0 ? (
          <div className="cv-empty-state"><div className="cv-empty-icon-wrapper"><FaFileAlt className="cv-empty-icon"/></div><h3>No CVs found</h3><p>Upload your first CV to get started.</p><button className="cv-btn cv-btn-primary" onClick={()=>setShowUploadModal(true)}><FaCloudUploadAlt/> Upload CV</button></div>
        ) : (
          <div className="cv-cvs-grid">
            {filteredCVs.map(cv => (
              <div key={cv._id} className="cv-cv-card">
                <div className="cv-card-icon">{getFileIcon(cv.fileType)}</div>
                <div className="cv-card-content">
                  <div className="cv-card-header-section">
                    <div><h3 className="cv-cv-title">{cv.title}</h3><div className="cv-cv-tags"><span className="cv-tag">{cv.fileType?.split('/')[1]}</span><span className="cv-tag">{formatFileSize(cv.fileSize)}</span><span className="cv-tag">Uploaded {formatDate(cv.createdAt)}</span></div></div>
                    <div className="cv-card-actions-top"><button className={`cv-star-btn ${cv.isPrimary ? 'cv-star-active' : ''}`} onClick={()=>!cv.isPrimary && handleSetPrimary(cv._id)} disabled={cv.isPrimary}><FaStar/></button>{cv.isPrimary && <span className="cv-primary-badge"><FaStar/> Primary</span>}</div>
                  </div>
                  <div className="cv-card-actions">
                    <button className="cv-action-btn cv-view-btn" onClick={()=>handleViewDetails(cv)}><FaEye/> View</button>
                    <button className="cv-action-btn cv-download-btn" onClick={()=>handleDownload(cv)}><FaDownload/> Download</button>
                    <button className="cv-action-btn cv-analyze-btn" onClick={()=>handleAnalyze(cv)}><FaChartLine/> Analyze</button>
                    <button className="cv-action-btn cv-share-btn" onClick={()=>handleShare(cv)}><FaShare/> Share</button>
                    <button className="cv-action-btn cv-delete-btn" onClick={()=>{setSelectedCv(cv); setShowDeleteModal(true);}}><FaTrash/> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && <div className="cv-modal-overlay" onClick={()=>setShowUploadModal(false)}><div className="cv-modal" onClick={e=>e.stopPropagation()}><div className="cv-modal-header"><FaCloudUploadAlt className="cv-modal-icon"/><h3>Upload CV</h3><button className="cv-modal-close" onClick={()=>setShowUploadModal(false)}><FaTimes/></button></div><div className="cv-modal-body"><div className="cv-upload-area"><input type="file" id="cvFileUpload" accept=".pdf,.doc,.docx,.txt" onChange={handleFileSelect} className="cv-file-input"/><label htmlFor="cvFileUpload" className="cv-upload-label"><FaCloudUploadAlt/> Choose File</label><p className="cv-upload-hint">PDF, DOC, DOCX, TXT (max 5MB)</p></div>{selectedFile && (<><div className="cv-form-group"><label>Title</label><input type="text" value={cvTitle} onChange={e=>setCvTitle(e.target.value)} placeholder="CV title"/></div><div className="cv-checkbox"><input type="checkbox" checked={isPrimary} onChange={e=>setIsPrimary(e.target.checked)} id="isPrimary"/><label htmlFor="isPrimary">Set as primary CV</label></div>{uploadProgress>0 && <div className="cv-progress"><div className="cv-progress-bar" style={{width:`${uploadProgress}%`}}>{uploadProgress}%</div></div>}<div className="cv-file-details"><h4>File Details</h4><p><strong>Name:</strong> {selectedFile.name}</p><p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p></div></>)}</div><div className="cv-modal-footer"><button className="cv-btn cv-btn-secondary" onClick={()=>setShowUploadModal(false)}>Cancel</button><button className="cv-btn cv-btn-primary" onClick={handleUpload} disabled={!selectedFile||uploading}>{uploading?<><FaSpinner className="cv-spin"/> Uploading...</>:<><FaUpload/> Upload</>}</button></div></div></div>}

      {/* Preview Modal */}
      {showPreviewModal && selectedCv && <div className="cv-modal-overlay" onClick={()=>setShowPreviewModal(false)}><div className="cv-modal cv-modal-large" onClick={e=>e.stopPropagation()}><div className="cv-modal-header cv-modal-header-info"><FaEye className="cv-modal-icon"/><h3>CV Details</h3><button className="cv-modal-close" onClick={()=>setShowPreviewModal(false)}><FaTimes/></button></div><div className="cv-modal-body"><div className="cv-preview-content"><div className="cv-preview-icon">{getFileIcon(selectedCv.fileType)}{selectedCv.isPrimary && <span className="cv-primary-badge"><FaStar/> Primary</span>}</div><div className="cv-preview-info"><h4>{selectedCv.title}</h4><table className="cv-info-table"><tbody><tr><th>Filename:</th><td>{selectedCv.filename}</td></tr><tr><th>Type:</th><td>{selectedCv.fileType}</td></tr><tr><th>Size:</th><td>{formatFileSize(selectedCv.fileSize)}</td></tr><tr><th>Uploaded:</th><td>{formatDate(selectedCv.createdAt)}</td></tr></tbody></table></div></div></div><div className="cv-modal-footer"><button className="cv-btn cv-btn-primary" onClick={()=>handleDownload(selectedCv)}><FaDownload/> Download</button><button className="cv-btn cv-btn-secondary" onClick={()=>setShowPreviewModal(false)}>Close</button></div></div></div>}

      {/* Analysis Modal */}
      {showAnalysisModal && <div className="cv-modal-overlay" onClick={()=>setShowAnalysisModal(false)}><div className="cv-modal cv-modal-large" onClick={e=>e.stopPropagation()}><div className="cv-modal-header cv-modal-header-analysis"><FaChartLine className="cv-modal-icon"/><h3>CV Analysis</h3><button className="cv-modal-close" onClick={()=>setShowAnalysisModal(false)}><FaTimes/></button></div><div className="cv-modal-body">{analyzing ? <div className="cv-analyzing"><FaSpinner className="cv-spin cv-analyzing-spinner"/><p>Analyzing your CV...</p></div> : analysisData ? <div className="cv-analysis-content"><div className="cv-analysis-header"><div className="cv-match-circle" style={{borderColor:getMatchColor(analysisData.matchPercentage)}}><span className="cv-match-percentage">{analysisData.matchPercentage}%</span><span className="cv-match-label">Match Score</span></div><div className="cv-overall-score"><FaAward className="cv-score-icon"/><div><span className="cv-score-value">{analysisData.overallScore}%</span><span className="cv-score-label">Overall Score</span></div></div></div><div className="cv-analysis-summary"><FaThumbsUp className="cv-summary-icon"/><p>{analysisData.summary}</p></div><div className="cv-analysis-grid"><div className="cv-strengths"><h4><FaCheckCircle/> Strengths</h4><ul>{analysisData.strengths.map((s,i)=><li key={i}>{s}</li>)}</ul></div><div className="cv-missing"><h4><FaTimesCircle/> Missing Skills</h4><ul>{analysisData.missingSkills.map((s,i)=><li key={i}>{s}</li>)}</ul></div></div><div className="cv-job-recommendations"><h4><FaBriefcase/> Recommended Jobs</h4><div className="cv-job-list">{analysisData.jobRecommendations.map((job,i)=><div key={i} className="cv-job-item"><span>{job.title}</span><div className="cv-job-match-bar"><div className="cv-job-match-fill" style={{width:`${job.match}%`, backgroundColor:getMatchColor(job.match)}}></div><span className="cv-job-match-percent">{job.match}%</span></div></div>)}</div></div><div className="cv-feedback"><h4><FaUserGraduate/> Feedback</h4><ul>{analysisData.detailedFeedback.map((fb,i)=><li key={i}>{fb}</li>)}</ul></div></div> : <div className="cv-error-state"><FaExclamationTriangle className="cv-error-icon"/><p>Failed to load analysis</p></div>}</div><div className="cv-modal-footer"><button className="cv-btn cv-btn-secondary" onClick={()=>setShowAnalysisModal(false)}>Close</button></div></div></div>}

      {/* Delete Modal */}
      {showDeleteModal && selectedCv && <div className="cv-modal-overlay" onClick={()=>setShowDeleteModal(false)}><div className="cv-modal" onClick={e=>e.stopPropagation()}><div className="cv-modal-header cv-modal-header-danger"><FaTrash className="cv-modal-icon"/><h3>Delete CV</h3><button className="cv-modal-close" onClick={()=>setShowDeleteModal(false)}><FaTimes/></button></div><div className="cv-modal-body"><p>Are you sure you want to delete <strong>{selectedCv.title}</strong>?</p>{selectedCv.isPrimary && <div className="cv-warning-text"><FaExclamationTriangle/> This is your primary CV. Deleting it may affect applications.</div>}</div><div className="cv-modal-footer"><button className="cv-btn cv-btn-secondary" onClick={()=>setShowDeleteModal(false)}>Cancel</button><button className="cv-btn cv-btn-danger" onClick={()=>handleDelete(selectedCv._id)} disabled={deleting}>{deleting?<><FaSpinner className="cv-spin"/> Deleting...</>:<><FaTrash/> Delete</>}</button></div></div></div>}

      {/* Share Modal */}
      {showShareModal && selectedCv && <div className="cv-modal-overlay" onClick={()=>setShowShareModal(false)}><div className="cv-modal" onClick={e=>e.stopPropagation()}><div className="cv-modal-header"><FaShare className="cv-modal-icon"/><h3>Share CV</h3><button className="cv-modal-close" onClick={()=>setShowShareModal(false)}><FaTimes/></button></div><div className="cv-modal-body"><p>Share your CV with others:</p><div className="cv-share-link"><input type="text" value={`${window.location.origin}/cv/${selectedCv._id}`} readOnly/><button onClick={()=>copyToClipboard(`${window.location.origin}/cv/${selectedCv._id}`)}><FaLink/> Copy</button></div><div className="cv-share-buttons"><a href={`mailto:?subject=Check my CV&body=Here's my CV: ${window.location.origin}/cv/${selectedCv._id}`} className="cv-share-email"><FaEnvelope/> Email</a><a href={`https://wa.me/?text=Check my CV: ${window.location.origin}/cv/${selectedCv._id}`} target="_blank" className="cv-share-whatsapp"><FaWhatsapp/> WhatsApp</a><a href={`https://t.me/share/url?url=${window.location.origin}/cv/${selectedCv._id}`} target="_blank" className="cv-share-telegram"><FaTelegram/> Telegram</a><a href={`https://twitter.com/intent/tweet?url=${window.location.origin}/cv/${selectedCv._id}`} target="_blank" className="cv-share-twitter"><FaTwitter/> Twitter</a><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.origin}/cv/${selectedCv._id}`} target="_blank" className="cv-share-linkedin"><FaLinkedin/> LinkedIn</a></div></div><div className="cv-modal-footer"><button className="cv-btn cv-btn-secondary" onClick={()=>setShowShareModal(false)}>Close</button></div></div></div>}
    </div>
  );
};

export default CvManager;