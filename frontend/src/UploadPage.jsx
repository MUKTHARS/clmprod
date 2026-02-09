import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from './config';
import {
  Upload,
  FileText,
  Calendar,
  User,
  File,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Loader2,
  X,
  Shield,
  ChevronRight,
  Eye,
  ExternalLink
} from 'lucide-react';
import './styles/UploadPage.css';

function UploadPage({ setLoading, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('idle');
  const [stageProgress, setStageProgress] = useState({});
  const [extractionDetails, setExtractionDetails] = useState(null);
  const [showExtractionResults, setShowExtractionResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const extractionStages = [
    { id: 'upload', label: 'Uploading', weight: 20 },
    { id: 'parsing', label: 'Parsing', weight: 15 },
    { id: 'structure', label: 'Structure', weight: 15 },
    { id: 'financial', label: 'Financial', weight: 20 },
    { id: 'parties', label: 'Parties', weight: 10 },
    { id: 'dates', label: 'Dates', weight: 10 },
    { id: 'terms', label: 'Terms', weight: 10 },
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setUploadStatus('');
      setUploadProgress(0);
      setCurrentStage('idle');
      setStageProgress({});
      setExtractionDetails(null);
      setShowExtractionResults(false);
      setIsProcessing(false);
    } else {
      setUploadStatus('Please select a valid PDF file');
      setFile(null);
    }
  };

  const simulateStageProgress = (stageId, duration = 800) => {
    return new Promise(resolve => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setStageProgress(prev => ({
          ...prev,
          [stageId]: Math.min(progress * 100, 100)
        }));
        
        if (elapsed >= duration) {
          clearInterval(interval);
          resolve();
        }
      }, 30);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setIsProcessing(true);
    setCurrentStage('uploading');
    setUploadStatus('Uploading file...');
    setUploadProgress(0);
    setShowExtractionResults(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Stage 1: Uploading
      await simulateStageProgress('upload', 600);
      setUploadProgress(20);

      const uploadUrl = `${API_CONFIG.BASE_URL}/upload/`;
      
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total ? 
            Math.min(Math.round((progressEvent.loaded * 100) / progressEvent.total), 100) : 0;
          setUploadProgress(20 + progress * 0.2);
        },
      });

      setUploadProgress(40);
      setCurrentStage('extracting');

      // Simulate extraction stages
      let cumulativeProgress = 40;
      for (let i = 1; i < extractionStages.length; i++) {
        const stage = extractionStages[i];
        setCurrentStage(stage.id);
        setUploadStatus(`Processing: ${stage.label}`);
        
        const stageWeight = stage.weight * 0.6;
        
        await simulateStageProgress(stage.id, 700 + Math.random() * 300);
        
        cumulativeProgress += stageWeight;
        setUploadProgress(Math.min(cumulativeProgress, 100));
      }

      setUploadProgress(100);
      setCurrentStage('complete');
      setUploadStatus('Analysis complete');
      
      if (response.data) {
        // Store extraction details
        const extractionData = {
          id: response.data.id,
          filename: response.data.filename,
          grant_name: response.data.grant_name || response.data.filename,
          contract_number: response.data.contract_number,
          grantor: response.data.grantor,
          grantee: response.data.grantee,
          total_amount: response.data.total_amount,
          start_date: response.data.start_date,
          end_date: response.data.end_date,
          purpose: response.data.purpose,
          status: 'draft', // Mark as draft
          uploaded_at: response.data.uploaded_at,
          comprehensive_data: response.data.comprehensive_data
        };
        
        setExtractionDetails(extractionData);
        setShowExtractionResults(true);
        
        // Store in localStorage for draft management
        const userDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
        userDrafts.push({
          id: response.data.id,
          ...extractionData,
          created_at: new Date().toISOString(),
          is_draft: true
        });
        localStorage.setItem('user_drafts', JSON.stringify(userDrafts));
        
        // Show success message
        setTimeout(() => {
          alert(`✅ Grant saved to drafts successfully!\Grant ID: ${response.data.id}`);
        }, 500);
      }
      
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setCurrentStage('error');
      setIsProcessing(false);
      
      let errorMessage = 'Upload failed';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.data && error.response.data.detail) {
          errorMessage = `Error: ${error.response.data.detail}`;
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setUploadStatus(errorMessage);
      setUploadProgress(0);
      setStageProgress({});
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleViewContract = () => {
    if (extractionDetails?.id) {
      navigate(`/contracts/${extractionDetails.id}`);
    }
  };

  const handleUploadAnother = () => {
    setFile(null);
    setExtractionDetails(null);
    setShowExtractionResults(false);
    setUploadStatus('');
    setUploadProgress(0);
    setCurrentStage('idle');
    setStageProgress({});
    setIsProcessing(false);
    const fileInput = document.getElementById('pdf-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleViewInDrafts = () => {
    navigate('/drafts/my');
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const droppedFile = files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setUploadStatus('');
        setUploadProgress(0);
        setCurrentStage('idle');
        setStageProgress({});
        setExtractionDetails(null);
        setShowExtractionResults(false);
        setIsProcessing(false);
      } else {
        setUploadStatus('Please select a valid PDF file');
        setFile(null);
      }
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        {/* Upload Area */}
        <div className="upload-area-section">
          <div className="upload-area">
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              onChange={handleFileChange}
              className="file-input"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
            
            {!file ? (
              <label htmlFor="pdf-upload" className="upload-dropzone">
                <div className="dropzone-content">
                  <Upload size={48} className="dropzone-icon" />
                  <div className="dropzone-text">
                    <h3>Upload Grant PDF</h3>
                    <p>Click to browse or drag & drop your PDF file here</p>
                  </div>
                  <div className="file-type-badge">
                    <File size={14} />
                    <span>PDF files only (max 50MB)</span>
                  </div>
                </div>
              </label>
            ) : (
              <div className="file-preview">
                <div className="file-info">
                  <FileText size={20} />
                  <div className="file-details">
                    <h4>{file.name}</h4>
                    <p>{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                  </div>
                  <button 
                    className="btn-remove"
                    onClick={() => {
                      setFile(null);
                      setShowExtractionResults(false);
                      setExtractionDetails(null);
                      setIsProcessing(false);
                      document.getElementById('pdf-upload').value = '';
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="upload-actions">
                  <button 
                    onClick={handleUpload} 
                    className="btn-upload-mains"
                    disabled={!localStorage.getItem('token') || isProcessing}
                  >
                    {!isProcessing ? (
                      <>
                        <Upload size={26} />
                        <span>Analyze Grant</span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="spinner" size={16} />
                        <span>Processing...</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Processing Section - Only show when processing */}
        {isProcessing && !showExtractionResults && (
          <div className="processing-section">
            <div className="processing-header">
              <h3>Processing Grant</h3>
              <p className="processing-subtitle">Extracting grant data...</p>
            </div>

            <div className="progress-container">
              <div className="progress-header">
                <span className="progress-label">Overall Progress</span>
                <span className="progress-percentage">{Math.min(Math.round(uploadProgress), 100)}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="extraction-stages">
              {extractionStages.map((stage) => {
                const isActive = currentStage === stage.id;
                const isCompleted = stageProgress[stage.id] === 100;
                
                return (
                  <div 
                    key={stage.id} 
                    className={`extraction-stage ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  >
                    <div className="stage-icon">
                      {isCompleted ? (
                        <CheckCircle size={12} />
                      ) : isActive ? (
                        <Loader2 className="stage-spinner" size={12} />
                      ) : (
                        <div className="stage-placeholder"></div>
                      )}
                    </div>
                    <span className="stage-label">{stage.label}</span>
                    {stageProgress[stage.id] !== undefined && (
                      <span className="stage-percentage">{Math.min(Math.round(stageProgress[stage.id]), 100)}%</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="processing-status">
              <span className="status-text">{uploadStatus}</span>
            </div>
          </div>
        )}

        {/* Extraction Results Section */}
        {showExtractionResults && extractionDetails && (
          <div className="extraction-results-section">
            {/* <div className="success-message">
              <CheckCircle size={24} className="success-icon" />
              <div>
                <h3>Grant Saved to Drafts!</h3>
                <p>Grant has been extracted and saved as draft.</p>
              </div>
            </div> */}

            <div className="extraction-details-card">
              {/* <h4>Extracted Grant Details</h4> */}
              <div className="extraction-grid">
                <div className="extraction-field">
                  <span className="field-label">Grant Name</span>
                  <span className="field-value">{extractionDetails.grant_name}</span>
                </div>
                <div className="extraction-field">
                  <span className="field-label">Grant ID</span>
                  <span className="field-value">{extractionDetails.id}</span>
                </div>
                <div className="extraction-field">
                  <span className="field-label">Status</span>
                  <span className="field-value status-badge draft">Draft</span>
                </div>
                <div className="extraction-field">
                  <span className="field-label">Total Amount</span>
                  <span className="field-value">{formatCurrency(extractionDetails.total_amount)}</span>
                </div>
                <div className="extraction-field">
                  <span className="field-label">Grantor</span>
                  <span className="field-value">{extractionDetails.grantor || 'Not specified'}</span>
                </div>
                <div className="extraction-field">
                  <span className="field-label">Upload Date</span>
                  <span className="field-value">{formatDate(extractionDetails.uploaded_at)}</span>
                </div>
              </div>

              <div className="extraction-actions">
                <button 
                  className="btn-view-contract"
                  onClick={handleViewContract}
                >
                  <Eye size={16} />
                  View Grant
                </button>
                <button 
                  className="btn-view-drafts"
                  onClick={handleViewInDrafts}
                >
                  <FileText size={16} />
                  View in Drafts
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {currentStage === 'error' && (
          <div className="error-section">
            <div className="error-message">
              <AlertCircle size={20} />
              <div>
                <h3>Upload Failed</h3>
                <p>{uploadStatus}</p>
              </div>
            </div>
            <button 
              className="btn-retry"
              onClick={() => {
                setCurrentStage('idle');
                setUploadStatus('');
                setUploadProgress(0);
                setStageProgress({});
                setIsProcessing(false);
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;


// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import API_CONFIG from './config';
// import {
//   Upload,
//   FileText,
//   Calendar,
//   User,
//   File,
//   AlertCircle,
//   CheckCircle,
//   DollarSign,
//   Loader2,
//   X,
//   Shield,
//   ChevronRight,
//   Eye,
//   ExternalLink
// } from 'lucide-react';
// import './styles/UploadPage.css';

// function UploadPage({ setLoading, onUploadComplete }) {
//   const [file, setFile] = useState(null);
//   const [uploadStatus, setUploadStatus] = useState('');
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [currentStage, setCurrentStage] = useState('idle');
//   const [stageProgress, setStageProgress] = useState({});
//   const [extractionDetails, setExtractionDetails] = useState(null);
//   const [showExtractionResults, setShowExtractionResults] = useState(false);
//   const navigate = useNavigate();

//   const extractionStages = [
//     { id: 'upload', label: 'Uploading', weight: 20 },
//     { id: 'parsing', label: 'Parsing', weight: 15 },
//     { id: 'structure', label: 'Structure', weight: 15 },
//     { id: 'financial', label: 'Financial', weight: 20 },
//     { id: 'parties', label: 'Parties', weight: 10 },
//     { id: 'dates', label: 'Dates', weight: 10 },
//     { id: 'terms', label: 'Terms', weight: 10 },
//   ];

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     if (selectedFile && selectedFile.type === 'application/pdf') {
//       setFile(selectedFile);
//       setUploadStatus('');
//       setUploadProgress(0);
//       setCurrentStage('idle');
//       setStageProgress({});
//       setExtractionDetails(null);
//       setShowExtractionResults(false);
//     } else {
//       setUploadStatus('Please select a valid PDF file');
//       setFile(null);
//     }
//   };

//   const simulateStageProgress = (stageId, duration = 800) => {
//     return new Promise(resolve => {
//       const startTime = Date.now();
//       const interval = setInterval(() => {
//         const elapsed = Date.now() - startTime;
//         const progress = Math.min(elapsed / duration, 1);
//         setStageProgress(prev => ({
//           ...prev,
//           [stageId]: Math.min(progress * 100, 100)
//         }));
        
//         if (elapsed >= duration) {
//           clearInterval(interval);
//           resolve();
//         }
//       }, 30);
//     });
//   };

//   const handleUpload = async () => {
//     if (!file) {
//       setUploadStatus('Please select a file first');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('file', file);

//     setLoading(true);
//     setCurrentStage('uploading');
//     setUploadStatus('Uploading file...');
//     setUploadProgress(0);
//     setShowExtractionResults(false);

//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('No authentication token found. Please log in again.');
//       }

//       // Stage 1: Uploading
//       await simulateStageProgress('upload', 600);
//       setUploadProgress(20);

//       const uploadUrl = `${API_CONFIG.BASE_URL}/upload/`;
      
//       const response = await axios.post(uploadUrl, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//           'Authorization': `Bearer ${token}`
//         },
//         onUploadProgress: (progressEvent) => {
//           const progress = progressEvent.total ? 
//             Math.min(Math.round((progressEvent.loaded * 100) / progressEvent.total), 100) : 0;
//           setUploadProgress(20 + progress * 0.2);
//         },
//       });

//       setUploadProgress(40);
//       setCurrentStage('extracting');

//       // Simulate extraction stages
//       let cumulativeProgress = 40;
//       for (let i = 1; i < extractionStages.length; i++) {
//         const stage = extractionStages[i];
//         setCurrentStage(stage.id);
//         setUploadStatus(`Processing: ${stage.label}`);
        
//         const stageWeight = stage.weight * 0.6;
        
//         await simulateStageProgress(stage.id, 700 + Math.random() * 300);
        
//         cumulativeProgress += stageWeight;
//         setUploadProgress(Math.min(cumulativeProgress, 100));
//       }

//       setUploadProgress(100);
//       setCurrentStage('complete');
//       setUploadStatus('Analysis complete');
      
//       if (response.data) {
//         // Store extraction details
//         const extractionData = {
//           id: response.data.id,
//           filename: response.data.filename,
//           grant_name: response.data.grant_name || response.data.filename,
//           contract_number: response.data.contract_number,
//           grantor: response.data.grantor,
//           grantee: response.data.grantee,
//           total_amount: response.data.total_amount,
//           start_date: response.data.start_date,
//           end_date: response.data.end_date,
//           purpose: response.data.purpose,
//           status: 'draft', // Mark as draft
//           uploaded_at: response.data.uploaded_at,
//           comprehensive_data: response.data.comprehensive_data
//         };
        
//         setExtractionDetails(extractionData);
//         setShowExtractionResults(true);
        
//         // Store in localStorage for draft management
//         const userDrafts = JSON.parse(localStorage.getItem('user_drafts') || '[]');
//         userDrafts.push({
//           id: response.data.id,
//           ...extractionData,
//           created_at: new Date().toISOString(),
//           is_draft: true
//         });
//         localStorage.setItem('user_drafts', JSON.stringify(userDrafts));
        
//         // Show success message
//         setTimeout(() => {
//           alert(`✅ Contract saved to drafts successfully!\nContract ID: ${response.data.id}`);
//         }, 500);
//       }
      
//       if (onUploadComplete) {
//         onUploadComplete(response.data);
//       }
      
//     } catch (error) {
//       console.error('Upload error:', error);
//       setCurrentStage('error');
      
//       let errorMessage = 'Upload failed';
//       if (error.response) {
//         if (error.response.status === 401) {
//           errorMessage = 'Authentication failed. Please log in again.';
//           localStorage.removeItem('token');
//           localStorage.removeItem('user');
//           setTimeout(() => navigate('/login'), 2000);
//         } else if (error.response.data && error.response.data.detail) {
//           errorMessage = `Error: ${error.response.data.detail}`;
//         } else {
//           errorMessage = `Server error: ${error.response.status}`;
//         }
//       } else if (error.request) {
//         errorMessage = 'Network error. Please check your connection.';
//       } else {
//         errorMessage = `Error: ${error.message}`;
//       }
      
//       setUploadStatus(errorMessage);
//       setUploadProgress(0);
//       setStageProgress({});
//     } finally {
//       setTimeout(() => setLoading(false), 1000);
//     }
//   };

//   const handleViewContract = () => {
//     if (extractionDetails?.id) {
//       navigate(`/contracts/${extractionDetails.id}`);
//     }
//   };

//   const handleUploadAnother = () => {
//     setFile(null);
//     setExtractionDetails(null);
//     setShowExtractionResults(false);
//     setUploadStatus('');
//     setUploadProgress(0);
//     setCurrentStage('idle');
//     setStageProgress({});
//     const fileInput = document.getElementById('pdf-upload');
//     if (fileInput) fileInput.value = '';
//   };

//   const handleViewInDrafts = () => {
//     navigate('/drafts/my');
//   };

//   const formatCurrency = (amount) => {
//     if (!amount && amount !== 0) return '-';
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Not specified';
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     const files = e.dataTransfer.files;
//     if (files.length > 0) {
//       const droppedFile = files[0];
//       if (droppedFile.type === 'application/pdf') {
//         setFile(droppedFile);
//         setUploadStatus('');
//         setUploadProgress(0);
//         setCurrentStage('idle');
//         setStageProgress({});
//         setExtractionDetails(null);
//         setShowExtractionResults(false);
//       } else {
//         setUploadStatus('Please select a valid PDF file');
//         setFile(null);
//       }
//     }
//   };

//   return (
//     <div className="upload-page">
//       <div className="upload-card">
//         {/* Upload Area */}
//         <div className="upload-area-section">
//           <div className="upload-area">
//             <input
//               type="file"
//               id="pdf-upload"
//               accept=".pdf"
//               onChange={handleFileChange}
//               className="file-input"
//               onDragOver={handleDragOver}
//               onDrop={handleDrop}
//             />
            
//             {!file ? (
//               <label htmlFor="pdf-upload" className="upload-dropzone">
//                 <div className="dropzone-content">
//                   <Upload size={48} className="dropzone-icon" />
//                   <div className="dropzone-text">
//                     <h3>Upload Contract PDF</h3>
//                     <p>Click to browse or drag & drop your PDF file here</p>
//                   </div>
//                   <div className="file-type-badge">
//                     <File size={14} />
//                     <span>PDF files only (max 50MB)</span>
//                   </div>
//                 </div>
//               </label>
//             ) : (
//               <div className="file-preview">
//                 <div className="file-info">
//                   <FileText size={20} />
//                   <div className="file-details">
//                     <h4>{file.name}</h4>
//                     <p>{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
//                   </div>
//                   <button 
//                     className="btn-remove"
//                     onClick={() => {
//                       setFile(null);
//                       setShowExtractionResults(false);
//                       setExtractionDetails(null);
//                       document.getElementById('pdf-upload').value = '';
//                     }}
//                   >
//                     <X size={16} />
//                   </button>
//                 </div>
                
//                 <div className="upload-actions">
//                   <button 
//                     onClick={handleUpload} 
//                     className="btn-upload-mainz"
//                     disabled={!localStorage.getItem('token') || currentStage !== 'idle'}
//                   >
//                     {currentStage === 'idle' ? (
//                       <>
//                         <Upload size={16} />
//                         <span>Analyze Contract</span>
//                         {/* <ChevronRight size={16} /> */}
//                       </>
//                     ) : (
//                       <>
//                         <Loader2 className="spinner" size={16} />
//                         <span>Processing...</span>
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Processing Section - Only show when processing and not complete */}
//         {(currentStage !== 'idle' && currentStage !== 'complete' && currentStage !== 'error' && !showExtractionResults) && (
//           <div className="processing-section">
//             <div className="processing-header">
//               <h3>Processing Contract</h3>
//               <p className="processing-subtitle">Extracting contract data...</p>
//             </div>

//             <div className="progress-container">
//               <div className="progress-header">
//                 <span className="progress-label">Overall Progress</span>
//                 <span className="progress-percentage">{Math.min(Math.round(uploadProgress), 100)}%</span>
//               </div>
//               <div className="progress-bar">
//                 <div 
//                   className="progress-fill"
//                   style={{ width: `${Math.min(uploadProgress, 100)}%` }}
//                 ></div>
//               </div>
//             </div>

//             <div className="extraction-stages">
//               {extractionStages.map((stage) => {
//                 const isActive = currentStage === stage.id;
//                 const isCompleted = stageProgress[stage.id] === 100;
                
//                 return (
//                   <div 
//                     key={stage.id} 
//                     className={`extraction-stage ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
//                   >
//                     <div className="stage-icon">
//                       {isCompleted ? (
//                         <CheckCircle size={12} />
//                       ) : isActive ? (
//                         <Loader2 className="stage-spinner" size={12} />
//                       ) : (
//                         <div className="stage-placeholder"></div>
//                       )}
//                     </div>
//                     <span className="stage-label">{stage.label}</span>
//                     {stageProgress[stage.id] !== undefined && (
//                       <span className="stage-percentage">{Math.min(Math.round(stageProgress[stage.id]), 100)}%</span>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>

//             <div className="processing-status">
//               <span className="status-text">{uploadStatus}</span>
//             </div>
//           </div>
//         )}

//         {/* Extraction Results Section */}
//         {showExtractionResults && extractionDetails && (
//           <div className="extraction-results-section-fixed">
//             <div className="success-message-fixed">
//               <CheckCircle size={24} className="text-green-500" />
//               <div>
//                 <h3>Contract Saved to Drafts!</h3>
//                 <p>Contract has been extracted and saved as draft.</p>
//               </div>
//             </div>

//             <div className="extraction-details-card-fixed">
//               <h4>Extracted Contract Details</h4>
//               <div className="extraction-grid-fixed">
//                 <div className="extraction-field-fixed">
//                   <span className="field-label-fixed">Contract Name</span>
//                   <span className="field-value-fixed">{extractionDetails.grant_name}</span>
//                 </div>
//                 <div className="extraction-field-fixed">
//                   <span className="field-label-fixed">Contract ID</span>
//                   <span className="field-value-fixed">{extractionDetails.id}</span>
//                 </div>
//                 <div className="extraction-field-fixed">
//                   <span className="field-label-fixed">Status</span>
//                   <span className="field-value-fixed status-badge-fixed draft-fixed">Draft</span>
//                 </div>
//                 <div className="extraction-field-fixed">
//                   <span className="field-label-fixed">Total Amount</span>
//                   <span className="field-value-fixed">{formatCurrency(extractionDetails.total_amount)}</span>
//                 </div>
//                 <div className="extraction-field-fixed">
//                   <span className="field-label-fixed">Grantor</span>
//                   <span className="field-value-fixed">{extractionDetails.grantor || 'Not specified'}</span>
//                 </div>
//                 <div className="extraction-field-fixed">
//                   <span className="field-label-fixed">Upload Date</span>
//                   <span className="field-value-fixed">{formatDate(extractionDetails.uploaded_at)}</span>
//                 </div>
//               </div>

//               <div className="extraction-actions-fixed">
//                 <button 
//                   className="btn-upload-another"
//                   onClick={handleUploadAnother}
//                 >
//                   Upload Another
//                 </button>
//                 <button 
//                   className="btn-view-contract"
//                   onClick={handleViewContract}
//                 >
//                   <Eye size={16} />
//                   View Contract
//                 </button>
//                 <button 
//                   className="btn-view-drafts"
//                   onClick={handleViewInDrafts}
//                 >
//                   <FileText size={16} />
//                   View in Drafts
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Error State */}
//         {currentStage === 'error' && (
//           <div className="error-section-fixed">
//             <div className="error-message-fixed">
//               <AlertCircle size={20} />
//               <div>
//                 <h3>Upload Failed</h3>
//                 <p>{uploadStatus}</p>
//               </div>
//             </div>
//             <button 
//               className="btn-retry-fixed"
//               onClick={() => {
//                 setCurrentStage('idle');
//                 setUploadStatus('');
//                 setUploadProgress(0);
//                 setStageProgress({});
//               }}
//             >
//               Try Again
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default UploadPage;