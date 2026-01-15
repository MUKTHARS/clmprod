import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from './config';

function UploadPage({ setLoading, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setUploadStatus('');
      setUploadProgress(0);
    } else {
      setUploadStatus('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setUploadStatus('Uploading...');
    setUploadProgress(20);

    try {
      setUploadProgress(40);
      
      const response = await axios.post(API_CONFIG.ENDPOINTS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total ? 
            Math.round((progressEvent.loaded * 100) / progressEvent.total) : 
            0;
          setUploadProgress(40 + progress * 0.6);
        },
      });

      setUploadProgress(100);
      setUploadStatus('Upload successful! Processing complete.');
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
      
      // Navigate to the contract details page
      setTimeout(() => {
        navigate(`/contracts/${response.data.id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Error: ${error.response?.data?.detail || error.message || 'Upload failed'}`);
      setUploadProgress(0);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1>Upload Contract</h1>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="upload-container">
        <div className="upload-card">
          <div className="upload-icon">📄</div>
          <h2>Upload PDF Contract</h2>
          <p className="upload-description">
            Upload grant contracts, funding agreements, or research grant documents for AI-powered analysis.
          </p>
          
          <div className="upload-area">
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="pdf-upload" className="upload-dropzone">
              <div className="dropzone-content">
                <div className="dropzone-icon">📤</div>
                <p>Drag & drop your PDF file here</p>
                <p className="dropzone-subtext">or click to browse</p>
              </div>
            </label>
            
            {file && (
              <div className="file-preview">
                <div className="file-info">
                  <span className="file-icon">📋</span>
                  <div className="file-details">
                    <strong>{file.name}</strong>
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button 
                    className="btn-remove"
                    onClick={() => {
                      setFile(null);
                      document.getElementById('pdf-upload').value = '';
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            {uploadProgress > 0 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{Math.round(uploadProgress)}%</span>
              </div>
            )}
            
            <button 
              onClick={handleUpload} 
              className="btn-upload"
              disabled={!file || uploadProgress > 0}
            >
              {uploadProgress > 0 ? 'Processing...' : 'Upload & Analyze'}
            </button>
            
            {uploadStatus && (
              <div className={`upload-status ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>
                {uploadStatus}
              </div>
            )}
          </div>
          
          <div className="upload-features">
            <h3>What our AI extracts:</h3>
            <div className="features-grid">
              <div className="feature">
                <span className="feature-icon">💰</span>
                <div>
                  <strong>Financial Data</strong>
                  <p>Total amounts, payment schedules, budgets</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">📅</span>
                <div>
                  <strong>Key Dates</strong>
                  <p>Start/end dates, milestones, deadlines</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">👥</span>
                <div>
                  <strong>Parties Information</strong>
                  <p>Grantor, grantee, contact details</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">📑</span>
                <div>
                  <strong>Terms & Conditions</strong>
                  <p>Clauses, compliance, deliverables</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;

// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import API_URLS from './config';
// function UploadPage({ setLoading }) {
//   const [file, setFile] = useState(null);
//   const [uploadStatus, setUploadStatus] = useState('');
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const navigate = useNavigate();

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     if (selectedFile && selectedFile.type === 'application/pdf') {
//       setFile(selectedFile);
//       setUploadStatus('');
//       setUploadProgress(0);
//     } else {
//       setUploadStatus('Please select a valid PDF file');
//       setFile(null);
//     }
//   };

//   const handleUpload = async () => {
//     if (!file) {
//       setUploadStatus('Please select a file first');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('file', file);

//     setLoading(true);
//     setUploadStatus('Uploading...');
//     setUploadProgress(20);

//     try {
//       setUploadProgress(40);
//       const response = await axios.post('/api/upload/', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         onUploadProgress: (progressEvent) => {
//           const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           setUploadProgress(40 + progress * 0.6); // 40-100% range
//         },
//       });

//       setUploadProgress(100);
//       setUploadStatus('Upload successful! Processing complete.');
      
//       setTimeout(() => {
//         navigate(`/contracts/${response.data.id}`);
//       }, 1500);
      
//     } catch (error) {
//       console.error('Upload error:', error);
//       setUploadStatus(`Error: ${error.response?.data?.detail || error.message}`);
//       setUploadProgress(0);
//     } finally {
//       setTimeout(() => setLoading(false), 1000);
//     }
//   };

//   return (
//     <div className="upload-page">
//       <div className="page-header">
//         <h1>Upload Contract</h1>
//         <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
//           ← Back to Dashboard
//         </button>
//       </div>

//       <div className="upload-container">
//         <div className="upload-card">
//           <div className="upload-icon">📄</div>
//           <h2>Upload PDF Contract</h2>
//           <p className="upload-description">
//             Upload grant contracts, funding agreements, or research grant documents for AI-powered analysis.
//           </p>
          
//           <div className="upload-area">
//             <input
//               type="file"
//               id="pdf-upload"
//               accept=".pdf"
//               onChange={handleFileChange}
//               className="file-input"
//             />
//             <label htmlFor="pdf-upload" className="upload-dropzone">
//               <div className="dropzone-content">
//                 <div className="dropzone-icon">📤</div>
//                 <p>Drag & drop your PDF file here</p>
//                 <p className="dropzone-subtext">or click to browse</p>
//               </div>
//             </label>
            
//             {file && (
//               <div className="file-preview">
//                 <div className="file-info">
//                   <span className="file-icon">📋</span>
//                   <div className="file-details">
//                     <strong>{file.name}</strong>
//                     <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
//                   </div>
//                   <button 
//                     className="btn-remove"
//                     onClick={() => {
//                       setFile(null);
//                       document.getElementById('pdf-upload').value = '';
//                     }}
//                   >
//                     ×
//                   </button>
//                 </div>
//               </div>
//             )}
            
//             {uploadProgress > 0 && (
//               <div className="progress-container">
//                 <div className="progress-bar">
//                   <div 
//                     className="progress-fill"
//                     style={{ width: `${uploadProgress}%` }}
//                   ></div>
//                 </div>
//                 <span className="progress-text">{Math.round(uploadProgress)}%</span>
//               </div>
//             )}
            
//             <button 
//               onClick={handleUpload} 
//               className="btn-upload"
//               disabled={!file || uploadProgress > 0}
//             >
//               {uploadProgress > 0 ? 'Processing...' : 'Upload & Analyze'}
//             </button>
            
//             {uploadStatus && (
//               <div className={`upload-status ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>
//                 {uploadStatus}
//               </div>
//             )}
//           </div>
          
//           <div className="upload-features">
//             <h3>What our AI extracts:</h3>
//             <div className="features-grid">
//               <div className="feature">
//                 <span className="feature-icon">💰</span>
//                 <div>
//                   <strong>Financial Data</strong>
//                   <p>Total amounts, payment schedules, budgets</p>
//                 </div>
//               </div>
//               <div className="feature">
//                 <span className="feature-icon">📅</span>
//                 <div>
//                   <strong>Key Dates</strong>
//                   <p>Start/end dates, milestones, deadlines</p>
//                 </div>
//               </div>
//               <div className="feature">
//                 <span className="feature-icon">👥</span>
//                 <div>
//                   <strong>Parties Information</strong>
//                   <p>Grantor, grantee, contact details</p>
//                 </div>
//               </div>
//               <div className="feature">
//                 <span className="feature-icon">📑</span>
//                 <div>
//                   <strong>Terms & Conditions</strong>
//                   <p>Clauses, compliance, deliverables</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default UploadPage;