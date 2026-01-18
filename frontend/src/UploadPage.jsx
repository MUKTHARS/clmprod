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
  Sparkles,
  Zap
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
    { id: 'upload', label: 'Uploading File', icon: Upload, weight: 10 },
    { id: 'parsing', label: 'Parsing Document', icon: FileText, weight: 15 },
    { id: 'structure', label: 'Analyzing Structure', icon: Layers, weight: 20 },
    { id: 'financial', label: 'Extracting Financial Data', icon: DollarSign, weight: 20 },
    { id: 'parties', label: 'Identifying Parties', icon: User, weight: 10 },
    { id: 'dates', label: 'Extracting Dates', icon: Calendar, weight: 10 },
    { id: 'terms', label: 'Analyzing Terms', icon: Shield, weight: 15 },
    { id: 'summary', label: 'Generating Summary', icon: BarChart3, weight: 10 },
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
    setUploadStatus('Starting upload...');
    setUploadProgress(5);

    try {
      // Stage 1: Uploading
      await simulateStageProgress('upload', 800);
      setUploadProgress(15);

      const response = await axios.post(API_CONFIG.ENDPOINTS.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total ? 
            Math.round((progressEvent.loaded * 100) / progressEvent.total) : 
            0;
          setUploadProgress(15 + progress * 0.2); // Upload takes 20% of total
        },
      });

      setUploadProgress(35);
      setCurrentStage('extracting');

      // Simulate extraction stages
      for (let i = 1; i < extractionStages.length; i++) {
        const stage = extractionStages[i];
        setCurrentStage(stage.id);
        setUploadStatus(`Processing: ${stage.label}`);
        
        // Calculate progress based on stage weight
        const stageStart = 35 + extractionStages.slice(0, i).reduce((sum, s) => sum + s.weight, 0);
        const stageEnd = stageStart + stage.weight;
        
        await simulateStageProgress(stage.id, 1000 + Math.random() * 500);
        
        // Update overall progress
        setUploadProgress(stageEnd);
      }

      setUploadProgress(100);
      setCurrentStage('complete');
      setUploadStatus('Analysis complete!');
      
      if (response.data) {
        setExtractionDetails({
          contractName: response.data.contract_details?.grant_name || 'Unnamed Contract',
          totalAmount: response.data.financial_details?.total_grant_amount 
            ? `$${response.data.financial_details.total_grant_amount.toLocaleString()}`
            : 'Not specified',
          duration: response.data.contract_details?.duration || 'Not specified',
          extractedSections: Object.keys(response.data).filter(key => 
            response.data[key] && typeof response.data[key] === 'object'
          ).length,
          id: response.data.id
        });
      }
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(response.data);
      }
      
      // Navigate after a delay
      setTimeout(() => {
        navigate(`/contracts/${response.data.id}`);
      }, 2500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setCurrentStage('error');
      setUploadStatus(`Error: ${error.response?.data?.detail || error.message || 'Upload failed'}`);
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
            <div className="upload-icon-wrapper">
              <Sparkles className="upload-icon-sparkle" />
              <FileText className="upload-icon-main" />
            </div>
            <h1>AI-Powered Contract Analysis</h1>
            <p className="upload-subtitle">
              Upload grant contracts for comprehensive AI analysis and intelligent insights
            </p>
          </div>

          <div className="upload-content">
            {/* File Selection Area */}
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
                    <Upload className="dropzone-icon" />
                    <div className="dropzone-text">
                      <p className="dropzone-title">Drag & drop your PDF contract</p>
                      <p className="dropzone-subtext">or click to browse files</p>
                    </div>
                    <div className="file-type-badge">
                      <File size={14} />
                      <span>PDF only</span>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* File Preview */}
            {file && currentStage === 'idle' && (
              <div className="file-preview-section">
                <div className="selected-file-card">
                  <div className="selected-file-header">
                    <FileText className="file-preview-icon" />
                    <div className="file-info">
                      <h3>{file.name}</h3>
                      <div className="file-meta">
                        <span className="file-size">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="file-type">PDF Document</span>
                      </div>
                    </div>
                    <button 
                      className="btn-remove-file"
                      onClick={() => {
                        setFile(null);
                        document.getElementById('pdf-upload').value = '';
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="analysis-preview">
                    <h4>What will be analyzed:</h4>
                    <div className="preview-features">
                      <div className="preview-feature">
                        <DollarSign size={16} />
                        <span>Financial Data & Payment Schedules</span>
                      </div>
                      <div className="preview-feature">
                        <Calendar size={16} />
                        <span>Key Dates & Milestones</span>
                      </div>
                      <div className="preview-feature">
                        <User size={16} />
                        <span>Parties & Signatories</span>
                      </div>
                      <div className="preview-feature">
                        <Shield size={16} />
                        <span>Terms & Conditions</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleUpload} 
                    className="btn-analyze"
                  >
                    <Zap className="analyze-icon" />
                    <span>Start AI Analysis</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Processing State */}
            {(currentStage !== 'idle' && currentStage !== 'complete' && currentStage !== 'error') && (
              <div className="processing-section">
                <div className="processing-header">
                  <Loader2 className="processing-spinner" />
                  <h2>Analyzing Contract</h2>
                  <p className="processing-subtitle">AI is extracting and analyzing contract data</p>
                </div>

                {/* Main Progress Bar */}
                <div className="main-progress-container">
                  <div className="progress-header">
                    <span className="progress-label">Overall Progress</span>
                    <span className="progress-percentage">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="main-progress-bar">
                    <div 
                      className="main-progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Extraction Stages */}
                <div className="extraction-stages">
                  {extractionStages.map((stage, index) => {
                    const isActive = currentStage === stage.id;
                    const isCompleted = stageProgress[stage.id] === 100;
                    const isUpcoming = !stageProgress[stage.id] && !isActive;
                    
                    return (
                      <div 
                        key={stage.id} 
                        className={`extraction-stage ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      >
                        <div className="stage-icon-container">
                          <div className="stage-icon-bg">
                            {isCompleted ? (
                              <CheckCircle size={18} />
                            ) : isActive ? (
                              <Loader2 className="stage-spinner" size={18} />
                            ) : (
                              <stage.icon size={18} />
                            )}
                          </div>
                          {index < extractionStages.length - 1 && (
                            <div className="stage-connector">
                              <div 
                                className="stage-connector-fill"
                                style={{ width: `${stageProgress[stage.id] || 0}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                        <div className="stage-content">
                          <div className="stage-header">
                            <span className="stage-label">{stage.label}</span>
                            <span className="stage-percentage">
                              {stageProgress[stage.id] ? `${Math.round(stageProgress[stage.id])}%` : ''}
                            </span>
                          </div>
                          {stageProgress[stage.id] && (
                            <div className="stage-progress-bar">
                              <div 
                                className="stage-progress-fill"
                                style={{ width: `${stageProgress[stage.id]}%` }}
                              ></div>
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
                  <h2>Analysis Complete!</h2>
                  <p className="complete-subtitle">
                    Contract successfully analyzed by AI
                  </p>
                </div>

                <div className="extraction-results">
                  <div className="result-card">
                    <div className="result-icon">
                      <FileText size={20} />
                    </div>
                    <div className="result-content">
                      <span className="result-label">Contract Name</span>
                      <span className="result-value">{extractionDetails.contractName}</span>
                    </div>
                  </div>

                  <div className="result-card">
                    <div className="result-icon">
                      <DollarSign size={20} />
                    </div>
                    <div className="result-content">
                      <span className="result-label">Total Value</span>
                      <span className="result-value">{extractionDetails.totalAmount}</span>
                    </div>
                  </div>

                  <div className="result-card">
                    <div className="result-icon">
                      <Calendar size={20} />
                    </div>
                    <div className="result-content">
                      <span className="result-label">Duration</span>
                      <span className="result-value">{extractionDetails.duration}</span>
                    </div>
                  </div>

                  <div className="result-card">
                    <div className="result-icon">
                      <Layers size={20} />
                    </div>
                    <div className="result-content">
                      <span className="result-label">Sections Analyzed</span>
                      <span className="result-value">{extractionDetails.extractedSections}</span>
                    </div>
                  </div>
                </div>

                <div className="redirect-notice">
                  <Loader2 className="redirect-spinner" />
                  <span>Redirecting to contract details...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {currentStage === 'error' && (
              <div className="error-section">
                <div className="error-header">
                  <AlertCircle className="error-icon" />
                  <h2>Analysis Failed</h2>
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

          {/* Features Grid */}
          <div className="features-section">
            <h3>Comprehensive AI Analysis Features</h3>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon financial">
                  <DollarSign size={24} />
                </div>
                <h4>Financial Intelligence</h4>
                <p>Extracts payment schedules, budgets, and financial terms with precision</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon legal">
                  <Shield size={24} />
                </div>
                <h4>Legal Analysis</h4>
                <p>Identifies key clauses, obligations, and risk factors</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon timeline">
                  <TrendingUp size={24} />
                </div>
                <h4>Timeline Mapping</h4>
                <p>Extracts all dates, milestones, and project timelines</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon parties">
                  <User size={24} />
                </div>
                <h4>Party Intelligence</h4>
                <p>Identifies all parties, roles, and contact information</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;