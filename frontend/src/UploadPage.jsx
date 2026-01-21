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
  ChevronRight
} from 'lucide-react';
import './styles/UploadPage.css';

function UploadPage({ setLoading, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('idle');
  const [stageProgress, setStageProgress] = useState({});
  const [extractionDetails, setExtractionDetails] = useState(null);
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
    setCurrentStage('uploading');
    setUploadStatus('Uploading file...');
    setUploadProgress(0);

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
        setExtractionDetails({
          contractName: response.data.grant_name || response.data.filename || 'Unnamed Contract',
          totalAmount: response.data.total_amount 
            ? `$${response.data.total_amount.toLocaleString()}`
            : 'Not specified',
          id: response.data.id
        });
      }
      
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
      
      setTimeout(() => {
        navigate(`/contracts/${response.data.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setCurrentStage('error');
      
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
      setTimeout(() => setLoading(false), 1000);
    }
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
      } else {
        setUploadStatus('Please select a valid PDF file');
        setFile(null);
      }
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        {/* Upload Area - More Visible */}
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
                    <h3>Upload Contract PDF</h3>
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
                      document.getElementById('pdf-upload').value = '';
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="upload-actions">
                  <button 
                    onClick={handleUpload} 
                    className="btn-upload-main"
                    disabled={!localStorage.getItem('token') || currentStage !== 'idle'}
                  >
                    {currentStage === 'idle' ? (
                      <>
                        <Upload size={16} />
                        <span>Analyze Contract</span>
                        <ChevronRight size={16} />
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

        {/* Processing Section */}
        {(currentStage !== 'idle' && currentStage !== 'complete' && currentStage !== 'error') && (
          <div className="processing-section">
            <div className="processing-header">
              <h3>Processing Contract</h3>
              <p className="processing-subtitle">Extracting contract data...</p>
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

        {/* Complete State */}
        {currentStage === 'complete' && extractionDetails && (
          <div className="complete-section">
            <div className="success-message">
              <CheckCircle size={20} />
              <div>
                <h3>Contract Analyzed Successfully!</h3>
                <p>Redirecting to contract details...</p>
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
//   Shield
// } from 'lucide-react';
// import './styles/UploadPage.css';

// function UploadPage({ setLoading, onUploadComplete }) {
//   const [file, setFile] = useState(null);
//   const [uploadStatus, setUploadStatus] = useState('');
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [currentStage, setCurrentStage] = useState('idle');
//   const [stageProgress, setStageProgress] = useState({});
//   const [extractionDetails, setExtractionDetails] = useState(null);
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
//           [stageId]: Math.min(progress * 100, 100) // Ensure doesn't exceed 100%
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
//           setUploadProgress(20 + progress * 0.2); // Max 40% from upload
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
        
//         const stageWeight = stage.weight * 0.6; // Remaining 60% for extraction
        
//         await simulateStageProgress(stage.id, 700 + Math.random() * 300);
        
//         cumulativeProgress += stageWeight;
//         setUploadProgress(Math.min(cumulativeProgress, 100)); // Ensure doesn't exceed 100%
//       }

//       setUploadProgress(100);
//       setCurrentStage('complete');
//       setUploadStatus('Analysis complete');
      
//       if (response.data) {
//         setExtractionDetails({
//           contractName: response.data.grant_name || response.data.filename || 'Unnamed Contract',
//           totalAmount: response.data.total_amount 
//             ? `$${response.data.total_amount.toLocaleString()}`
//             : 'Not specified',
//           id: response.data.id
//         });
//       }
      
//       if (onUploadComplete) {
//         onUploadComplete(response.data);
//       }
      
//       setTimeout(() => {
//         navigate(`/contracts/${response.data.id}`);
//       }, 2000);
      
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
//       } else {
//         setUploadStatus('Please select a valid PDF file');
//         setFile(null);
//       }
//     }
//   };

//   return (
//     <div className="upload-page">
//       <div className="upload-card">
//         {/* Search and Upload Area - Similar to Dashboard */}
//         <div className="upload-controls">
//           <div className="search-box">
//             <FileText size={14} />
//             <input
//               type="text"
//               placeholder="Upload contract..."
//               value={file ? file.name : ''}
//               readOnly
//               className="search-input"
//             />
//           </div>
          
//           <div className="controls-right">
//             <input
//               type="file"
//               id="pdf-upload"
//               accept=".pdf"
//               onChange={handleFileChange}
//               className="file-input"
//             />
//             <label htmlFor="pdf-upload" className="btn-upload">
//               <Upload size={14} />
//               Select File
//             </label>
            
//             {file && currentStage === 'idle' && (
//               <button 
//                 onClick={handleUpload} 
//                 className="btn-analyze"
//                 disabled={!localStorage.getItem('token')}
//               >
//                 <Loader2 size={14} />
//                 Analyze
//               </button>
//             )}
            
//             {file && (
//               <button 
//                 className="btn-icon"
//                 onClick={() => {
//                   setFile(null);
//                   document.getElementById('pdf-upload').value = '';
//                 }}
//                 title="Remove file"
//               >
//                 <X size={14} />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Processing Section - Shows above preview when active */}
//         {(currentStage !== 'idle' && currentStage !== 'complete' && currentStage !== 'error') && (
//           <div className="processing-section">
//             <div className="progress-container">
//               <div className="progress-header">
//                 <span className="progress-label">Upload Progress</span>
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

//         {/* Complete State */}
//         {currentStage === 'complete' && extractionDetails && (
//           <div className="complete-section">
//             <div className="success-message">
//               <CheckCircle size={16} />
//               <div>
//                 <h3>Contract Analyzed</h3>
//                 <p>Redirecting to contract details...</p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Error State */}
//         {currentStage === 'error' && (
//           <div className="error-section">
//             <div className="error-message">
//               <AlertCircle size={16} />
//               <div>
//                 <h3>Processing Error</h3>
//                 <p>{uploadStatus}</p>
//               </div>
//             </div>
//             <button 
//               className="btn-retry"
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

//         {/* Data Preview Section - Always shows */}
//         <div className="preview-section">
//           <div className="section-header">
//             <h2>Data to be Extracted</h2>
//             <p className="section-subtitle">The following information will be extracted from your contract</p>
//           </div>

//           <div className="preview-grid">
//             <div className="preview-card">
//               <div className="preview-header">
//                 <FileText size={14} />
//                 <h3>Contract Information</h3>
//               </div>
//               <div className="preview-content">
//                 <p>• Contract Name & ID</p>
//                 <p>• Contract Number</p>
//                 <p>• Purpose & Scope</p>
//               </div>
//             </div>

//             <div className="preview-card">
//               <div className="preview-header">
//                 <DollarSign size={14} />
//                 <h3>Financial Data</h3>
//               </div>
//               <div className="preview-content">
//                 <p>• Total Grant Amount</p>
//                 <p>• Payment Schedule</p>
//                 <p>• Currency & Terms</p>
//               </div>
//             </div>

//             <div className="preview-card">
//               <div className="preview-header">
//                 <User size={14} />
//                 <h3>Parties</h3>
//               </div>
//               <div className="preview-content">
//                 <p>• Grantor Organization</p>
//                 <p>• Grantee Organization</p>
//                 <p>• Contact Information</p>
//               </div>
//             </div>

//             <div className="preview-card">
//               <div className="preview-header">
//                 <Calendar size={14} />
//                 <h3>Timeline</h3>
//               </div>
//               <div className="preview-content">
//                 <p>• Start Date</p>
//                 <p>• End Date</p>
//                 <p>• Key Milestones</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Features Section */}
//         <div className="features-section">
//           <div className="section-header">
//             <h2>Extraction Features</h2>
//           </div>
          
//           <div className="features-list">
//             <div className="feature-item">
//               <div className="feature-icon">
//                 <Shield size={14} />
//               </div>
//               <div>
//                 <h4>Secure Processing</h4>
//                 <p>Your documents are processed securely and never stored permanently</p>
//               </div>
//             </div>
            
//             <div className="feature-item">
//               <div className="feature-icon">
//                 <CheckCircle size={14} />
//               </div>
//               <div>
//                 <h4>High Accuracy</h4>
//                 <p>Advanced AI extraction with 95%+ accuracy on standard contracts</p>
//               </div>
//             </div>
            
//             <div className="feature-item">
//               <div className="feature-icon">
//                 <FileText size={14} />
//               </div>
//               <div>
//                 <h4>Structured Data</h4>
//                 <p>Converts unstructured contract data into organized, searchable format</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default UploadPage;