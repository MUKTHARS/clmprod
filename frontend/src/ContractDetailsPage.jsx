// C:\saple.ai\POC\frontend\src\ContractDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react'; 
import PDFViewer from './components/pdf/PDFViewer';
import {
  ArrowLeft,
  Upload,
  Calendar,
  Share2,
  Search,
  FileText,
  Download,
  Copy,
  Link,
  BarChart3,
  Bell,
  Archive,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  ChevronRight,
  Layers,
  Shield,
  Target,
  FileCheck,
  AlertCircle,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  TrendingUp,
  FileBarChart,
  BookOpen,
  ShieldCheck,
  Plus,
  Minus,
  ExternalLink,
  Loader2,
  RefreshCw,
  MessageSquare,
  XCircle,
  FileUp
} from 'lucide-react';
import ComprehensiveView from './ComprehensiveView';
import API_CONFIG from './config';
import ProjectManagerActions from './components/workflow/ProjectManagerActions';
import './styles/ContractDetailsPage.css';

import AgreementWorkflow from './components/workflow/AgreementWorkflow';
function ContractDetailsPage({ user = null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDraft, setIsDraft] = useState(false);
  const [contractData, setContractData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis');
  const [expandedSections, setExpandedSections] = useState({
   
    contractDetails: true,
    financial: true,
    parties: true,
    deliverables: true,
    terms: true,
    compliance: true,
    executiveSummary: true
  });
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFilename, setPdfFilename] = useState('');
  const [loadingPDF, setLoadingPDF] = useState(false);
  // State for comments section
  const [pmComments, setPmComments] = useState([]);
  const [pmCommentsLoading, setPmCommentsLoading] = useState(false);
  
  // State for deliverables upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [uploadDate, setUploadDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({}); // Track uploaded files per deliverable
  
  const handleViewPDF = async () => {
    if (!contractData?.contract_id) return;
    
    try {
      setLoadingPDF(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/contracts/${contractData.contract_id}/pdf-url`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPdfUrl(data.pdf_url);
        setPdfFilename(data.original_filename || 'document.pdf');
        setShowPDFViewer(true);
      } else {
        alert('PDF not available or you don\'t have permission to view it');
      }
    } catch (error) {
      console.error('Failed to fetch PDF:', error);
      alert('Failed to load PDF document');
    } finally {
      setLoadingPDF(false);
    }
  };
useEffect(() => {
  if (contractData) {
    setIsDraft(contractData.status === 'draft');
    
    // If it's a draft and user is project manager, show draft workflow
    if (contractData.status === 'draft' && user?.role === 'project_manager') {
      console.log('This is a draft contract');
    }
  }
}, [contractData, user]);
const handleViewDeliverableFile = async (deliverableIndex) => {
  const uploadedFile = uploadedFiles[deliverableIndex];
  if (!uploadedFile?.fileId) {
    alert('No file uploaded for this deliverable');
    return;
  }

  try {
    setLoadingPDF(true);
    const token = localStorage.getItem('token');
    
    // Get the file directly
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/deliverables/${uploadedFile.fileId}/file`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const blob = await response.blob();
      const fileName = uploadedFile.fileName || 'file';
      const fileExtension = fileName.split('.').pop().toLowerCase();
      const isPDF = fileExtension === 'pdf';
      
      // Create object URL
      const url = URL.createObjectURL(blob);
      
      // Store file info for download
      const fileInfo = {
        url: url,
        filename: fileName,
        isPDF: isPDF,
        fileExtension: fileExtension,
        blob: blob
      };
      
      // Store in localStorage for the PDF viewer
      localStorage.setItem('currentFileInfo', JSON.stringify({
        filename: fileName,
        isPDF: isPDF,
        fileExtension: fileExtension
      }));
      
      // For PDFs, use the blob URL directly
      if (isPDF) {
        setPdfUrl(url);
        setPdfFilename(fileName);
        setShowPDFViewer(true);
      } else {
        // For non-PDF files, we need to handle them differently
        // Try to create a data URL for display
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          setPdfUrl(dataUrl);
          setPdfFilename(fileName);
          setShowPDFViewer(true);
        };
        
        // Read as data URL for images, text as text, others as binary
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
          reader.readAsDataURL(blob);
        } else if (['txt', 'csv', 'html', 'xml', 'json'].includes(fileExtension)) {
          reader.readAsText(blob);
        } else {
          // For other files, just use blob URL and let the viewer handle it
          setPdfUrl(url);
          setPdfFilename(fileName);
          setShowPDFViewer(true);
        }
      }
    } else {
      alert('File not available or you don\'t have permission to view it');
    }
  } catch (error) {
    console.error('Failed to fetch deliverable file:', error);
    alert('Failed to load deliverable file');
  } finally {
    setLoadingPDF(false);
  }
};

  // Update this useEffect (near the top of your component)
  useEffect(() => {
    const fileInput = document.getElementById('file-input-real');
    const fileInfo = document.getElementById('selected-file-info');
    const fileNameSpan = document.getElementById('selected-file-name');
    
    if (fileInput && fileInfo && fileNameSpan) {
      // Hide file info initially
      fileInfo.style.display = 'none';
      
      const handleFileChange = function() {
        if (this.files && this.files[0]) {
          const file = this.files[0];
          const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
          fileNameSpan.textContent = `${file.name} (${fileSizeMB} MB)`;
          fileInfo.style.display = 'flex';
        } else {
          fileInfo.style.display = 'none';
        }
      };
      
      fileInput.addEventListener('change', handleFileChange);
      
      // Cleanup
      return () => {
        if (fileInput) {
          fileInput.removeEventListener('change', handleFileChange);
        }
      };
    }
  }, [showUploadModal]); // Run when modal opens/closes

  useEffect(() => {
    console.log('ContractDetailsPage mounted with id:', id);
    
    if (id) {
      const contractId = parseInt(id);
      console.log('Parsed contract ID:', contractId);
      
      if (!isNaN(contractId) && contractId > 0) {
        fetchContractData(contractId);
      } else {
        console.error('Invalid contract ID format:', id);
        setLoading(false);
        setContractData(null);
      }
    } else {
      console.error('No contract ID provided');
      setLoading(false);
      setContractData(null);
    }
  }, [id]);

  useEffect(() => {
    if (contractData && user?.role === "project_manager") {
      fetchReviewComments();
      // Load any existing uploaded files for deliverables
      loadUploadedFiles();
    }
  }, [contractData, user]);

const loadUploadedFiles = async () => {
  if (!contractData?.contract_id) {
    console.log('No contract ID available yet');
    return;
  }
  
  try {
    console.log('Loading uploaded files for contract:', contractData.contract_id);
    const token = localStorage.getItem('token');
    
    // Get deliverables from the database
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/deliverables/contract/${contractData.contract_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const deliverables = await response.json();
      console.log('Loaded deliverables from database:', deliverables.length, 'items');
      
      // Create a mapping of deliverable data
      const uploadsMap = {};
      
      deliverables.forEach(deliverable => {
        console.log('Processing deliverable from database:', deliverable);
        
        // Find the index in the original deliverables array
        const compData = contractData.comprehensive_data || {};
        const origDeliverables = compData.deliverables?.items || [];
        
        // Try to find by name
        let index = -1;
        if (deliverable.deliverable_name) {
          index = origDeliverables.findIndex(d => 
            d && d.deliverable_name === deliverable.deliverable_name
          );
        }
        
        // If not found by name, try to match by position
        if (index === -1) {
          // Simple index based on order in database
          index = deliverables.indexOf(deliverable);
        }
        
        if (deliverable.uploaded_at || deliverable.status === 'submitted' || deliverable.uploaded_file_name) {
          console.log('Found uploaded deliverable at index:', index, deliverable);
          uploadsMap[index] = {
            deliverableId: deliverable.id,
            deliverableName: deliverable.deliverable_name || `Deliverable ${index + 1}`,
            uploadDate: deliverable.uploaded_at ? deliverable.uploaded_at.split('T')[0] : new Date().toISOString().split('T')[0],
            uploadTimestamp: deliverable.uploaded_at || new Date().toISOString(),
            fileName: deliverable.uploaded_file_name || 'Uploaded file',
            status: deliverable.status || 'submitted',
            fileId: deliverable.id,
            hasFile: true,
            fileUrl: deliverable.uploaded_file_path,
            description: deliverable.description || '',
            uploadedBy: deliverable.uploaded_by
          };
        }
      });
      
      console.log('Final uploads map from database:', uploadsMap);
      setUploadedFiles(uploadsMap);
      
      // Save to localStorage for quick access
      localStorage.setItem(`contract_${contractData.contract_id}_deliverable_uploads`, JSON.stringify(uploadsMap));
      
    } else {
      console.error('Failed to load deliverables from database:', response.status);
      // Fallback to localStorage
      const savedUploads = localStorage.getItem(`contract_${contractData.contract_id}_deliverable_uploads`);
      if (savedUploads) {
        try {
          const parsedUploads = JSON.parse(savedUploads);
          console.log('Using fallback from localStorage:', parsedUploads);
          setUploadedFiles(parsedUploads);
        } catch (e) {
          console.error('Error loading saved uploads:', e);
          setUploadedFiles({});
        }
      } else {
        setUploadedFiles({});
      }
    }
  } catch (error) {
    console.error('Error loading uploaded files:', error);
    // Fallback to localStorage
    const savedUploads = localStorage.getItem(`contract_${id}_deliverable_uploads`);
    if (savedUploads) {
      try {
        const parsedUploads = JSON.parse(savedUploads);
        console.log('Error fallback from localStorage:', parsedUploads);
        setUploadedFiles(parsedUploads);
      } catch (e) {
        console.error('Error loading saved uploads from error fallback:', e);
        setUploadedFiles({});
      }
    } else {
      setUploadedFiles({});
    }
  }
};

const refreshUploadedFiles = async () => {
  console.log('Manually refreshing uploaded files...');
  await loadUploadedFiles();
};

// And update the useEffect to also load uploaded files for ALL users, not just project managers:
useEffect(() => {
  if (contractData) {
    console.log('Contract data loaded, fetching deliverables for all users');
    // Load uploaded files for ALL users (Project Manager, Program Manager, Director)
    loadUploadedFiles();
    
    // Only load comments for project managers
    if (user?.role === "project_manager") {
      fetchReviewComments();
    }
  }
}, [contractData, id, user?.role]);

  // Function to save uploaded files
  const saveUploadedFiles = (files) => {
    setUploadedFiles(files);
    localStorage.setItem(`contract_${id}_deliverable_uploads`, JSON.stringify(files));
  };

  const fetchContractData = async (contractId) => {
    console.log('Fetching contract data for ID:', contractId);
    
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const comprehensiveUrl = `${API_CONFIG.BASE_URL}/api/contracts/${contractId}/comprehensive`;
      console.log('Trying comprehensive endpoint:', comprehensiveUrl);
      
      let response = await fetch(comprehensiveUrl, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Comprehensive data fetched:', data);
        
        if (!data || (data.error && data.error.includes('not found'))) {
          console.log('Contract not found in comprehensive endpoint, trying basic');
          await fetchBasicContractData(contractId);
          return;
        }
        
        const normalizedData = normalizeContractData(data);
        if (normalizedData) {
          setContractData(normalizedData);
        } else {
          console.log('Normalized data is null, trying basic endpoint');
          await fetchBasicContractData(contractId);
        }
      } else if (response.status === 404) {
        console.log('Contract not found (404), trying basic endpoint');
        await fetchBasicContractData(contractId);
      } else {
        console.log('Comprehensive endpoint failed:', response.status);
        await fetchBasicContractData(contractId);
      }
    } catch (error) {
      console.error('Error fetching comprehensive data:', error);
      await fetchBasicContractData(contractId);
    } finally {
      setLoading(false);
    }
  };

  const normalizeContractData = (apiResponse) => {
    if (!apiResponse) {
      console.error('API response is null or undefined');
      return null;
    }
    
    console.log('Normalizing API response:', apiResponse);
    
    let contractId = apiResponse.contract_id || apiResponse.id;
    let basicData = apiResponse.basic_data || {};
    let compData = apiResponse.comprehensive_data || apiResponse;
    let filename = apiResponse.filename || 'Unknown';
    
    if (apiResponse.id && !apiResponse.contract_id && !apiResponse.basic_data) {
      contractId = apiResponse.id;
      filename = apiResponse.filename || 'Unknown';
      basicData = apiResponse;
      compData = apiResponse.comprehensive_data || {};
    }
    
    if (compData && typeof compData === 'object') {
      console.log('Extracting from comprehensive_data:', Object.keys(compData));
      
      const contractDetails = compData.contract_details || {};
      const parties = compData.parties || {};
      const financial = compData.financial_details || {};
      const deliverables = compData.deliverables || {};
      const terms = compData.terms_conditions || {};
      const compliance = compData.compliance || {};
      const summary = compData.summary || {};
      
      const programManagerReview = compData.program_manager_review || {};
      
      // Clean objectives text
      let cleanedObjectives = [];
      if (contractDetails.objectives && Array.isArray(contractDetails.objectives)) {
        cleanedObjectives = contractDetails.objectives
          .map(obj => {
            if (typeof obj !== 'string') return String(obj);
            let cleaned = obj
              .replace(/^["'`]+|["'`]+$/g, '')
              .replace(/Obective/gi, 'Objective')
              .replace(/Obejective/gi, 'Objective')
              .replace(/Objctive/gi, 'Objective')
              .replace(/Objetive/gi, 'Objective')
              .replace(/Objecitve/gi, 'Objective')
              .trim();
            
            if (cleaned.length > 0) {
              cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
            }
            
            return cleaned;
          })
          .filter(obj => obj && obj.trim().length > 2);
      }
      
      const normalized = {
        ...basicData,
        contract_id: contractId,
        filename: filename,
        grant_name: contractDetails.grant_name || basicData.grant_name || filename,
        contract_number: contractDetails.contract_number || basicData.contract_number,
        grantor: parties.grantor?.organization_name || basicData.grantor || 'Unknown Grantor',
        grantee: parties.grantee?.organization_name || basicData.grantee || 'Unknown Grantee',
        total_amount: financial?.total_grant_amount || basicData.total_amount || 0,
        start_date: contractDetails.start_date || basicData.start_date,
        end_date: contractDetails.end_date || basicData.end_date,
        purpose: contractDetails.purpose || basicData.purpose,
        status: basicData.status || programManagerReview.overall_recommendation || 'processed',
        investment_id: basicData.investment_id,
        project_id: basicData.project_id,
        grant_id: basicData.grant_id,
        comprehensive_data: {
          contract_details: {
            ...contractDetails,
            objectives: cleanedObjectives
          },
          parties: parties,
          financial_details: financial,
          deliverables: deliverables,
          terms_conditions: terms,
          compliance: compliance,
          summary: summary,
          program_manager_review: programManagerReview,
          extended_data: compData.extended_data || {}
        }
      };
      
      console.log('Normalized contract data:', normalized);
      return normalized;
    }
    
    const normalizedBasic = {
      ...basicData,
      contract_id: contractId,
      filename: filename,
      grant_name: basicData.grant_name || filename,
      grantor: basicData.grantor || 'Unknown Grantor',
      grantee: basicData.grantee || 'Unknown Grantee',
      total_amount: basicData.total_amount || 0,
      status: basicData.status || 'processed',
      comprehensive_data: {}
    };
    
    console.log('Returning basic normalized data:', normalizedBasic);
    return normalizedBasic;
  };

  const fetchBasicContractData = async (contractId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const basicUrl = `${API_CONFIG.BASE_URL}/api/contracts/${contractId}`;
      console.log('Trying basic endpoint:', basicUrl);
      
      const response = await fetch(basicUrl, { headers });
      
      if (response.ok) {
        const basicData = await response.json();
        console.log('Basic data fetched:', basicData);
        
        const normalizedData = normalizeContractData(basicData);
        setContractData(normalizedData);
      } else {
        console.log('Basic endpoint failed:', response.status);
        await fetchFromAllContracts(contractId);
      }
    } catch (error) {
      console.error('Fallback fetch failed:', error);
      await fetchFromAllContracts(contractId);
    }
  };

  const getContractStatus = (contract) => {
    if (!contract) return 'unknown';
    
    if (contract.status) {
      return contract.status;
    }
    
    if (contract.comprehensive_data?.program_manager_review?.overall_recommendation) {
      const recommendation = contract.comprehensive_data.program_manager_review.overall_recommendation;
      if (recommendation === 'approve') return 'reviewed';
      if (recommendation === 'reject') return 'rejected';
      if (recommendation === 'modify') return 'rejected';
    }
    
    return 'processed';
  };

  const fetchFromAllContracts = async (contractId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const allContractsUrl = `${API_CONFIG.BASE_URL}/api/contracts/`;
      console.log('Trying all contracts endpoint:', allContractsUrl);
      
      const response = await fetch(allContractsUrl, { headers });
      
      if (response.ok) {
        const allContracts = await response.json();
        console.log('All contracts fetched:', allContracts.length);
        
        const foundContract = allContracts.find(contract => {
          if (!contract) return false;
          const contractIdNum = parseInt(contractId);
          return contract.id === contractIdNum;
        });
        
        if (foundContract) {
          console.log('Contract found in all contracts list:', foundContract);
          const normalizedData = normalizeContractData(foundContract);
          if (normalizedData) {
            setContractData(normalizedData);
          } else {
            console.log('Failed to normalize contract data');
            setContractData(null);
          }
        } else {
          console.log('Contract not found in all contracts list');
          setContractData(null);
        }
      } else {
        console.log('All contracts endpoint failed:', response.status);
        setContractData(null);
      }
    } catch (error) {
      console.error('Error fetching from all contracts:', error);
      setContractData(null);
    }
  };

  const fetchReviewComments = async () => {
    if (!contractData?.contract_id) return;
    
    try {
      setPmCommentsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/contracts/${contractData.contract_id}/all-review-comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const pmComments = data.comments?.filter(comment => 
          comment.user_role === "project_manager"
        ) || [];
        setPmComments(pmComments);
      }
    } catch (error) {
      console.error('Failed to fetch review comments:', error);
    } finally {
      setPmCommentsLoading(false);
    }
  };

  const handleDeliverableUploadClick = (del, idx) => {
    if (user?.role === "project_manager") {
      // Create a deliverable object with all necessary properties
      const deliverableData = {
        ...del,
        index: idx,
        deliverableId: uploadedFiles[idx]?.deliverableId || idx + 1, // Use existing ID or create new one
        deliverable_name: del.deliverable_name || `Deliverable ${idx + 1}`
      };
      
      setSelectedDeliverable(deliverableData);
      setUploadDate('');
      setShowUploadModal(true);
    }
  };

const handleFileUpload = async () => {
  if (!selectedDeliverable || !uploadDate) {
    alert('Please select a date');
    return;
  }

  const fileInput = document.getElementById('file-input-real');
  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Please select a file');
    return;
  }

  const file = fileInput.files[0];
  const fileSizeMB = file.size / 1024 / 1024;
  
  if (fileSizeMB > 10) {
    alert("File size exceeds 10MB limit. Please choose a smaller file.");
    return;
  }

  setUploading(true);
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_date', uploadDate);
    formData.append('deliverable_name', selectedDeliverable.deliverable_name || `Deliverable ${selectedDeliverable.index + 1}`);
    
    if (selectedDeliverable.description) {
      formData.append('upload_notes', `Deliverable: ${selectedDeliverable.deliverable_name}. ${selectedDeliverable.description}`);
    } else {
      formData.append('upload_notes', `Uploaded for deliverable: ${selectedDeliverable.deliverable_name}`);
    }

    console.log('Uploading file to database/S3:', file.name);
    
    // Use the deliverable ID if available, otherwise use index
    const deliverableId = selectedDeliverable.deliverableId || (selectedDeliverable.index + 1);
    
    // Add contract_id as query parameter
    const url = `${API_CONFIG.BASE_URL}/api/deliverables/${deliverableId}/upload?contract_id=${contractData.contract_id}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      
      console.log('Upload successful:', result);
      
      // Update local state with database ID
      const newUpload = {
        deliverableId: result.id,
        deliverableName: result.deliverable_name || selectedDeliverable.deliverable_name,
        uploadDate: uploadDate,
        uploadTimestamp: result.uploaded_at || new Date().toISOString(),
        fileName: result.uploaded_file_name || file.name,
        status: result.status || 'submitted',
        fileId: result.id,
        hasFile: true,
        fileUrl: result.uploaded_file_url // S3 URL if available
      };
      
      const updatedUploads = {
        ...uploadedFiles,
        [selectedDeliverable.index]: newUpload
      };
      
      // Update state immediately
      setUploadedFiles(updatedUploads);
      
      // Save to localStorage
      localStorage.setItem(`contract_${contractData.contract_id}_deliverable_uploads`, JSON.stringify(updatedUploads));
      
      alert(`✅ File "${result.uploaded_file_name || file.name}" uploaded successfully to database!`);
      
      // Close modal and reset
      setShowUploadModal(false);
      setSelectedDeliverable(null);
      setUploadDate('');
      fileInput.value = '';
      
      // Hide selected file info
      const fileInfo = document.getElementById('selected-file-info');
      if (fileInfo) fileInfo.style.display = 'none';
      
      // Refresh deliverables data
      await loadUploadedFiles();
      
    } else {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      let errorMessage = 'Upload failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    alert(`❌ Failed to upload file: ${error.message}`);
  } finally {
    setUploading(false);
  }
};

  // Function to check if a deliverable has been uploaded
const hasDeliverableBeenUploaded = (index) => {
  return uploadedFiles[index] !== undefined;
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

  const formatCurrencyWithDecimals = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    try {
      const today = new Date();
      const end = new Date(endDate);
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return 0;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={14} className="text-yellow-600" />;
      case 'resolved':
        return <CheckCircle size={14} className="text-green-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const expandAllSections = () => {
    setExpandedSections({
      contractDetails: true,
      financial: true,
      parties: true,
      deliverables: true,
      terms: true,
      compliance: true,
      executiveSummary: true
    });
  };

  const collapseAllSections = () => {
    setExpandedSections({
      contractDetails: false,
      financial: false,
      parties: false,
      deliverables: false,
      terms: false,
      compliance: false,
      executiveSummary: false
    });
  };

  // NEW: Render field with proper paragraph handling
  const renderField = (label, value, icon = null, type = 'text', fullWidth = false) => {
    if (!value && value !== 0 && type !== 'currency' && value !== '') {
      return null;
    }
    
    let displayValue = value;
    if (type === 'date' && value) {
      displayValue = formatDate(value);
    } else if (type === 'currency' && (value || value === 0)) {
      displayValue = formatCurrencyWithDecimals(value);
    } else if (type === 'array' && Array.isArray(value)) {
      if (value.length === 0) return null;
      return (
        <div className={`field-card ${fullWidth ? 'full-width' : ''}`}>
          <div className="field-header">
            {icon && <span className="field-icon">{icon}</span>}
            <label className="field-label">{label}</label>
          </div>
          <div className="array-values">
            {value.map((item, idx) => (
              <div key={idx} className="array-item">
                <CheckCircle size={12} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div className={`field-card ${fullWidth ? 'full-width' : ''}`}>
        <div className="field-header">
          {icon && <span className="field-icon">{icon}</span>}
          <label className="field-label">{label}</label>
        </div>
        <div className="field-value-container">
          <span className={`field-value ${fullWidth ? 'paragraph-value' : ''}`}>
            {displayValue || 'Not specified'}
          </span>
        </div>
      </div>
    );
  };

  const getContractDisplayId = (contract) => {
    if (!contract) return 'Unknown';
    if (contract.investment_id) return `INV-${contract.investment_id}`;
    if (contract.project_id) return `PRJ-${contract.project_id}`;
    if (contract.grant_id) return `GRANT-${contract.grant_id}`;
    return `CONT-${contract.contract_id || contract.id || 'Unknown'}`;
  };

  if (loading) {
    return (
      <div className="contract-details-page">
        <div className="loading-state" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          width: '100%'
        }}>
          <RefreshCw className="spinner" style={{ 
            width: '32px', 
            height: '32px', 
            color: '#475569', 
            animation: 'spin 1s linear infinite',
            marginBottom: '12px'
          }} />
          <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="error-page">
        <div className="error-content">
          <AlertCircle className="error-icon" size={48} />
          <h2>Contract ID Missing</h2>
          <p>No contract ID was provided in the URL.</p>
          {/* <button className="btn-primary" onClick={() => navigate('/contracts')}>
            <ArrowLeft size={16} />
            Back to Contracts
          </button> */}
        </div>
      </div>
    );
  }

  const contractId = parseInt(id);
  if (isNaN(contractId) || contractId <= 0) {
    return (
      <div className="error-page">
        <div className="error-content">
          <AlertCircle className="error-icon" size={48} />
          <h2>Invalid Contract ID</h2>
          <p>The contract ID "{id}" is not valid.</p>
          {/* <button className="btn-primary" onClick={() => navigate('/contracts')}>
            <ArrowLeft size={16} />
            Back to Contracts
          </button> */}
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="error-page">
        <div className="error-content">
          <FileText className="error-icon" size={48} />
          <h2>Contract Not Found</h2>
          <p>The contract with ID {contractId} could not be found.</p>
          <div className="error-actions">
            {/* <button className="btn-primary" onClick={() => navigate('/contracts')}>
              <ArrowLeft size={16} />
              Back to Contracts
            </button> */}
            <button className="btn-secondary" onClick={() => fetchContractData(contractId)}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract comprehensive data
  const compData = contractData.comprehensive_data || {};
  const contractDetails = compData.contract_details || {};
  const parties = compData.parties || {};
  const financial = compData.financial_details || {};
  const deliverables = compData.deliverables || {};
  const terms = compData.terms_conditions || {};
  const compliance = compData.compliance || {};
  const summary = compData.summary || {};

  // Calculate metrics
  const totalAmount = contractData.total_amount || financial?.total_grant_amount || 0;
  const daysRemaining = getDaysRemaining(contractDetails.end_date || contractData.end_date);
  const installmentsCount = financial?.payment_schedule?.installments?.length || 0;
  const deliverablesCount = deliverables?.items?.length || 0;
  const duration = contractDetails.duration || 'N/A';
  
  // Determine risk level based on days remaining
  let riskLevel = 'Low';
  if (daysRemaining <= 30) riskLevel = 'Medium';
  if (daysRemaining <= 7) riskLevel = 'High';
  
  const metrics = {
    totalAmount: totalAmount,
    duration: duration,
    deliverablesCount: deliverablesCount,
    installmentsCount: installmentsCount,
    daysRemaining: daysRemaining,
    riskLevel: riskLevel
  };

  return (
    <div className="contract-details-page">
      {/* Header Section */}
      <div className="contract-header">
        <div className="header-top">
          {/* <button className="btn-back" onClick={() => navigate('/contracts')}>
            <ArrowLeft size={20} />
            <span>Back to Contracts</span>
          </button> */}
          
          <div className="header-actions-right">
            {/* <div className="quick-actions-mini">
              <button className="action-btn-mini" title="Export PDF">
                <Download size={14} />
              </button>
              <button className="action-btn-mini" title="Copy Details">
                <Copy size={14} />
              </button>
              <button className="action-btn-mini" title="Share">
                <Link size={14} />
              </button>
              <button className="action-btn-mini" title="Analytics">
                <BarChart3 size={14} />
              </button>
              <button className="action-btn-mini" title="Reminder">
                <Bell size={14} />
              </button>
            </div> */}
          </div>
        </div>

        <div className="contract-title-section">
          <div className="title-left">
            <h1>{contractData.grant_name || contractData.filename}</h1>
            <div className="contract-tags">
              {contractData.investment_id && (
                <span className="tag investment-tag">
                  <DollarSign size={12} />
                  INV: {contractData.investment_id}
                </span>
              )}
              {contractData.project_id && (
                <span className="tag project-tag">
                  <Layers size={12} />
                  PRJ: {contractData.project_id}
                </span>
              )}
              {contractData.grant_id && (
                <span className="tag grant-tag">
                  <Award size={12} />
                  GRANT: {contractData.grant_id}
                </span>
              )}
              <span className="tag status-tag active">
                <CheckCircle size={12} />
                Active
              </span>
            </div>
          </div>
          <div className="title-right">
            <div className="contract-value-summary">
              <div className="contract-value">
                <DollarSign className="value-icon" />
                <div className="value-content">
                  <span className="value-label">Total Value</span>
                  <span className="value-amount">
                    {formatCurrency(metrics.totalAmount)}
                  </span>
                </div>
              </div>
              <div className="contract-value">
                <Clock className="value-icon"/>
                <div className="value-content">
                  <span className="value-label">Duration</span>
                  <span className="value-amount">{metrics.duration}</span>
                </div>
              </div>
              <div className="contract-value">
                <Target className="value-icon"  />
                <div className="value-content">
                  <span className="value-label">Deliverables</span>
                  <span className="value-amount">{metrics.deliverablesCount}</span>
                </div>
              </div>
              <div className="contract-value">
                <FileText className="value-icon"  />
                <div className="value-content">
                  <span className="value-label">Installments</span>
                  <span className="value-amount">{metrics.installmentsCount}</span>
                </div>
              </div>
              <div className="contract-value">
                <Calendar className="value-icon"  />
                <div className="value-content">
                  <span className="value-label">Days Left</span>
                  <span className="value-amount">{metrics.daysRemaining}d</span>
                </div>
              </div>
            </div>
          </div>
        </div>  
      </div>

      {/* Single Tab: AI Analysis with Expandable Sections */}
      <div className="tab-content">
        {/* Comprehensive AI Analysis Section */}
        <div className="section-card">
          <div className="section-header">
            <h3>Comprehensive Analysis</h3>
            <div className="section-actions">
              <button className="btn-expand-all" onClick={expandAllSections}>
                Expand All
              </button>
              <button className="btn-collapse-all" onClick={collapseAllSections}>
                Collapse All
              </button>
            </div>
          </div>
          
          {/* Executive Summary - Full width */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('executiveSummary')}
            >
              <div className="expand-icon">
                {expandedSections.executiveSummary ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <BookOpen size={20} />
              <h4>Executive Summary</h4>
            </div>
            {expandedSections.executiveSummary && summary.executive_summary && (
              <div className="expandable-content">
                <div className="field-card full-width">
                  <div className="field-header">
                    <BookOpen size={16} />
                    <label className="field-label">Summary</label>
                  </div>
                  <div className="field-value-container">
                    <span className="field-value paragraph-value">
                      {summary.executive_summary}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contract Details - Each field in its own row */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('contractDetails')}
            >
              <div className="expand-icon">
                {expandedSections.contractDetails ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <FileText size={20} />
              <h4>Contract Details</h4>
            </div>
            {expandedSections.contractDetails && (
              <div className="expandable-content">
                <div className="fields-grid contract-details-grid">
                  {/* Single line fields */}
                  {renderField('Contract Name', contractData.grant_name, <FileText size={16} />)}
                  {renderField('Contract Number', contractData.contract_number, <FileText size={16} />)}
                  {renderField('Grant Reference', contractDetails.grant_reference, <Award size={16} />)}
                  {renderField('Agreement Type', contractDetails.agreement_type, <FileText size={16} />)}
                  {renderField('Effective Date', contractDetails.effective_date, <Calendar size={16} />, 'date')}
                  {renderField('Signature Date', contractDetails.signature_date, <Calendar size={16} />, 'date')}
                  {renderField('Start Date', contractDetails.start_date || contractData.start_date, <Calendar size={16} />, 'date')}
                  {renderField('End Date', contractDetails.end_date || contractData.end_date, <Calendar size={16} />, 'date')}
                  {renderField('Duration', contractDetails.duration, <Clock size={16} />)}
                  
                  {/* Full width paragraph fields */}
                  {renderField('Purpose', contractDetails.purpose || contractData.purpose, <Target size={16} />, 'text', true)}
                  {renderField('Geographic Scope', contractDetails.geographic_scope, <MapPin size={16} />, 'text', true)}
                  {renderField('Risk Management', contractDetails.risk_management, <AlertCircle size={16} />, 'text', true)}
                </div>
                
                {/* Objective - Show only the first objective */}
                {contractDetails.objectives && contractDetails.objectives.length > 0 && (
                  <div className="objectives-section">
                    <div className="field-card">
                      <div className="field-header">
                        <Target size={16} />
                        <label className="field-label">Objective</label>
                      </div>
                      <div className="field-value-container">
                        <span className="field-value">
                          {contractDetails.objectives[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Scope of Work - Full width */}
                {contractDetails.scope_of_work && (
                  <div className="scope-section">
                    <div className="field-card full-width">
                      <div className="field-header">
                        <FileText size={16} />
                        <label className="field-label">Scope of Work</label>
                      </div>
                      <div className="field-value-container">
                        <span className="field-value paragraph-value">
                          {contractDetails.scope_of_work}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Financial Details - Organized layout */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('financial')}
            >
              <div className="expand-icon">
                {expandedSections.financial ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <DollarSign size={20} />
              <h4>Financial Details</h4>
            </div>
            {expandedSections.financial && (
              <div className="expandable-content">
                <div className="fields-grid financial-details-grid">
                  {renderField('Total Grant Amount', totalAmount, <DollarSign size={16} />, 'currency')}
                  {renderField('Currency', financial.currency, <DollarSign size={16} />)}
                  
                  {/* Payment Terms on its own row */}
                  {renderField('Payment Terms', financial.payment_terms, <FileText size={16} />, 'text', true)}
                  
                  {/* Financial Reporting Requirements on its own row */}
                  {renderField('Financial Reporting Requirements', financial.financial_reporting_requirements, <FileBarChart size={16} />, 'text', true)}
                </div>

                {/* Payment Schedule */}
                {financial?.payment_schedule?.installments && financial.payment_schedule.installments.length > 0 && (
                  <div className="payment-schedule">
                    <h4>Payment Schedule</h4>
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Amount</th>
                            <th>Due Date</th>
                            <th>Condition</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financial.payment_schedule.installments.map((inst, idx) => (
                            <tr key={idx}>
                              <td>{inst.installment_number || idx + 1}</td>
                              <td className="amount-cell">{formatCurrency(inst.amount)}</td>
                              <td>{inst.due_date ? formatDate(inst.due_date) : 'Not specified'}</td>
                              <td>{inst.trigger_condition || 'Not specified'}</td>
                              <td>{inst.description || 'Not specified'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Budget Breakdown - Single column */}
                {financial?.budget_breakdown && Object.keys(financial.budget_breakdown).length > 0 && (
                  <div className="budget-breakdown">
                    <h4>Budget Breakdown</h4>
                    <div className="budget-items single-column">
                      {Object.entries(financial.budget_breakdown).map(([key, value]) => (
                        value !== null && value !== undefined && (
                          <div key={key} className="budget-item">
                            <div className="budget-label">
                              <DollarSign size={14} />
                              <span>{key.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div className="budget-amount">
                              {formatCurrency(value)}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Parties Information - Single column */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('parties')}
            >
              <div className="expand-icon">
                {expandedSections.parties ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <Users size={20} />
              <h4>Parties Information</h4>
            </div>
            {expandedSections.parties && (
              <div className="expandable-content">
                <div className="parties-grid single-column">
                  {/* Grantor */}
                  <div className="party-card">
                    <div className="party-header">
                      <Building className="party-icon" />
                      <div className="party-title">
                        <h4>Grantor</h4>
                        <span className="party-role">Funding Organization</span>
                      </div>
                    </div>
                    <div className="party-details single-column">
                      {renderField('Organization', parties.grantor?.organization_name, <Building size={14} />)}
                      {renderField('Address', parties.grantor?.address, <MapPin size={14} />)}
                      {renderField('Contact Person', parties.grantor?.contact_person, <User size={14} />)}
                      {renderField('Email', parties.grantor?.email, <Mail size={14} />)}
                      {renderField('Phone', parties.grantor?.phone, <Phone size={14} />)}
                      {renderField('Signatory', parties.grantor?.signatory_name, <FileText size={14} />)}
                      {renderField('Signatory Title', parties.grantor?.signatory_title, <User size={14} />)}
                      {renderField('Signature Date', parties.grantor?.signature_date, <Calendar size={14} />, 'date')}
                    </div>
                  </div>

                  {/* Grantee */}
                  <div className="party-card">
                    <div className="party-header">
                      <Building className="party-icon" />
                      <div className="party-title">
                        <h4>Grantee</h4>
                        <span className="party-role">Recipient Organization</span>
                      </div>
                    </div>
                    <div className="party-details single-column">
                      {renderField('Organization', parties.grantee?.organization_name, <Building size={14} />)}
                      {renderField('Address', parties.grantee?.address, <MapPin size={14} />)}
                      {renderField('Contact Person', parties.grantee?.contact_person, <User size={14} />)}
                      {renderField('Email', parties.grantee?.email, <Mail size={14} />)}
                      {renderField('Phone', parties.grantee?.phone, <Phone size={14} />)}
                      {renderField('Signatory', parties.grantee?.signatory_name, <FileText size={14} />)}
                      {renderField('Signatory Title', parties.grantee?.signatory_title, <User size={14} />)}
                      {renderField('Signature Date', parties.grantee?.signature_date, <Calendar size={14} />, 'date')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Deliverables */}
          <div className="expandable-section">
            <div 
              className="section-title expandable-header"
              onClick={() => toggleSection('deliverables')}
            >
              <div className="expand-icon">
                {expandedSections.deliverables ? <Minus size={18} /> : <Plus size={18} />}
              </div>
              <Target size={20} />
              <h4>Deliverables & Reporting</h4>
            </div>
            {expandedSections.deliverables && (
              <div className="expandable-content">
                {deliverables?.items && deliverables.items.length > 0 ? (
                  <>
                    <div className="data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Deliverable</th>
                            <th>Description</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            {user?.role === "project_manager" && <th>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                   {deliverables.items.map((del, idx) => {
  const hasUploaded = hasDeliverableBeenUploaded(idx);
  
  return (
    <tr key={idx}>
      <td className="deliverable-name">
        <Target size={14} />
        {del.deliverable_name || `Deliverable ${idx + 1}`}
        {hasUploaded && (
          <span className="uploaded-badge" title="File uploaded">
            ✓
          </span>
        )}
      </td>
      <td>{del.description || 'Not specified'}</td>
      <td>{del.due_date ? formatDate(del.due_date) : 'Not specified'}</td>
      <td>
        <span className={`status-badge ${hasUploaded ? 'submitted' : (del.status?.toLowerCase() || 'pending')}`}>
          {hasUploaded ? 'Submitted' : (del.status || 'Pending')}
        </span>
      </td>
      {/* ✅ SHOW VIEW BUTTON FOR ALL USERS WHEN FILE IS UPLOADED */}
      <td className="actions-cell">
        {hasUploaded ? (
          <button
            className="view-btn"
            onClick={() => handleViewDeliverableFile(idx)}
            title="View uploaded file"
          >
            <Eye size={12} />
            <span>View</span>
          </button>
        ) : (
          // Only show upload button for Project Manager
          user?.role === "project_manager" && (
            <button
              className="upload-btn"
              onClick={() => handleDeliverableUploadClick(del, idx)}
              title="Upload file for this deliverable"
            >
              <FileUp size={12} />
              <span>Upload</span>
            </button>
          )
        )}
      </td>
    </tr>
  );
})}
                        </tbody>
                      </table>
                    </div>

                    {deliverables?.reporting_requirements && (
                      <div className="reporting-requirements">
                        <div className="fields-grid single-column">
                          {renderField('Frequency', deliverables.reporting_requirements.frequency, <Calendar size={16} />)}
                          {renderField('Format Requirements', deliverables.reporting_requirements.format_requirements, <FileText size={16} />)}
                          {renderField('Submission Method', deliverables.reporting_requirements.submission_method, <Upload size={16} />)}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <Target size={48} />
                    <p>No deliverables specified in this contract</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

{/* Project Manager Actions Section - For ALL project manager contracts */}
{user && user.role === "project_manager" && contractData && (
 <ProjectManagerActions 
        contract={contractData}
        user={user}
        onActionComplete={() => {
          fetchContractData(contractId);
          fetchReviewComments();
        }}
      />
)}

        {/* Project Manager Comments Section */}
        {/* {user && user.role === "project_manager" && contractData && (
          <div className="section-card">
            <div className="section-header">
              <h3>Comments({pmComments.length})</h3>
            </div>
            
            <div className="comments-section">
              <div className="comments-list-container">
                {pmCommentsLoading ? (
                  <div className="loading-comments">
                    <Loader2 className="spinner" size={20} />
                    <span>Loading comments...</span>
                  </div>
                ) : pmComments.length === 0 ? (
                  <div className="empty-comments">
                    <FileText size={32} />
                    <p>No comments found. Add notes above for Program Managers to see.</p>
                  </div>
                ) : (
                  <div className="comments-list">
                    {pmComments.map((comment, index) => {
                      const isSubmission = comment.comment_type === "project_manager_submission";
                      const isResponse = comment.comment_type === "project_manager_response";
                      
                      return (
                        <div key={comment.id || index} className={`pm-comment-card ${comment.status}`}>
                          <div className="comment-header">
                            <div className="comment-meta">
                              <span className="comment-type">
                                {isSubmission ? 'Submission Note' : 
                                 isResponse ? 'Response to Reviewer' : 
                                 'Note for Reviewers'}
                              </span>
                              <span className="comment-date">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                          
                          </div>
                          
                          <div className="comment-body">
                            <p className="comment-text">{comment.comment}</p>
                            
                            {comment.flagged_risk && (
                              <div className="comment-tag risk">
                                <AlertCircle size={12} />
                                Flagged as Risk
                              </div>
                            )}
                            
                            {comment.flagged_issue && (
                              <div className="comment-tag issue">
                                <AlertCircle size={12} />
                                Flagged as Issue
                              </div>
                            )}
                            
                            {comment.recommendation && (
                              <div className={`comment-tag recommendation ${comment.recommendation}`}>
                                {comment.recommendation === 'approve' && <CheckCircle size={12} />}
                                {comment.recommendation === 'reject' && <XCircle size={12} />}
                                {comment.recommendation === 'modify' && <RefreshCw size={12} />}
                                <span>Recommendation: {comment.recommendation}</span>
                              </div>
                            )}
                            
                            {comment.resolution_response && (
                              <div className="resolution-note">
                                <strong>Your Response:</strong> {comment.resolution_response}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )} */}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Deliverable File</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="deliverable-info">
                {selectedDeliverable?.due_date && (
                  <p className="due-date-info">
                    <strong>Due Date:</strong> {formatDate(selectedDeliverable.due_date)}
                  </p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="upload-date">Upload Date *</label>
                <input
                  type="date"
                  id="upload-date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="date-picker"
                  required
                />
                <p className="help-text">Select the date when the deliverable was completed</p>
              </div>
              
              <div className="form-group">
                <label>Select File *</label>
                <div 
                  className="file-upload-area"
                  onClick={() => document.getElementById('file-input-real').click()}
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="file"
                    id="file-input-real"
                    className="file-input-hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                  />
                  <FileUp size={24} />
                  <p>Click to select file</p>
                  <p className="file-hint">or drag and drop here</p>
                  <p className="file-types">Supported: PDF, DOC, XLS, PPT, TXT, Images</p>
                  <p className="file-size">Max file size: 10MB</p>
                </div>
                <div id="selected-file-info" className="selected-file-info">
                  <strong>Selected:</strong> <span id="selected-file-name">No file selected</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedDeliverable(null);
                  setUploadDate('');
                  const fileInput = document.getElementById('file-input-real');
                  if (fileInput) fileInput.value = '';
                  const fileInfo = document.getElementById('selected-file-info');
                  if (fileInfo) fileInfo.style.display = 'none';
                }}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleFileUpload}
                disabled={!uploadDate || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    Uploading...
                  </>
                ) : (
                  'Upload File'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal - This should be at the root level */}
      {showPDFViewer && (
        <PDFViewer
          pdfUrl={pdfUrl}
          filename={pdfFilename}
          onClose={() => {
            setShowPDFViewer(false);
            // Revoke the object URL if it's a blob URL
            if (pdfUrl.startsWith('blob:')) {
              URL.revokeObjectURL(pdfUrl);
            }
          }}
        />
      )}
    </div>
  );
}

export default ContractDetailsPage;