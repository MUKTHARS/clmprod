import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  Edit,
  Upload,
  CheckCircle,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Eye,
  Download,
  Clock,
  User,
  Calendar,
  Building,
  DollarSign,
  Shield,
  FileCheck,
  Award,
  ClipboardCheck,
  ListChecks,
  AlertTriangle,
  XCircle,
  Plus,
  FilePlus,
  Send,
  Archive,
  RefreshCw
} from 'lucide-react';
import API_CONFIG from '../../config';
import './AgreementWorkflow.css';

function AgreementWorkflow({ contract, user, showWorkflow, setShowWorkflow, onWorkflowComplete }) {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState({
    project_managers: [],
    program_managers: [],
    directors: []
  });
  const [selectedUsers, setSelectedUsers] = useState({
    pm_users: [],
    pgm_users: [],
    director_users: []
  });
  const [formData, setFormData] = useState({
    grant_name: '',
    contract_number: '',
    grantor: '',
    grantee: '',
    total_amount: '',
    start_date: '',
    end_date: '',
    purpose: '',
    notes: '',
    agreement_type: '',
    effective_date: '',
    renewal_date: '',
    termination_date: '',
    jurisdiction: '',
    governing_law: '',
    special_conditions: ''
  });
  const [additionalDocuments, setAdditionalDocuments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Popup state
  const [popup, setPopup] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info', // success, error, warning, confirm
    onConfirm: null,
    onCancel: null
  });

  // Show popup helper
  const showPopup = (title, message, type = 'info', onConfirm = null, onCancel = null) => {
    setPopup({
      show: true,
      title,
      message,
      type,
      onConfirm,
      onCancel
    });
  };

  // Close popup
  const closePopup = () => {
    setPopup({
      show: false,
      title: '',
      message: '',
      type: 'info',
      onConfirm: null,
      onCancel: null
    });
  };

// Initialize form data from contract
useEffect(() => {
  if (contract && showWorkflow) {
    console.log('Initializing workflow with contract data:', contract);
    
    setFormData({
      grant_name: contract.grant_name || '',
      contract_number: contract.contract_number || '',
      grantor: contract.grantor || '',
      grantee: contract.grantee || '',
      total_amount: contract.total_amount || '',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      purpose: contract.purpose || '',
      notes: contract.notes || '',
      agreement_type: contract.agreement_type || '',
      effective_date: contract.effective_date || '',
      renewal_date: contract.renewal_date || '',
      termination_date: contract.termination_date || '',
      jurisdiction: contract.jurisdiction || '',
      governing_law: contract.governing_law || '',
      special_conditions: contract.special_conditions || ''
    });

    // Initialize selected users from contract
    // Make sure to handle both arrays and parse from JSON if needed
    const pmUsers = contract.assigned_pm_users || 
                   (contract.comprehensive_data?.assigned_users?.pm_users) || 
                   [];
    const pgmUsers = contract.assigned_pgm_users || 
                    (contract.comprehensive_data?.assigned_users?.pgm_users) || 
                    [];
    const directorUsers = contract.assigned_director_users || 
                         (contract.comprehensive_data?.assigned_users?.director_users) || 
                         [];

    console.log('Setting selected users:', { pmUsers, pgmUsers, directorUsers });
    
    setSelectedUsers({
      pm_users: Array.isArray(pmUsers) ? pmUsers : [],
      pgm_users: Array.isArray(pgmUsers) ? pgmUsers : [],
      director_users: Array.isArray(directorUsers) ? directorUsers : []
    });

    // Load additional documents from multiple possible sources
    const docs = contract.additional_documents || 
                (contract.comprehensive_data?.additional_documents) || 
                [];
    console.log('Loading additional documents:', docs);
    setAdditionalDocuments(docs);

    // Fetch available users
    fetchAvailableUsers();
  }
}, [contract, showWorkflow]);

  const fetchAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch project managers
      const pmResponse = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/users/available?role=project_manager`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch program managers
      const pgmResponse = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/users/available?role=program_manager`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch directors
      const directorResponse = await fetch(`${API_CONFIG.BASE_URL}/api/agreements/users/available?role=director`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (pmResponse.ok && pgmResponse.ok && directorResponse.ok) {
        const pmUsers = await pmResponse.json();
        const pgmUsers = await pgmResponse.json();
        const directorUsers = await directorResponse.json();
        
        setAvailableUsers({
          project_managers: pmUsers,
          program_managers: pgmUsers,
          directors: directorUsers
        });
      }
    } catch (error) {
      console.error('Failed to fetch available users:', error);
      showPopup('Error', 'Failed to fetch available users. Please refresh and try again.', 'error');
    }
  };

  const handleUserSelection = (role, userId) => {
    const key = role === 'project_manager' ? 'pm_users' : 
                role === 'program_manager' ? 'pgm_users' : 'director_users';
    
    setSelectedUsers(prev => {
      const currentUsers = prev[key] || [];
      if (currentUsers.includes(userId)) {
        return {
          ...prev,
          [key]: currentUsers.filter(id => id !== userId)
        };
      } else {
        return {
          ...prev,
          [key]: [...currentUsers, userId]
        };
      }
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (file) => {
    if (!file || !contract?.id) return;
    
    setUploadingFile(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const description = file.name || '';
      formData.append('description', description);
      
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/agreements/drafts/${contract.id}/add-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAdditionalDocuments(prev => [...prev, result.document]);
        showPopup('Success', 'Document uploaded successfully!', 'success');
      } else {
        const error = await response.json();
        showPopup('Upload Failed', `Failed to add document: ${error.detail}`, 'error');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showPopup('Upload Failed', 'Failed to upload document. Please try again.', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

const handleUpdateDraft = async () => {
  if (!contract?.id) return;
  
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    
    // Prepare update data - ONLY include fields that are defined in the schema
    const updateData = {};
    
    // Only include fields that have values (not empty strings)
    if (formData.grant_name !== undefined && formData.grant_name !== '') {
      updateData.grant_name = formData.grant_name;
    }
    if (formData.contract_number !== undefined) {
      updateData.contract_number = formData.contract_number;
    }
    if (formData.grantor !== undefined) {
      updateData.grantor = formData.grantor;
    }
    if (formData.grantee !== undefined) {
      updateData.grantee = formData.grantee;
    }
    if (formData.total_amount !== undefined && formData.total_amount !== '') {
      updateData.total_amount = parseFloat(formData.total_amount);
    }
    if (formData.start_date !== undefined) {
      updateData.start_date = formData.start_date;
    }
    if (formData.end_date !== undefined) {
      updateData.end_date = formData.end_date;
    }
    if (formData.purpose !== undefined) {
      updateData.purpose = formData.purpose;
    }
    if (formData.notes !== undefined) {
      updateData.notes = formData.notes;
    }
    
    // Include agreement metadata if any field has a value
    const agreementMetadata = {};
    let hasAgreementMetadata = false;
    
    if (formData.agreement_type !== undefined && formData.agreement_type !== '') {
      agreementMetadata.agreement_type = formData.agreement_type;
      hasAgreementMetadata = true;
    }
    if (formData.effective_date !== undefined && formData.effective_date !== '') {
      agreementMetadata.effective_date = formData.effective_date;
      hasAgreementMetadata = true;
    }
    if (formData.renewal_date !== undefined && formData.renewal_date !== '') {
      agreementMetadata.renewal_date = formData.renewal_date;
      hasAgreementMetadata = true;
    }
    if (formData.termination_date !== undefined && formData.termination_date !== '') {
      agreementMetadata.termination_date = formData.termination_date;
      hasAgreementMetadata = true;
    }
    if (formData.jurisdiction !== undefined && formData.jurisdiction !== '') {
      agreementMetadata.jurisdiction = formData.jurisdiction;
      hasAgreementMetadata = true;
    }
    if (formData.governing_law !== undefined && formData.governing_law !== '') {
      agreementMetadata.governing_law = formData.governing_law;
      hasAgreementMetadata = true;
    }
    if (formData.special_conditions !== undefined && formData.special_conditions !== '') {
      agreementMetadata.special_conditions = formData.special_conditions;
      hasAgreementMetadata = true;
    }
    
    if (hasAgreementMetadata) {
      updateData.agreement_metadata = agreementMetadata;
    }
    
    // Include assigned users only if arrays exist and have length
    const assignedUsers = {};
    let hasAssignedUsers = false;
    
    if (selectedUsers.pm_users && selectedUsers.pm_users.length > 0) {
      assignedUsers.pm_users = selectedUsers.pm_users;
      hasAssignedUsers = true;
    }
    if (selectedUsers.pgm_users && selectedUsers.pgm_users.length > 0) {
      assignedUsers.pgm_users = selectedUsers.pgm_users;
      hasAssignedUsers = true;
    }
    if (selectedUsers.director_users && selectedUsers.director_users.length > 0) {
      assignedUsers.director_users = selectedUsers.director_users;
      hasAssignedUsers = true;
    }
    
    if (hasAssignedUsers) {
      updateData.assigned_users = assignedUsers;
    }
    
    console.log('Sending update data:', updateData);
    
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/agreements/drafts/${contract.id}/update`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      }
    );

    if (response.ok) {
      const result = await response.json();
      showPopup('Success', 'Draft updated successfully!', 'success');
      
      // IMPORTANT: After saving, fetch the updated contract to refresh the data
      await fetchUpdatedContract(contract.id);
      
      // Call onWorkflowComplete to refresh data in parent
      if (onWorkflowComplete && typeof onWorkflowComplete === 'function') {
        onWorkflowComplete();
      }
    } else {
      const error = await response.json();
      console.error('Update failed with details:', error.detail);
      showPopup('Update Failed', `Failed to update draft: ${JSON.stringify(error.detail)}`, 'error');
    }
  } catch (error) {
    console.error('Error updating draft:', error);
    showPopup('Update Failed', `Failed to update draft: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
};

// Add this helper function to fetch updated contract
const fetchUpdatedContract = async (contractId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/agreements/drafts/${contractId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('Updated contract data fetched:', data);
      
      // Update the contract prop by calling parent callback if available
      if (onWorkflowComplete && typeof onWorkflowComplete === 'function') {
        onWorkflowComplete();
      }
    }
  } catch (error) {
    console.error('Error fetching updated contract:', error);
  }
};

const handlePublishAgreement = async (publishToReview = true) => {
  if (!contract?.id) return;
  
  // Show confirmation popup
  const confirmMessage = publishToReview 
    ? "Are you sure you want to publish and submit for review?"
    : "Are you sure you want to publish this agreement directly WITHOUT REVIEW? This will automatically publish the agreement.";
  
  showPopup(
    'Confirm Publication',
    confirmMessage,
    'confirm',
    async () => {
      // This is the confirm callback
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Use the original endpoint for review publishing
        // Use the new endpoint for direct publishing
        const endpoint = publishToReview 
          ? `${API_CONFIG.BASE_URL}/api/agreements/drafts/${contract.id}/publish`
          : `${API_CONFIG.BASE_URL}/api/agreements/drafts/${contract.id}/publish-directly`;
        
        const publishData = {
          notes: formData.notes || '',
          publish_to_review: publishToReview,
          publish_directly: !publishToReview
        };

        console.log(`Publishing ${publishToReview ? 'with review' : 'directly'} to:`, endpoint);

        const response = await fetch(
          endpoint,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(publishData)
          }
        );

        if (response.ok) {
          const result = await response.json();
          showPopup('Success', result.message || 'Agreement published successfully!', 'success');
          
          // Close the modal when publishing is done
          if (setShowWorkflow) {
            setTimeout(() => {
              setShowWorkflow(false);
            }, 1500);
          }
          
          // Call onWorkflowComplete ONLY if it exists
          if (onWorkflowComplete && typeof onWorkflowComplete === 'function') {
            onWorkflowComplete();
          }
        } else {
          const error = await response.json();
          showPopup('Publish Failed', `Failed to publish agreement: ${error.detail}`, 'error');
        }
      } catch (error) {
        console.error('Error publishing agreement:', error);
        showPopup('Publish Failed', 'Failed to publish agreement. Please try again.', 'error');
      } finally {
        setLoading(false);
        closePopup();
      }
    },
    () => {
      // This is the cancel callback
      closePopup();
    }
  );
};

  const nextStep = () => {
    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  // If showWorkflow is false, don't render anything
  if (!showWorkflow) {
    return null;
  }

  return (
    <div className="ag-workflow-content-wrapper">
      {/* Workflow Steps */}
      <div className="ag-workflow-steps">
        <div className={`ag-workflow-step ${activeStep >= 1 ? 'ag-active' : ''}`}>
          <div className="ag-step-number">1</div>
          <div className="ag-step-label">Assign Users</div>
        </div>
        <div className={`ag-workflow-step ${activeStep >= 2 ? 'ag-active' : ''}`}>
          <div className="ag-step-number">2</div>
          <div className="ag-step-label">Edit Metadata</div>
        </div>
        <div className={`ag-workflow-step ${activeStep >= 3 ? 'ag-active' : ''}`}>
          <div className="ag-step-number">3</div>
          <div className="ag-step-label">Add Documents</div>
        </div>
        <div className={`ag-workflow-step ${activeStep >= 4 ? 'ag-active' : ''}`}>
          <div className="ag-step-number">4</div>
          <div className="ag-step-label">Publish</div>
        </div>
      </div>

      <div className="ag-workflow-content">
        {/* Step 1: Assign Users */}
        {activeStep === 1 && (
          <div className="ag-workflow-step-content">
            <h4>Assign Users to Agreement</h4>
            
            <div className="ag-user-assignment">
              {/* Project Managers */}
              <div className="ag-user-category">
                <h5>
                  <User size={16} />
                  Project Managers
                </h5>
                <div className="ag-user-list">
                  {availableUsers.project_managers.map(user => (
                    <div key={user.id} className="ag-user-checkbox">
                      <input
                        type="checkbox"
                        id={`ag-pm-${user.id}`}
                        checked={selectedUsers.pm_users.includes(user.id)}
                        onChange={() => handleUserSelection('project_manager', user.id)}
                      />
                      <label htmlFor={`ag-pm-${user.id}`}>
                        {user.full_name} ({user.email})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Program Managers */}
              <div className="ag-user-category">
                <h5>
                  <Shield size={16} />
                  Program Managers
                </h5>
                <div className="ag-user-list">
                  {availableUsers.program_managers.map(user => (
                    <div key={user.id} className="ag-user-checkbox">
                      <input
                        type="checkbox"
                        id={`ag-pgm-${user.id}`}
                        checked={selectedUsers.pgm_users.includes(user.id)}
                        onChange={() => handleUserSelection('program_manager', user.id)}
                      />
                      <label htmlFor={`ag-pgm-${user.id}`}>
                        {user.full_name} ({user.email})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Directors */}
              <div className="ag-user-category">
                <h5>
                  <Award size={16} />
                  Directors
                </h5>
                <div className="ag-user-list">
                  {availableUsers.directors.map(user => (
                    <div key={user.id} className="ag-user-checkbox">
                      <input
                        type="checkbox"
                        id={`ag-dir-${user.id}`}
                        checked={selectedUsers.director_users.includes(user.id)}
                        onChange={() => handleUserSelection('director', user.id)}
                      />
                      <label htmlFor={`ag-dir-${user.id}`}>
                        {user.full_name} ({user.email})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Edit Metadata */}
        {activeStep === 2 && (
          <div className="ag-workflow-step-content">
            <h4>Edit Agreement Metadata</h4>
            
            <div className="ag-metadata-form">
              <div className="ag-form-row">
                <div className="ag-form-group">
                  <label htmlFor="ag-grant_name">Grant Name *</label>
                  <input
                    type="text"
                    id="ag-grant_name"
                    name="grant_name"
                    value={formData.grant_name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="ag-form-group">
                  <label htmlFor="ag-contract_number">Contract Number</label>
                  <input
                    type="text"
                    id="ag-contract_number"
                    name="contract_number"
                    value={formData.contract_number}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="ag-form-row">
                <div className="ag-form-group">
                  <label htmlFor="ag-grantor">Grantor</label>
                  <input
                    type="text"
                    id="ag-grantor"
                    name="grantor"
                    value={formData.grantor}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="ag-form-group">
                  <label htmlFor="ag-grantee">Grantee</label>
                  <input
                    type="text"
                    id="ag-grantee"
                    name="grantee"
                    value={formData.grantee}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="ag-form-row">
                <div className="ag-form-group">
                  <label htmlFor="ag-total_amount">Total Amount ($)</label>
                  <input
                    type="number"
                    id="ag-total_amount"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleFormChange}
                    step="0.01"
                  />
                </div>
                <div className="ag-form-group">
                  <label htmlFor="ag-agreement_type">Agreement Type</label>
                  <select
                    id="ag-agreement_type"
                    name="agreement_type"
                    value={formData.agreement_type}
                    onChange={handleFormChange}
                  >
                    <option value="">Select Type</option>
                    <option value="grant">Grant Agreement</option>
                    <option value="contract">Contract</option>
                    <option value="mou">Memorandum of Understanding</option>
                    <option value="subgrant">Subgrant Agreement</option>
                    <option value="cooperative">Cooperative Agreement</option>
                  </select>
                </div>
              </div>

              <div className="ag-form-row">
                <div className="ag-form-group">
                  <label htmlFor="ag-start_date">Start Date</label>
                  <input
                    type="date"
                    id="ag-start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="ag-form-group">
                  <label htmlFor="ag-end_date">End Date</label>
                  <input
                    type="date"
                    id="ag-end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="ag-form-group">
                <label htmlFor="ag-purpose">Purpose</label>
                <textarea
                  id="ag-purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleFormChange}
                  rows="3"
                />
              </div>

              <div className="ag-form-group">
                <label htmlFor="ag-notes">Notes</label>
                <textarea
                  id="ag-notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="2"
                  placeholder="Add any notes about this agreement..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Add Documents */}
        {activeStep === 3 && (
          <div className="ag-workflow-step-content">
            <h4>Additional Documents</h4>
            
            <div className="ag-documents-list">
              {additionalDocuments.map((doc, index) => (
                <div key={index} className="ag-document-item">
                  <FileText size={20} />
                  <div className="ag-document-info">
                    <span className="ag-document-name">{doc.original_filename}</span>
                    <span className="ag-document-size">
                      {(doc.size / 1024).toFixed(2)} KB • {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {additionalDocuments.length === 0 && (
                <p className="ag-no-documents">No additional documents added yet.</p>
              )}
            </div>

            <div className="ag-document-upload">
              <input
                type="file"
                id="ag-additional-doc"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                disabled={uploadingFile}
              />
              <div 
                className="ag-upload-area"
                onClick={() => document.getElementById('ag-additional-doc').click()}
              >
                <Upload size={24} />
                <span>Click to upload additional document</span>
                {uploadingFile && <Loader2 size={16} className="ag-spinner" />}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Publish */}
        {activeStep === 4 && (
          <div className="ag-workflow-step-content">
            <h4>Publish Agreement</h4>
            
            <div className="ag-publish-summary">
              <h5>Agreement Summary</h5>
              <div className="ag-summary-item">
                <span>Grant Name:</span>
                <strong>{formData.grant_name || 'Not specified'}</strong>
              </div>
              <div className="ag-summary-item">
                <span>Contract Number:</span>
                <span>{formData.contract_number || 'Not specified'}</span>
              </div>
              <div className="ag-summary-item">
                <span>Agreement Type:</span>
                <span>{formData.agreement_type || 'Not specified'}</span>
              </div>
              <div className="ag-summary-item">
                <span>Total Amount:</span>
                <strong>${parseFloat(formData.total_amount || 0).toLocaleString()}</strong>
              </div>
              <div className="ag-summary-item">
                <span>Assigned PM Users:</span>
                <span>{selectedUsers.pm_users.length} user(s)</span>
              </div>
              <div className="ag-summary-item">
                <span>Assigned PGM Users:</span>
                <span>{selectedUsers.pgm_users.length} user(s)</span>
              </div>
              <div className="ag-summary-item">
                <span>Assigned Directors:</span>
                <span>{selectedUsers.director_users.length} user(s)</span>
              </div>
              <div className="ag-summary-item">
                <span>Additional Documents:</span>
                <span>{additionalDocuments.length} document(s)</span>
              </div>
            </div>

            <div className="ag-form-group">
              <label htmlFor="ag-publish-notes">Publish Notes (Optional)</label>
              <textarea
                id="ag-publish-notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows="3"
                placeholder="Add any notes about this publication..."
              />
            </div>
          </div>
        )}
      </div>

      {/* FIXED BUTTON CONTAINER - Properly positioned at bottom */}
      <div className="ag-workflow-footer">
        <div className="ag-workflow-buttons">
          {activeStep > 1 && (
            <button 
              className="ag-btn ag-btn-secondary" 
              onClick={prevStep} 
              disabled={loading}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
          )}
          
          {activeStep < 4 ? (
            <button 
              className="ag-btn ag-btn-primary ag-btn-next" 
              onClick={nextStep} 
              disabled={loading}
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <>
              <button 
                className="ag-btn ag-btn-secondary" 
                onClick={handleUpdateDraft}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="ag-spinner" /> : 'Save Draft'}
              </button>
              
              <button 
                className="ag-btn ag-btn-primary" 
                onClick={() => handlePublishAgreement(false)}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="ag-spinner" /> : 'Publish'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Custom Popup Component */}
      {popup.show && (
        <div className="ag-popup-overlay">
          <div className={`ag-popup ag-popup-${popup.type}`}>
            <div className="ag-popup-header">
              {popup.type === 'success' && <CheckCircle size={24} className="ag-popup-icon-success" />}
              {popup.type === 'error' && <XCircle size={24} className="ag-popup-icon-error" />}
              {popup.type === 'warning' && <AlertTriangle size={24} className="ag-popup-icon-warning" />}
              {popup.type === 'confirm' && <AlertTriangle size={24} className="ag-popup-icon-confirm" />}
              {popup.type === 'info' && <AlertTriangle size={24} className="ag-popup-icon-info" />}
              <h3>{popup.title}</h3>
              <button className="ag-popup-close" onClick={closePopup}>
                <X size={18} />
              </button>
            </div>
            <div className="ag-popup-content">
              <p>{popup.message}</p>
            </div>
            <div className="ag-popup-actions">
              {popup.type === 'confirm' ? (
                <>
                  <button 
                    className="ag-popup-btn ag-popup-btn-cancel"
                    onClick={popup.onCancel || closePopup}
                  >
                    Cancel
                  </button>
                  <button 
                    className="ag-popup-btn ag-popup-btn-confirm"
                    onClick={popup.onConfirm}
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button 
                  className="ag-popup-btn ag-popup-btn-ok"
                  onClick={closePopup}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgreementWorkflow;