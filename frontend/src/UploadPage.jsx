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
  TrendingUp,
  DollarSign,
  Clock,
  Layers,
  Shield,
  Award,
  Target,
  BarChart3,
  Loader2,
  X,
  ChevronRight,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import './styles/UploadPage.css';

function UploadPage({ setLoading, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('idle'); // idle, uploading, extracting, processing, complete
  const [stageProgress, setStageProgress] = useState({});
  const [extractionDetails, setExtractionDetails] = useState(null);
  const navigate = useNavigate();

  const extractionStages = [
    { id: 'upload', label: 'Uploading', icon: Upload, weight: 10 },
    { id: 'parsing', label: 'Parsing', icon: FileText, weight: 15 },
    { id: 'structure', label: 'Structure', icon: Layers, weight: 20 },
    { id: 'financial', label: 'Financial Data', icon: DollarSign, weight: 20 },
    { id: 'parties', label: 'Parties', icon: User, weight: 10 },
    { id: 'dates', label: 'Dates', icon: Calendar, weight: 10 },
    { id: 'terms', label: 'Terms', icon: Shield, weight: 15 },
    { id: 'summary', label: 'Summary', icon: BarChart3, weight: 10 },
  ];

  // Sample data for the preview table
  const previewData = [
    { field: 'Contract Name', value: 'Will be extracted from document', icon: FileText },
    { field: 'Contract Value', value: 'Financial amount extracted', icon: DollarSign },
    { field: 'Start Date', value: 'Contract commencement date', icon: Calendar },
    { field: 'End Date', value: 'Contract expiration date', icon: Calendar },
    { field: 'Grantor', value: 'Funding organization', icon: User },
    { field: 'Grantee', value: 'Receiving organization', icon: User },
    { field: 'Payment Schedule', value: 'Installment details', icon: TrendingUp },
    { field: 'Key Terms', value: 'Important clauses', icon: Shield },
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

  const simulateStageProgress = (stageId, duration = 1000) => {
    return new Promise(resolve => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setStageProgress(prev => ({
          ...prev,
          [stageId]: progress * 100
        }));
        
        if (elapsed >= duration) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
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
    setUploadProgress(5);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Stage 1: Uploading
      await simulateStageProgress('upload', 800);
      setUploadProgress(15);

      // FIX: Use the correct endpoint URL with trailing slash
      const uploadUrl = `${API_CONFIG.BASE_URL}/upload/`;
      
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total ? 
            Math.round((progressEvent.loaded * 100) / progressEvent.total) : 
            0;
          setUploadProgress(15 + progress * 0.2);
        },
      });

      setUploadProgress(35);
      setCurrentStage('extracting');

      // Simulate extraction stages
      for (let i = 1; i < extractionStages.length; i++) {
        const stage = extractionStages[i];
        setCurrentStage(stage.id);
        setUploadStatus(`Processing: ${stage.label}`);
        
        const stageStart = 35 + extractionStages.slice(0, i).reduce((sum, s) => sum + s.weight, 0);
        const stageEnd = stageStart + stage.weight;
        
        await simulateStageProgress(stage.id, 1000 + Math.random() * 500);
        setUploadProgress(stageEnd);
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
          duration: response.data.comprehensive_data?.contract_details?.duration || 'Not specified',
          extractedSections: response.data.comprehensive_data ? Object.keys(response.data.comprehensive_data).length : 0,
          id: response.data.id
        });
      }
      
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
      
      setTimeout(() => {
        navigate(`/contracts/${response.data.id}`);
      }, 2500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setCurrentStage('error');
      
      let errorMessage = 'Upload failed';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          // Redirect to login
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
      <div className="upload-container">
        <div className="upload-card">
          <div className="upload-header">
            <FileCheck className="upload-icon-main" />
            <h1>Upload Contract</h1>
            <p className="upload-subtitle">
              Upload PDF contracts for automated analysis and data extraction
            </p>
          </div>

          <div className="upload-content">
            {/* File Selection Area - Compact */}
            {!file && (
              <div className="file-selection-area">
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label 
                  htmlFor="pdf-upload" 
                  className="upload-dropzone"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="dropzone-content">
                    <div className="dropzone-text">
                      <Upload className="dropzone-icon" />
                      <div>
                        <p className="dropzone-title">Upload PDF Contract</p>
                        <p className="dropzone-subtext">Click to select or drag & drop</p>
                      </div>
                    </div>
                    <div className="file-type-badge">
                      <File size={14} />
                      <span>PDF files only</span>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* File Preview - Compact */}
            {file && currentStage === 'idle' && (
              <div className="file-preview-section">
                <div className="selected-file-card">
                  <div className="selected-file-header">
                    <div className="file-info">
                      <div className="file-header-row">
                        <FileText className="file-preview-icon" />
                        <div>
                          <h3>{file.name}</h3>
                          <div className="file-meta">
                            <span className="file-size">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="file-type">PDF Document</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        className="btn-remove-file"
                        onClick={() => {
                          setFile(null);
                          document.getElementById('pdf-upload').value = '';
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    <button 
                      onClick={handleUpload} 
                      className="btn-analyze"
                      disabled={!localStorage.getItem('token')}
                    >
                      <FileCheck size={18} />
                      <span>Analyze Contract</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Table of What Will Be Extracted */}
            <div className="preview-table-section">
              <div className="preview-table-header">
                <h3>Data to be Extracted</h3>
                <p className="table-subtitle">The following information will be extracted from your contract:</p>
              </div>
              
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <tr key={index}>
                          <td>
                            <div className="field-cell">
                              <Icon size={16} />
                              <span>{item.field}</span>
                            </div>
                          </td>
                          <td>{item.value}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Processing State */}
            {(currentStage !== 'idle' && currentStage !== 'complete' && currentStage !== 'error') && (
              <div className="processing-section">
                <div className="processing-header">
                  <h3>Processing Contract</h3>
                  <p className="processing-subtitle">Extracting contract data...</p>
                </div>

                <div className="main-progress-container">
                  <div className="progress-header">
                    <span className="progress-label">Progress</span>
                    <span className="progress-percentage">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="main-progress-bar">
                    <div 
                      className="main-progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Extraction Stages - Simplified */}
                <div className="extraction-stages">
                  {extractionStages.map((stage, index) => {
                    const isActive = currentStage === stage.id;
                    const isCompleted = stageProgress[stage.id] === 100;
                    
                    return (
                      <div 
                        key={stage.id} 
                        className={`extraction-stage ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      >
                        <div className="stage-icon-container">
                          <div className="stage-icon-bg">
                            {isCompleted ? (
                              <CheckCircle size={14} />
                            ) : isActive ? (
                              <Loader2 className="stage-spinner" size={14} />
                            ) : (
                              <stage.icon size={14} />
                            )}
                          </div>
                        </div>
                        <div className="stage-content">
                          <span className="stage-label">{stage.label}</span>
                          {stageProgress[stage.id] && (
                            <div className="stage-progress">
                              <span className="stage-percentage">
                                {Math.round(stageProgress[stage.id])}%
                              </span>
                            </div>
                          )}
                        </div>
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
                <div className="complete-header">
                  <div className="success-icon-wrapper">
                    <CheckCircle className="success-icon" />
                  </div>
                  <h3>Contract Analyzed</h3>
                  <p className="complete-subtitle">
                    Ready to view details
                  </p>
                </div>

                <div className="extraction-results">
                  <div className="result-card">
                    <div className="result-icon">
                      <FileText size={16} />
                    </div>
                    <div className="result-content">
                      <span className="result-label">Contract</span>
                      <span className="result-value">{extractionDetails.contractName}</span>
                    </div>
                  </div>

                  <div className="result-card">
                    <div className="result-icon">
                      <DollarSign size={16} />
                    </div>
                    <div className="result-content">
                      <span className="result-label">Value</span>
                      <span className="result-value">{extractionDetails.totalAmount}</span>
                    </div>
                  </div>

                  <div className="redirect-notice">
                    <Loader2 className="redirect-spinner" />
                    <span>Redirecting to contract details...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {currentStage === 'error' && (
              <div className="error-section">
                <div className="error-header">
                  <AlertCircle className="error-icon" />
                  <h3>Processing Error</h3>
                </div>
                <div className="error-content">
                  <p>{uploadStatus}</p>
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
              </div>
            )}
          </div>

          {/* Features Grid - Simplified */}
          <div className="features-section">
            <h3>Extraction Capabilities</h3>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon financial">
                  <DollarSign size={20} />
                </div>
                <h4>Financial Data</h4>
                <p>Extracts payment schedules and budget information</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon legal">
                  <Shield size={20} />
                </div>
                <h4>Legal Terms</h4>
                <p>Identifies key clauses and obligations</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon timeline">
                  <Calendar size={20} />
                </div>
                <h4>Dates & Milestones</h4>
                <p>Extracts all timeline information</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon parties">
                  <User size={20} />
                </div>
                <h4>Parties Information</h4>
                <p>Identifies all involved organizations and contacts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
