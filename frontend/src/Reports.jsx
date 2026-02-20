import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Eye,
  Download,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Building,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';
import './styles/Reports.css';
import API_CONFIG from './config';

const Reports = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchAllContracts();
  }, []);

  const fetchAllContracts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.BASE_URL;
      
      const response = await fetch(`${baseUrl}/api/contracts/?skip=0&limit=500`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(normalizeContracts(data));
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeContracts = (contractsData) => {
    if (!Array.isArray(contractsData)) return [];
    
    return contractsData.map(contract => ({
      id: contract.id || contract.contract_id,
      grant_name: contract.grant_name || contract.filename || 'Unnamed Contract',
      contract_number: contract.contract_number || 'N/A',
      grantor: contract.grantor || 'N/A',
      grantee: contract.grantee || 'N/A',
      total_amount: contract.total_amount || 0,
      start_date: contract.start_date || contract.uploaded_at,
      end_date: contract.end_date || 'N/A',
      status: contract.status || 'draft',
      uploaded_at: contract.uploaded_at,
      purpose: contract.purpose || 'N/A',
      created_by: contract.created_by,
      version: contract.version || 1,
      investment_id: contract.investment_id,
      project_id: contract.project_id,
      grant_id: contract.grant_id
    }));
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
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { class: 'rpt-status-draft', icon: Clock },
      'under_review': { class: 'rpt-status-review', icon: RefreshCw },
      'reviewed': { class: 'rpt-status-reviewed', icon: CheckCircle },
      'approved': { class: 'rpt-status-approved', icon: CheckCircle },
      'rejected': { class: 'rpt-status-rejected', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || { class: 'rpt-status-default', icon: FileText };
    const Icon = config.icon;
    
    return (
      <span className={`rpt-status-badge ${config.class}`}>
        <Icon size={12} />
        {status?.replace('_', ' ') || 'unknown'}
      </span>
    );
  };

  const getFilteredContracts = () => {
    let filtered = [...contracts];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(contract => 
        contract.grant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.grantor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.grantee?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(contract => contract.status === filterStatus);
    }
    
    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
      
      filtered = filtered.filter(contract => {
        if (!contract.uploaded_at) return false;
        const uploadDate = new Date(contract.uploaded_at);
        
        switch (dateRange) {
          case 'last30':
            return uploadDate >= thirtyDaysAgo;
          case 'last90':
            return uploadDate >= ninetyDaysAgo;
          case 'thisYear':
            return uploadDate.getFullYear() === new Date().getFullYear();
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };

  const exportToCSV = () => {
    const filtered = getFilteredContracts();
    
    const headers = [
      'Grant Name',
      'Contract Number',
      'Grantor',
      'Grantee',
      'Total Amount',
      'Start Date',
      'End Date',
      'Status',
      'Upload Date'
    ];
    
    const csvData = filtered.map(contract => [
      contract.grant_name,
      contract.contract_number,
      contract.grantor,
      contract.grantee,
      contract.total_amount,
      contract.start_date,
      contract.end_date,
      contract.status,
      contract.uploaded_at
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredContracts = getFilteredContracts();

  // Calculate summary statistics
  const totalValue = filteredContracts.reduce((sum, c) => sum + (c.total_amount || 0), 0);
  const approvedCount = filteredContracts.filter(c => c.status === 'approved').length;
  const pendingReview = filteredContracts.filter(c => c.status === 'under_review').length;
  const draftCount = filteredContracts.filter(c => c.status === 'draft').length;

  return (
    <div className="rpt-reports-page">
      <div className="rpt-reports-header">

        <div className="rpt-header-right">

        </div>
      </div>

      {/* Summary Cards */}
      <div className="rpt-report-summary-cards">
        <div className="rpt-summary-card">
          
          <div className="rpt-summary-details">
            <span className="rpt-summary-label">Total Contracts</span>
            <span className="rpt-summary-value">{filteredContracts.length}</span>
          </div>
        </div>
        
        <div className="rpt-summary-card">
         
          <div className="rpt-summary-details">
            <span className="rpt-summary-label">Total Value</span>
            <span className="rpt-summary-value">{formatCurrency(totalValue)}</span>
          </div>
        </div>
        
        <div className="rpt-summary-card">
          
          <div className="rpt-summary-details">
            <span className="rpt-summary-label">Approved</span>
            <span className="rpt-summary-value">{approvedCount}</span>
          </div>
        </div>
        
        <div className="rpt-summary-card">
          
          <div className="rpt-summary-details">
            <span className="rpt-summary-label">Under Review</span>
            <span className="rpt-summary-value">{pendingReview}</span>
          </div>
        </div>
        
        <div className="rpt-summary-card">
         
          <div className="rpt-summary-details">
            <span className="rpt-summary-label">Drafts</span>
            <span className="rpt-summary-value">{draftCount}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rpt-filters-section">
        <div className="rpt-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by grant name, number, grantor, grantee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rpt-search-input"
          />
        </div>

        <div className="rpt-filter-controls">
          <div className="rpt-filter-group">
            <Filter size={16} className="rpt-filter-icon" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rpt-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="rpt-filter-group">
            <Calendar size={16} className="rpt-filter-icon" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="rpt-filter-select"
            >
              <option value="all">All Time</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rpt-reports-table-container">
        {loading ? (
          <div className="rpt-loading-state">
            <RefreshCw className="rpt-spinner" size={32} />
            <p>Loading contracts...</p>
          </div>
        ) : (
          <table className="rpt-reports-table">
            <thead>
              <tr>
                <th>Grant Name</th>
                <th>Contract #</th>
                <th>Grantor</th>
                <th>Grantee</th>
                <th className="rpt-text-right">Amount</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th className="rpt-text-right">Version</th>
                <th className="rpt-text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="rpt-contract-row">
                    <td className="rpt-contract-name-cell">
                      <div className="rpt-contract-name-wrapper">
                        <span className="rpt-contract-name">{contract.grant_name}</span>
                        {contract.purpose && contract.purpose !== 'N/A' && (
                          <span className="rpt-contract-purpose">{contract.purpose.substring(0, 60)}...</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="rpt-contract-number">{contract.contract_number}</span>
                      {contract.investment_id && (
                        <span className="rpt-contract-id-badge">INV-{contract.investment_id}</span>
                      )}
                    </td>
                    <td>
                      <div className="rpt-organization-info">
                        <Building size={14} />
                        <span>{contract.grantor}</span>
                      </div>
                    </td>
                    <td>
                      <div className="rpt-organization-info">
                        <Building size={14} />
                        <span>{contract.grantee}</span>
                      </div>
                    </td>
                    <td className="rpt-text-right">
                      <span className="rpt-amount-value">{formatCurrency(contract.total_amount)}</span>
                    </td>
                    <td>
                      <span className="rpt-date-value">{formatDate(contract.start_date)}</span>
                    </td>
                    <td>
                      <span className="rpt-date-value">{formatDate(contract.end_date)}</span>
                    </td>
                    <td>
                      {getStatusBadge(contract.status)}
                    </td>
                    <td className="rpt-text-right">
                      <span className="rpt-version-badge">v{contract.version}</span>
                    </td>
                    <td className="rpt-text-center">
                      <div className="rpt-action-buttons">
                        <button 
                          className="rpt-btn-action"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="rpt-btn-action"
                          onClick={() => {}}
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          className="rpt-btn-action"
                          onClick={() => {}}
                          title="More Details"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="rpt-empty-state">
                    <FileText size={48} />
                    <h3>No contracts found</h3>
                    <p>Try adjusting your filters or upload a new contract</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer with Summary */}
      {filteredContracts.length > 0 && (
        <div className="rpt-table-footer">
          <div className="rpt-pagination-info">
            Showing {filteredContracts.length} of {contracts.length} contracts
          </div>
          <div className="rpt-total-summary">
            <span>Total Value: {formatCurrency(totalValue)}</span>
            <span>Average: {formatCurrency(totalValue / filteredContracts.length)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;