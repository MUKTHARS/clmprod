import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Cloud,
  FolderOpen,
  FileText,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Trash2,
  Plus,
  LogIn,
  FolderTree
} from 'lucide-react';
import API_CONFIG from '../config';
import './sharepoint.css';

function SharePointIntegration({ user }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [browsing, setBrowsing] = useState(false);
  const [browsePath, setBrowsePath] = useState('/');
  const [browseItems, setBrowseItems] = useState({ folders: [], files: [] });
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchConnections();
    
    // Check URL params for connection success
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setSuccess('Connected to SharePoint successfully!');
      // Clean URL
      window.history.replaceState({}, '', '/app/sharepoint');
      fetchConnections();
    }
    if (params.get('error')) {
      setError(`Connection failed: ${params.get('error')}`);
      window.history.replaceState({}, '', '/app/sharepoint');
    }
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/sharepoint/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(response.data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('Failed to load SharePoint connections');
    } finally {
      setLoading(false);
    }
  };

  const connectToSharePoint = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/sharepoint/auth/url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Redirect to Microsoft login
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      setError('Failed to initiate SharePoint connection');
      setLoading(false);
    }
  };

  const browseSharePoint = async (connection, path = '/') => {
    try {
      setLoading(true);
      setSelectedConnection(connection);
      setBrowsing(true);
      setBrowsePath(path);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/sharepoint/browse`,
        { 
          connection_id: connection.id,
          folder_path: path 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBrowseItems({
        folders: response.data.folders,
        files: response.data.files
      });
    } catch (error) {
      console.error('Error browsing SharePoint:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please reconnect to SharePoint.');
      } else {
        setError('Failed to browse SharePoint');
      }
    } finally {
      setLoading(false);
    }
  };

  const importFile = async (file) => {
    try {
      setImporting(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/sharepoint/import`,
        {
          connection_id: selectedConnection.id,
          file_id: file.id,
          file_name: file.name,
          download_url: file.download_url
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setSuccess(`Successfully imported: ${file.name}`);
        // Refresh the current folder
        setTimeout(() => browseSharePoint(selectedConnection, browsePath), 1000);
      } else {
        setError(`Failed to import: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error importing file:', error);
      setError('Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  const deleteConnection = async (connectionId) => {
    if (!window.confirm('Remove SharePoint connection? You can reconnect anytime.')) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_CONFIG.BASE_URL}/api/sharepoint/connections/${connectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setConnections(connections.filter(c => c.id !== connectionId));
      if (selectedConnection?.id === connectionId) {
        setSelectedConnection(null);
        setBrowsing(false);
      }
      setSuccess('Connection removed');
    } catch (error) {
      console.error('Error deleting connection:', error);
      setError('Failed to remove connection');
    } finally {
      setLoading(false);
    }
  };

  const viewContract = (contractId) => {
    navigate(`/app/contracts/${contractId}`);
  };

  const goBack = () => {
    setSelectedConnection(null);
    setBrowsing(false);
    setBrowsePath('/');
    setError(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="sharepoint-integration">
      {/* Header */}
      <div className="sharepoint-header">
        <h1>
          <Cloud size={24} />
          {browsing ? selectedConnection?.site_name || 'SharePoint' : 'SharePoint Import'}
        </h1>
        <div className="header-actions">
          {browsing ? (
            <button className="btn-secondary" onClick={goBack}>
              <FolderTree size={16} />
              Back to Connections
            </button>
          ) : (
            <button 
              className="btn-primary"
              onClick={connectToSharePoint}
              disabled={loading}
            >
              <LogIn size={16} />
              Connect to SharePoint
            </button>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="message error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {success && (
        <div className="message success">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button className="close-btn" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Loading State */}
      {loading && !browsing && (
        <div className="loading-state">
          <RefreshCw size={32} className="spinning" />
          <p>Loading...</p>
        </div>
      )}

      {/* Browse View */}
      {browsing && selectedConnection && (
        <div className="browse-view">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span className="breadcrumb-item" onClick={() => browseSharePoint(selectedConnection, '/')}>
              Root
            </span>
            {browsePath.split('/').filter(Boolean).map((part, index, array) => {
              const path = '/' + array.slice(0, index + 1).join('/');
              return (
                <React.Fragment key={index}>
                  <ChevronRight size={14} />
                  <span 
                    className="breadcrumb-item"
                    onClick={() => browseSharePoint(selectedConnection, path)}
                  >
                    {part}
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="browse-loading">
              <RefreshCw size={32} className="spinning" />
              <p>Loading folder...</p>
            </div>
          ) : (
            <div className="browse-content">
              {/* Folders */}
              {browseItems.folders.length > 0 && (
                <div className="folders-section">
                  <h4>Folders</h4>
                  <div className="folder-grid">
                    {browseItems.folders.map(folder => (
                      <div 
                        key={folder.id}
                        className="folder-item"
                        onClick={() => browseSharePoint(selectedConnection, folder.path)}
                      >
                        <FolderOpen size={32} />
                        <span className="folder-name">{folder.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Files */}
              {browseItems.files.length > 0 ? (
                <div className="files-section">
                  <h4>PDF Documents</h4>
                  <div className="files-list">
                    {browseItems.files.map(file => (
                      <div key={file.id} className="file-item">
                        <div className="file-info">
                          <FileText size={20} />
                          <div className="file-details">
                            <div className="file-name">{file.name}</div>
                            <div className="file-meta">
                              {formatFileSize(file.size)}
                              {file.modified_at && (
                                <> • Updated: {new Date(file.modified_at).toLocaleDateString()}</>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="file-status">
                          {file.import_status === 'imported' ? (
                            <span className="status-badge imported">
                              <CheckCircle size={12} />
                              Imported
                            </span>
                          ) : (
                            <span className="status-badge available">Ready to import</span>
                          )}
                        </div>
                        
                        <div className="file-actions">
                          {file.import_status === 'imported' && file.contract_id ? (
                            <button 
                              className="action-btn"
                              onClick={() => viewContract(file.contract_id)}
                            >
                              <Eye size={16} />
                              View
                            </button>
                          ) : (
                            <button 
                              className="action-btn import"
                              onClick={() => importFile(file)}
                              disabled={importing}
                            >
                              <Cloud size={16} />
                              {importing ? 'Importing...' : 'Import'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                !loading && (
                  <div className="empty-folder">
                    <FolderOpen size={48} />
                    <h3>No PDF files found</h3>
                    <p>This folder doesn't contain any PDF documents</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Connections View */}
      {!browsing && !loading && (
        <div className="connections-view">
          {connections.length === 0 ? (
            <div className="empty-state">
              <Cloud size={48} />
              <h3>No SharePoint Connections</h3>
              <p>Connect to your SharePoint to import grant documents directly.</p>
              <button 
                className="btn-primary"
                onClick={connectToSharePoint}
              >
                <LogIn size={16} />
                Connect Now
              </button>
            </div>
          ) : (
            <div className="connections-list">
              {connections.map(conn => (
                <div key={conn.id} className="connection-card">
                  <div className="connection-icon">
                    <Cloud size={24} />
                  </div>
                  <div className="connection-details">
                    <h3>{conn.site_name || 'SharePoint Site'}</h3>
                    <p className="site-url">{conn.site_url}</p>
                    <p className="user-info">
                      Connected as: {conn.microsoft_name || conn.microsoft_email || 'User'}
                    </p>
                    <p className="last-connected">
                      Last connected: {conn.last_connected_at ? 
                        new Date(conn.last_connected_at).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                  <div className="connection-actions">
                    <button 
                      className="action-btn browse"
                      onClick={() => browseSharePoint(conn)}
                    >
                      <FolderOpen size={16} />
                      Browse Files
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => deleteConnection(conn.id)}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SharePointIntegration;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import {
//   Cloud,
//   Link2,
//   FolderOpen,
//   FileText,
//   ChevronRight,
//   RefreshCw,
//   CheckCircle,
//   AlertCircle,
//   XCircle,
//   Download,
//   Upload,
//   Settings,
//   Eye,
//   Trash2,
//   Plus
// } from 'lucide-react';
// import API_CONFIG from '../config';
// import './sharepoint.css';

// function SharePointIntegration({ user }) {
//   const [connections, setConnections] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showAddConnection, setShowAddConnection] = useState(false);
//   const [selectedConnection, setSelectedConnection] = useState(null);
//   const [browsing, setBrowsing] = useState(false);
//   const [browsePath, setBrowsePath] = useState('/');
//   const [browseItems, setBrowseItems] = useState({ folders: [], files: [] });
//   const [syncLogs, setSyncLogs] = useState([]);
//   const [connectionForm, setConnectionForm] = useState({
//     site_url: '',
//     document_library: '',
//     client_id: '',
//     client_secret: '',
//     tenant_name: '',
//     connection_name: '',
//     description: '',
//     sync_enabled: true,
//     sync_interval_minutes: 60,
//     auto_upload: false,
//     folder_path: '/'
//   });
//   const [testing, setTesting] = useState(false);
//   const [testResult, setTestResult] = useState(null);
//   const [syncing, setSyncing] = useState(false);
//   const [activeTab, setActiveTab] = useState('connections'); // connections, files, logs
  
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchConnections();
//   }, []);

//   const fetchConnections = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await axios.get(`${API_CONFIG.BASE_URL}/api/sharepoint/connections`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setConnections(response.data);
//     } catch (error) {
//       console.error('Error fetching connections:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const testConnection = async () => {
//     try {
//       setTesting(true);
//       setTestResult(null);
//       const token = localStorage.getItem('token');
//       const response = await axios.post(
//         `${API_CONFIG.BASE_URL}/api/sharepoint/connections/test`,
//         connectionForm,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setTestResult(response.data);
//     } catch (error) {
//       setTestResult({
//         success: false,
//         message: error.response?.data?.detail || 'Connection test failed'
//       });
//     } finally {
//       setTesting(false);
//     }
//   };

//   const saveConnection = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await axios.post(
//         `${API_CONFIG.BASE_URL}/api/sharepoint/connections`,
//         connectionForm,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       setConnections([response.data, ...connections]);
//       setShowAddConnection(false);
//       resetForm();
//     } catch (error) {
//       console.error('Error saving connection:', error);
//       alert('Failed to save connection: ' + (error.response?.data?.detail || error.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteConnection = async (connectionId) => {
//     if (!window.confirm('Are you sure you want to delete this connection? All synced files will be removed.')) {
//       return;
//     }
    
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       await axios.delete(
//         `${API_CONFIG.BASE_URL}/api/sharepoint/connections/${connectionId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       setConnections(connections.filter(c => c.id !== connectionId));
//       if (selectedConnection?.id === connectionId) {
//         setSelectedConnection(null);
//         setBrowsing(false);
//       }
//     } catch (error) {
//       console.error('Error deleting connection:', error);
//       alert('Failed to delete connection');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const browseSharePoint = async (connection, path = '/') => {
//     try {
//       setLoading(true);
//       setSelectedConnection(connection);
//       setBrowsing(true);
//       setBrowsePath(path);
      
//       const token = localStorage.getItem('token');
//       const response = await axios.post(
//         `${API_CONFIG.BASE_URL}/api/sharepoint/connections/${connection.id}/browse`,
//         { folder_path: path },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       setBrowseItems({
//         folders: response.data.folders,
//         files: response.data.files
//       });
//     } catch (error) {
//       console.error('Error browsing SharePoint:', error);
//       alert('Failed to browse SharePoint');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const syncConnection = async (connectionId) => {
//     try {
//       setSyncing(true);
//       const token = localStorage.getItem('token');
//       const response = await axios.post(
//         `${API_CONFIG.BASE_URL}/api/sharepoint/sync`,
//         { 
//           connection_id: connectionId,
//           import_files: true
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       alert(`Sync started successfully. Check logs for progress.`);
      
//       // Refresh logs after a delay
//       setTimeout(() => fetchSyncLogs(connectionId), 2000);
//     } catch (error) {
//       console.error('Error syncing connection:', error);
//       alert('Failed to sync connection: ' + (error.response?.data?.detail || error.message));
//     } finally {
//       setSyncing(false);
//     }
//   };

//   const fetchSyncLogs = async (connectionId) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.get(
//         `${API_CONFIG.BASE_URL}/api/sharepoint/sync-logs/${connectionId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setSyncLogs(response.data);
//     } catch (error) {
//       console.error('Error fetching sync logs:', error);
//     }
//   };

//   const importFile = async (file) => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await axios.post(
//         `${API_CONFIG.BASE_URL}/api/sharepoint/files/import`,
//         {
//           file_id: file.id,
//           connection_id: selectedConnection.id,
//           auto_process: true
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       if (response.data.success) {
//         alert(`File imported successfully! Contract ID: ${response.data.contract_id}`);
//         // Refresh browse
//         browseSharePoint(selectedConnection, browsePath);
//       } else {
//         alert('Failed to import file: ' + response.data.message);
//       }
//     } catch (error) {
//       console.error('Error importing file:', error);
//       alert('Failed to import file');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const viewContract = (contractId) => {
//     navigate(`/app/contracts/${contractId}`);
//   };

//   const resetForm = () => {
//     setConnectionForm({
//       site_url: '',
//       document_library: '',
//       client_id: '',
//       client_secret: '',
//       tenant_name: '',
//       connection_name: '',
//       description: '',
//       sync_enabled: true,
//       sync_interval_minutes: 60,
//       auto_upload: false,
//       folder_path: '/'
//     });
//     setTestResult(null);
//   };

//   return (
//     <div className="sharepoint-integration">
//       <div className="sharepoint-header">
//         <h1>
//           <Cloud size={24} />
//           SharePoint Integration
//         </h1>
//         <div className="header-actions">
//           <button 
//             className="btn-primary"
//             onClick={() => setShowAddConnection(true)}
//           >
//             <Plus size={16} />
//             Add Connection
//           </button>
//         </div>
//       </div>

//       <div className="sharepoint-tabs">
//         <button 
//           className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
//           onClick={() => setActiveTab('connections')}
//         >
//           <Link2 size={16} />
//           Connections
//         </button>
//         <button 
//           className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
//           onClick={() => setActiveTab('files')}
//           disabled={!selectedConnection}
//         >
//           <FolderOpen size={16} />
//           Browse Files
//         </button>
//         <button 
//           className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
//           onClick={() => {
//             setActiveTab('logs');
//             if (selectedConnection) fetchSyncLogs(selectedConnection.id);
//           }}
//           disabled={!selectedConnection}
//         >
//           <RefreshCw size={16} />
//           Sync Logs
//         </button>
//       </div>

//       <div className="sharepoint-content">
//         {/* Add Connection Modal */}
//         {showAddConnection && (
//           <div className="connection-modal">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h3>Add SharePoint Connection</h3>
//                 <button 
//                   className="close-btn"
//                   onClick={() => {
//                     setShowAddConnection(false);
//                     resetForm();
//                   }}
//                 >
//                   ×
//                 </button>
//               </div>
              
//               <div className="modal-body">
//                 <div className="form-group">
//                   <label>Connection Name</label>
//                   <input
//                     type="text"
//                     value={connectionForm.connection_name}
//                     onChange={(e) => setConnectionForm({
//                       ...connectionForm,
//                       connection_name: e.target.value
//                     })}
//                     placeholder="e.g., Grants Document Library"
//                   />
//                 </div>
                
//                 <div className="form-group">
//                   <label>Tenant Name</label>
//                   <input
//                     type="text"
//                     value={connectionForm.tenant_name}
//                     onChange={(e) => setConnectionForm({
//                       ...connectionForm,
//                       tenant_name: e.target.value
//                     })}
//                     placeholder="contoso"
//                   />
//                   <small>e.g., contoso (for contoso.sharepoint.com)</small>
//                 </div>
                
//                 <div className="form-group">
//                   <label>Site URL</label>
//                   <input
//                     type="text"
//                     value={connectionForm.site_url}
//                     onChange={(e) => setConnectionForm({
//                       ...connectionForm,
//                       site_url: e.target.value
//                     })}
//                     placeholder="https://contoso.sharepoint.com/sites/Grants"
//                   />
//                 </div>
                
//                 <div className="form-group">
//                   <label>Document Library</label>
//                   <input
//                     type="text"
//                     value={connectionForm.document_library}
//                     onChange={(e) => setConnectionForm({
//                       ...connectionForm,
//                       document_library: e.target.value
//                     })}
//                     placeholder="Grant Documents"
//                   />
//                 </div>
                
//                 <div className="form-group">
//                   <label>Client ID</label>
//                   <input
//                     type="text"
//                     value={connectionForm.client_id}
//                     onChange={(e) => setConnectionForm({
//                       ...connectionForm,
//                       client_id: e.target.value
//                     })}
//                     placeholder="Azure App Registration Client ID"
//                   />
//                 </div>
                
//                 <div className="form-group">
//                   <label>Client Secret</label>
//                   <input
//                     type="password"
//                     value={connectionForm.client_secret}
//                     onChange={(e) => setConnectionForm({
//                       ...connectionForm,
//                       client_secret: e.target.value
//                     })}
//                     placeholder="Client Secret"
//                   />
//                 </div>
                
//                 {testResult && (
//                   <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
//                     <h4>
//                       {testResult.success ? (
//                         <><CheckCircle size={16} /> Connection Successful</>
//                       ) : (
//                         <><AlertCircle size={16} /> Connection Failed</>
//                       )}
//                     </h4>
//                     <p>{testResult.message}</p>
//                     {testResult.files_count && (
//                       <p>Files found: {testResult.files_count}</p>
//                     )}
//                   </div>
//                 )}
//               </div>
              
//               <div className="modal-footer">
//                 <button 
//                   className="btn-secondary"
//                   onClick={testConnection}
//                   disabled={testing}
//                 >
//                   {testing ? 'Testing...' : 'Test Connection'}
//                 </button>
//                 <button 
//                   className="btn-primary"
//                   onClick={saveConnection}
//                   disabled={loading}
//                 >
//                   {loading ? 'Saving...' : 'Save Connection'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Connections Tab */}
//         {activeTab === 'connections' && (
//           <div className="connections-list">
//             {connections.length === 0 ? (
//               <div className="empty-state">
//                 <Cloud size={48} />
//                 <h3>No SharePoint Connections</h3>
//                 <p>Connect to SharePoint to automatically import grant documents.</p>
//                 <button 
//                   className="btn-primary"
//                   onClick={() => setShowAddConnection(true)}
//                 >
//                   <Plus size={16} />
//                   Add Connection
//                 </button>
//               </div>
//             ) : (
//               connections.map(conn => (
//                 <div key={conn.id} className="connection-card">
//                   <div className="connection-header">
//                     <div className="connection-icon">
//                       <Cloud size={24} />
//                     </div>
//                     <div className="connection-info">
//                       <h3>{conn.connection_name || conn.document_library}</h3>
//                       <p className="site-url">{conn.site_url}</p>
//                       <p className="library">Library: {conn.document_library}</p>
//                       {conn.last_sync_at && (
//                         <p className="last-sync">
//                           Last sync: {new Date(conn.last_sync_at).toLocaleString()}
//                         </p>
//                       )}
//                     </div>
//                     <div className="connection-status">
//                       <span className={`status-badge ${conn.is_active ? 'active' : 'inactive'}`}>
//                         {conn.is_active ? 'Active' : 'Inactive'}
//                       </span>
//                     </div>
//                   </div>
                  
//                   <div className="connection-actions">
//                     <button 
//                       className="action-btn"
//                       onClick={() => browseSharePoint(conn)}
//                     >
//                       <FolderOpen size={16} />
//                       Browse
//                     </button>
//                     <button 
//                       className="action-btn"
//                       onClick={() => syncConnection(conn.id)}
//                       disabled={syncing}
//                     >
//                       <RefreshCw size={16} className={syncing ? 'spinning' : ''} />
//                       Sync
//                     </button>
//                     <button 
//                       className="action-btn delete"
//                       onClick={() => deleteConnection(conn.id)}
//                     >
//                       <Trash2 size={16} />
//                       Delete
//                     </button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         )}

//         {/* Browse Files Tab */}
//         {activeTab === 'files' && selectedConnection && (
//           <div className="browse-files">
//             <div className="browser-header">
//               <div className="breadcrumb">
//                 {browsePath.split('/').filter(Boolean).map((part, index, array) => {
//                   const path = '/' + array.slice(0, index + 1).join('/');
//                   return (
//                     <React.Fragment key={index}>
//                       <span 
//                         className="breadcrumb-item"
//                         onClick={() => browseSharePoint(selectedConnection, path)}
//                       >
//                         {part}
//                       </span>
//                       {index < array.length - 1 && <ChevronRight size={14} />}
//                     </React.Fragment>
//                   );
//                 })}
//               </div>
//               <button 
//                 className="btn-secondary"
//                 onClick={() => browseSharePoint(selectedConnection, browsePath)}
//               >
//                 <RefreshCw size={16} />
//                 Refresh
//               </button>
//             </div>
            
//             <div className="browser-content">
//               {/* Folders */}
//               {browseItems.folders.length > 0 && (
//                 <div className="folders-section">
//                   <h4>Folders</h4>
//                   <div className="folder-grid">
//                     {browseItems.folders.map(folder => (
//                       <div 
//                         key={folder.id}
//                         className="folder-item"
//                         onClick={() => browseSharePoint(selectedConnection, folder.path)}
//                       >
//                         <FolderOpen size={32} />
//                         <span className="folder-name">{folder.name}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
              
//               {/* Files */}
//               {browseItems.files.length > 0 && (
//                 <div className="files-section">
//                   <h4>Files</h4>
//                   <table className="files-table">
//                     <thead>
//                       <tr>
//                         <th>Name</th>
//                         <th>Size</th>
//                         <th>Modified</th>
//                         <th>Status</th>
//                         <th>Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {browseItems.files.map(file => (
//                         <tr key={file.id}>
//                           <td>
//                             <div className="file-name">
//                               <FileText size={16} />
//                               {file.file_name}
//                             </div>
//                           </td>
//                           <td>{(file.file_size / 1024).toFixed(1)} KB</td>
//                           <td>{file.modified_at ? new Date(file.modified_at).toLocaleDateString() : '-'}</td>
//                           <td>
//                             <span className={`status-badge ${file.import_status}`}>
//                               {file.import_status === 'imported' ? (
//                                 <><CheckCircle size={12} /> Imported</>
//                               ) : file.import_status === 'failed' ? (
//                                 <><XCircle size={12} /> Failed</>
//                               ) : (
//                                 'Not Imported'
//                               )}
//                             </span>
//                           </td>
//                           <td>
//                             {file.import_status === 'imported' && file.contract_id ? (
//                               <button 
//                                 className="action-btn"
//                                 onClick={() => viewContract(file.contract_id)}
//                               >
//                                 <Eye size={16} />
//                                 View
//                               </button>
//                             ) : (
//                               <button 
//                                 className="action-btn"
//                                 onClick={() => importFile(file)}
//                                 disabled={file.file_type !== '.pdf'}
//                               >
//                                 <Upload size={16} />
//                                 Import
//                               </button>
//                             )}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Sync Logs Tab */}
//         {activeTab === 'logs' && selectedConnection && (
//           <div className="sync-logs">
//             {syncLogs.length === 0 ? (
//               <div className="empty-state">
//                 <RefreshCw size={48} />
//                 <h3>No Sync Logs</h3>
//                 <p>Sync this connection to see logs.</p>
//               </div>
//             ) : (
//               <table className="logs-table">
//                 <thead>
//                   <tr>
//                     <th>Started</th>
//                     <th>Type</th>
//                     <th>Status</th>
//                     <th>Files Found</th>
//                     <th>Imported</th>
//                     <th>Failed</th>
//                     <th>Completed</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {syncLogs.map(log => (
//                     <tr key={log.id}>
//                       <td>{new Date(log.started_at).toLocaleString()}</td>
//                       <td>{log.sync_type}</td>
//                       <td>
//                         <span className={`status-badge ${log.status}`}>
//                           {log.status}
//                         </span>
//                       </td>
//                       <td>{log.files_found}</td>
//                       <td>{log.files_imported}</td>
//                       <td>{log.files_failed}</td>
//                       <td>{log.completed_at ? new Date(log.completed_at).toLocaleString() : '-'}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default SharePointIntegration;