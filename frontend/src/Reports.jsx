// C:\saple.ai\POC\frontend\src\Reports.jsx
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
  CheckCircle,
  BarChart3,
  PieChart,
  Shield,
  Flag,
  Users,
  Wallet,
  Activity,
  Target,
  Printer,
  ChevronDown,
  Layers,
  AlertTriangle,
  Award,
  Briefcase,
  Zap,
  BookOpen,
  Gauge,
  Sparkles,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ExternalLink,
  Copy,
  Settings
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
  const [activeTab, setActiveTab] = useState('active-tracker');
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedExecGrant, setSelectedExecGrant] = useState(null);
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    fetchAllContracts();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.BASE_URL;
      
      const response = await fetch(`${baseUrl}/api/users?skip=0&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Users fetched:', data);
        setUsers(Array.isArray(data) ? data : []);
        
        // Create a map of user IDs to user objects for quick lookup
        const map = {};
        (Array.isArray(data) ? data : []).forEach(user => {
          map[user.id] = user;
        });
        setUserMap(map);
      } else if (response.status === 403) {
        console.log('Not authorized to view users');
        // Try to get current user from localStorage as fallback
        try {
          const currentUserStr = localStorage.getItem('user');
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            setUsers([currentUser]);
            const map = {};
            map[currentUser.id] = currentUser;
            setUserMap(map);
          }
        } catch (e) {
          console.error('Failed to parse current user:', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // Helper function to get user name from ID
  const getUserName = (userId) => {
    if (!userId && userId !== 0) return 'Unassigned';
    
    // Convert to number if it's a string
    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(id)) return 'Unassigned';
    
    // Check if we have the user in our map
    const user = userMap[id];
    if (user) {
      return user.full_name || user.username || `User ${id}`;
    }
    
    // If not in map, check users array
    const userFromArray = users.find(u => u.id === id);
    if (userFromArray) {
      return userFromArray.full_name || userFromArray.username || `User ${id}`;
    }
    
    // Try to get from localStorage if available (for current user)
    try {
      const currentUserStr = localStorage.getItem('user');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === id) {
          return currentUser.full_name || currentUser.username || `User ${id}`;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    return `User ${id}`;
  };

  // Helper function to safely parse user IDs from various formats
  const parseUserIds = (userField) => {
    if (!userField) return [];
    
    // If it's already an array
    if (Array.isArray(userField)) {
      return userField.filter(id => id !== null && id !== undefined);
    }
    
    // If it's a string
    if (typeof userField === 'string') {
      // If it's empty
      if (!userField.trim()) return [];
      
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(userField);
        if (Array.isArray(parsed)) {
          return parsed.filter(id => id !== null && id !== undefined);
        }
      } catch {
        // Try comma-separated
        return userField
          .split(',')
          .map(id => id.trim())
          .filter(id => id && !isNaN(parseInt(id, 10)))
          .map(id => parseInt(id, 10));
      }
    }
    
    // If it's a single number
    if (typeof userField === 'number') {
      return [userField];
    }
    
    return [];
  };

  // Helper function to extract assigned users from contract data
  const getAssignedUsers = (contract) => {
    const result = {
      project_managers: [],
      program_managers: [],
      directors: []
    };

    try {
      console.log('Extracting assigned users for contract:', contract.id);
      console.log('Raw assigned_pm_users:', contract.assigned_pm_users);
      console.log('Raw assigned_pgm_users:', contract.assigned_pgm_users);
      console.log('Raw assigned_director_users:', contract.assigned_director_users);

      // Check direct assignment fields from database - THESE ARE THE CORRECT FIELD NAMES
      if (contract.assigned_pm_users) {
        result.project_managers = parseUserIds(contract.assigned_pm_users);
        console.log('Parsed project_managers:', result.project_managers);
      }

      if (contract.assigned_pgm_users) {
        result.program_managers = parseUserIds(contract.assigned_pgm_users);
        console.log('Parsed program_managers:', result.program_managers);
      }

      if (contract.assigned_director_users) {
        result.directors = parseUserIds(contract.assigned_director_users);
        console.log('Parsed directors:', result.directors);
      }

      // If no assignments found in direct fields, check comprehensive_data
      if ((!result.project_managers.length || !result.program_managers.length || !result.directors.length) && 
          contract.comprehensive_data) {
        
        console.log('Checking comprehensive_data for assignments');
        const compData = contract.comprehensive_data;
        
        // Check agreement_metadata
        if (compData.agreement_metadata) {
          const metadata = compData.agreement_metadata;
          console.log('agreement_metadata:', metadata);
          
          if (!result.project_managers.length && metadata.assigned_pm_users) {
            result.project_managers = parseUserIds(metadata.assigned_pm_users);
          }
          
          if (!result.program_managers.length && metadata.assigned_pgm_users) {
            result.program_managers = parseUserIds(metadata.assigned_pgm_users);
          }
          
          if (!result.directors.length && metadata.assigned_director_users) {
            result.directors = parseUserIds(metadata.assigned_director_users);
          }
        }
        
        // Check assigned_users
        if (compData.assigned_users) {
          const assigned = compData.assigned_users;
          console.log('assigned_users:', assigned);
          
          if (!result.project_managers.length && assigned.pm_users) {
            result.project_managers = parseUserIds(assigned.pm_users);
          }
          
          if (!result.program_managers.length && assigned.pgm_users) {
            result.program_managers = parseUserIds(assigned.pgm_users);
          }
          
          if (!result.directors.length && assigned.director_users) {
            result.directors = parseUserIds(assigned.director_users);
          }
        }
        
        // Check assignment_tracking
        if (compData.assignment_tracking) {
          const tracking = compData.assignment_tracking;
          console.log('assignment_tracking:', tracking);
          
          if (!result.project_managers.length && tracking.current_pm_users) {
            result.project_managers = parseUserIds(tracking.current_pm_users);
          }
          
          if (!result.program_managers.length && tracking.current_pgm_users) {
            result.program_managers = parseUserIds(tracking.current_pgm_users);
          }
          
          if (!result.directors.length && tracking.current_director_users) {
            result.directors = parseUserIds(tracking.current_director_users);
          }
        }
        
        // Check assignment_history (most recent)
        if ((!result.project_managers.length || !result.program_managers.length || !result.directors.length) &&
            compData.assignment_history && Array.isArray(compData.assignment_history) && compData.assignment_history.length > 0) {
          
          console.log('Checking assignment_history');
          // Get the most recent assignment
          const latestAssignment = compData.assignment_history[compData.assignment_history.length - 1];
          console.log('latest assignment:', latestAssignment);
          
          if (latestAssignment.assigned_users) {
            const assignedUsers = latestAssignment.assigned_users;
            
            if (!result.project_managers.length && assignedUsers.pm_users) {
              result.project_managers = parseUserIds(assignedUsers.pm_users);
            }
            
            if (!result.program_managers.length && assignedUsers.pgm_users) {
              result.program_managers = parseUserIds(assignedUsers.pgm_users);
            }
            
            if (!result.directors.length && assignedUsers.director_users) {
              result.directors = parseUserIds(assignedUsers.director_users);
            }
          }
        }
      }

      // If still no project managers, check if current user is the creator (for PM)
      if (!result.project_managers.length && contract.created_by) {
        console.log('Using created_by as project manager:', contract.created_by);
        // The creator is effectively the Project Manager
        result.project_managers = [contract.created_by];
      }

      console.log('Final assigned users result:', result);

    } catch (error) {
      console.error('Error extracting assigned users:', error);
    }

    return result;
  };

  // Helper function to get display name for first assigned user
  const getFirstAssignedName = (userIds) => {
    if (!userIds || !userIds.length) return 'Unassigned';
    return getUserName(userIds[0]);
  };

  // Helper function to get all assigned names as a string
  const getAssignedNames = (userIds) => {
    if (!userIds || !userIds.length) return 'Unassigned';
    if (userIds.length === 1) return getUserName(userIds[0]);
    
    const names = userIds.map(id => getUserName(id));
    return `${names.slice(0, 2).join(', ')}${names.length > 2 ? ` +${names.length - 2}` : ''}`;
  };

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
        console.log('Contracts fetched:', data);
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
    
    return contractsData.map(contract => {
      const compData = contract.comprehensive_data || {};
      
      // Extract reporting data if available
      const reportingData = compData.deliverables?.reporting_requirements || {};
      const financialData = compData.financial_details || {};
      const riskData = compData.risk_assessment || {};
      
      // Get assigned users
      const assigned = getAssignedUsers(contract);
      
      return {
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
        grant_id: contract.grant_id,
        
        // Enhanced data for reports
        comprehensive_data: compData,
        reporting_requirements: reportingData,
        financial_details: financialData,
        risk_assessment: riskData,
        
        // Assigned users - properly extracted
        assigned_pm_users: assigned.project_managers,
        assigned_pgm_users: assigned.program_managers,
        assigned_director_users: assigned.directors,
        
        // For display - using the helper functions
        pm_name: getFirstAssignedName(assigned.project_managers),
        pgm_name: getFirstAssignedName(assigned.program_managers),
        director_name: getFirstAssignedName(assigned.directors),
        pm_names: getAssignedNames(assigned.project_managers),
        pgm_names: getAssignedNames(assigned.program_managers),
        director_names: getAssignedNames(assigned.directors),
        
        // Calculate derived fields
        days_since_upload: contract.uploaded_at ? 
          Math.floor((new Date() - new Date(contract.uploaded_at)) / (1000 * 60 * 60 * 24)) : 0,
        
        // Mock data for demo purposes (in production, these would come from actual tracking)
        amount_received: contract.total_amount ? contract.total_amount * 0.4 : 0,
        amount_spent: contract.total_amount ? contract.total_amount * 0.25 : 0,
        milestone_completion: Math.floor(Math.random() * 100),
        risk_score: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        last_activity_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        reporting_compliance: Math.floor(Math.random() * 100),
        financial_compliance: Math.floor(Math.random() * 100)
      };
    });
  };

  // Update contract display names when users are loaded
  useEffect(() => {
    if (Object.keys(userMap).length > 0 && contracts.length > 0) {
      console.log('Updating contract display names with userMap:', userMap);
      setContracts(prevContracts => 
        prevContracts.map(contract => {
          const assigned = {
            project_managers: parseUserIds(contract.assigned_pm_users),
            program_managers: parseUserIds(contract.assigned_pgm_users),
            directors: parseUserIds(contract.assigned_director_users)
          };
          
          return {
            ...contract,
            pm_name: getFirstAssignedName(assigned.project_managers),
            pgm_name: getFirstAssignedName(assigned.program_managers),
            director_name: getFirstAssignedName(assigned.directors),
            pm_names: getAssignedNames(assigned.project_managers),
            pgm_names: getAssignedNames(assigned.program_managers),
            director_names: getAssignedNames(assigned.directors)
          };
        })
      );
    }
  }, [userMap]);

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

  const getDaysRemaining = (endDate) => {
    if (!endDate || endDate === 'N/A') return null;
    try {
      const end = new Date(endDate);
      const now = new Date();
      const diff = Math.floor((end - now) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { class: 'rpt-status-draft', icon: Clock },
      'under_review': { class: 'rpt-status-review', icon: RefreshCw },
      'reviewed': { class: 'rpt-status-reviewed', icon: CheckCircle },
      'approved': { class: 'rpt-status-approved', icon: CheckCircle },
      'rejected': { class: 'rpt-status-rejected', icon: AlertCircle },
      'published': { class: 'rpt-status-published', icon: CheckCircle },
      'active': { class: 'rpt-status-active', icon: CheckCircle },
      'finalized': { class: 'rpt-status-finalized', icon: Award }
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

  const getRiskBadge = (risk) => {
    const config = {
      'Low': { class: 'rpt-risk-low', icon: CheckCircle },
      'Medium': { class: 'rpt-risk-medium', icon: AlertCircle },
      'High': { class: 'rpt-risk-high', icon: AlertTriangle }
    };
    
    const conf = config[risk] || { class: 'rpt-risk-unknown', icon: Info };
    const Icon = conf.icon;
    
    return (
      <span className={`rpt-risk-badge ${conf.class}`}>
        <Icon size={12} />
        {risk}
      </span>
    );
  };

  const getFilteredContracts = () => {
    let filtered = [...contracts];
    
    if (searchTerm) {
      filtered = filtered.filter(contract => 
        contract.grant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.grantor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.grantee?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(contract => contract.status === filterStatus);
    }
    
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

  const exportToPDF = async (reportType) => {
    setExportLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const reportName = reportType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const blob = new Blob([`${reportName} - Generated on ${new Date().toLocaleDateString()}`], 
        { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const exportToCSV = (reportType) => {
    const filtered = getFilteredContracts();
    
    let headers = [];
    let rows = [];

    switch (reportType) {
      case 'active-tracker':
        headers = ['Grant Name', 'Report Type', 'Reporting Period', 'Due Date', 'Days Remaining', 'Status', 'Assigned To (PM)', 'Reviewer (PGM)', 'Final Approver'];
        rows = filtered.flatMap(contract => {
          const reportTypes = contract.reporting_requirements?.report_types || ['Progress', 'Financial', 'Final'];
          const dueDates = contract.reporting_requirements?.due_dates || [contract.end_date];
          
          return reportTypes.map((type, idx) => [
            contract.grant_name,
            type,
            `Q${Math.floor(idx/3)+1} ${new Date().getFullYear()}`,
            formatDate(dueDates[idx] || contract.end_date),
            getDaysRemaining(dueDates[idx] || contract.end_date) || 'N/A',
            contract.status,
            contract.pm_names,
            contract.pgm_names,
            contract.director_names
          ]);
        });
        break;

      case 'pending-approvals':
        headers = ['Grant Name', 'Submission Date', 'Days Pending', 'Amount', 'Current Status', 'Next Approver', 'Reviewer'];
        rows = filtered
          .filter(c => ['under_review', 'reviewed'].includes(c.status))
          .map(contract => [
            contract.grant_name,
            formatDate(contract.uploaded_at),
            contract.days_since_upload,
            formatCurrency(contract.total_amount),
            contract.status === 'under_review' ? 'Awaiting Program Manager' : 'Awaiting Director',
            contract.status === 'under_review' ? 'Program Manager' : 'Director',
            contract.pgm_names
          ]);
        break;

      case 'financial-summary':
        headers = ['Grant Name', 'Total Amount', 'Amount Received', 'Pending Amount', 'Amount Spent', 'Balance', 'Utilization %', 'Burn Rate', 'Variance'];
        rows = filtered.map(contract => {
          const received = contract.amount_received;
          const spent = contract.amount_spent;
          const pending = contract.total_amount - received;
          const balance = received - spent;
          const utilization = contract.total_amount ? (spent / contract.total_amount * 100).toFixed(1) : 0;
          const monthsActive = contract.start_date ? 
            Math.max(1, Math.ceil((new Date() - new Date(contract.start_date)) / (1000 * 60 * 60 * 24 * 30))) : 1;
          const burnRate = spent / monthsActive;
          
          return [
            contract.grant_name,
            formatCurrency(contract.total_amount),
            formatCurrency(received),
            formatCurrency(pending),
            formatCurrency(spent),
            formatCurrency(balance),
            `${utilization}%`,
            formatCurrency(burnRate) + '/mo',
            `${Math.floor(Math.random() * 20 - 10)}%`
          ];
        });
        break;

      case 'portfolio-health':
        headers = ['Grant Name', 'Status', 'On Track/At Risk', 'Reporting Compliance', 'Financial Compliance', 'Milestone %', 'Risk Score'];
        rows = filtered.map(contract => {
          const healthStatus = contract.milestone_completion > 70 ? 'On Track' : 
                              contract.milestone_completion > 40 ? 'Monitor' : 'At Risk';
          
          return [
            contract.grant_name,
            contract.status,
            healthStatus,
            `${contract.reporting_compliance}%`,
            `${contract.financial_compliance}%`,
            `${contract.milestone_completion}%`,
            contract.risk_score
          ];
        });
        break;

      case 'risk-exposure':
        headers = ['Grant Name', 'Risk Type', 'Risk Level', 'Financial Exposure', 'Trigger', 'Recommended Action'];
        rows = filtered
          .filter(c => c.risk_score === 'High' || 
                      (c.milestone_completion < 70 && c.amount_spent / c.total_amount > 0.9) ||
                      c.days_since_upload > 60)
          .map(contract => {
            let riskType = 'Performance';
            let trigger = '';
            let action = '';
            
            if (contract.days_since_upload > 60) {
              riskType = 'Inactivity';
              trigger = 'No activity in 60+ days';
              action = 'Contact grantee for status update';
            } else if (contract.milestone_completion < 70 && contract.amount_spent / contract.total_amount > 0.9) {
              riskType = 'Financial';
              trigger = 'Spend > 90% but milestone < 70%';
              action = 'Review budget and timeline';
            } else if (contract.risk_score === 'High') {
              riskType = 'Compliance';
              trigger = 'High risk score from assessment';
              action = 'Schedule compliance review';
            }
            
            return [
              contract.grant_name,
              riskType,
              contract.risk_score,
              formatCurrency(contract.total_amount * 0.3),
              trigger,
              action
            ];
          });
        break;

      case 'executive-snapshot':
        headers = ['Grant Name', 'Grantor', 'Total Value', 'Progress %', 'Financial Utilization', 'Next Deadline', 'Risk Status'];
        rows = filtered.map(contract => [
          contract.grant_name,
          contract.grantor,
          formatCurrency(contract.total_amount),
          `${contract.milestone_completion}%`,
          `${((contract.amount_spent / contract.total_amount) * 100).toFixed(1)}%`,
          formatDate(contract.end_date),
          contract.risk_score
        ]);
        break;

      case 'portfolio-dashboard':
        headers = ['Metric', 'Value'];
        const totalValue = filtered.reduce((sum, c) => sum + (c.total_amount || 0), 0);
        const onTrack = filtered.filter(c => c.milestone_completion > 70).length;
        const atRisk = filtered.filter(c => c.risk_score === 'High').length;
        const pendingApprovals = filtered.filter(c => ['under_review', 'reviewed'].includes(c.status)).length;
        
        rows = [
          ['Total Grants', filtered.length],
          ['Total Portfolio Value', formatCurrency(totalValue)],
          ['On Track Grants', `${onTrack} (${filtered.length ? ((onTrack/filtered.length)*100).toFixed(1) : 0}%)`],
          ['Grants at Risk', atRisk],
          ['Funds at Risk', formatCurrency(totalValue * 0.15)],
          ['Upcoming Deadlines (30 days)', filtered.filter(c => {
            const days = getDaysRemaining(c.end_date);
            return days !== null && days <= 30 && days > 0;
          }).length],
          ['Pending Approvals', pendingApprovals],
          ['Average Milestone Completion', `${filtered.length ? (filtered.reduce((sum, c) => sum + (c.milestone_completion || 0), 0) / filtered.length).toFixed(1) : 0}%`]
        ];
        break;

      default:
        headers = ['Grant Name', 'Contract #', 'Grantor', 'Grantee', 'Amount', 'Status'];
        rows = filtered.map(c => [c.grant_name, c.contract_number, c.grantor, c.grantee, formatCurrency(c.total_amount), c.status]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderActiveTracker = () => {
    const filtered = getFilteredContracts();
    
    return (
      <div className="rpt-report-section">
        <div className="rpt-section-header">
          <div className="rpt-section-title">
            <Activity size={18} />
            <h3>Active Reports Tracker</h3>
          </div>
          <div className="rpt-section-actions">
            <button 
              className="rpt-btn-small"
              onClick={() => exportToCSV('active-tracker')}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="rpt-table-responsive">
          <table className="rpt-report-table">
            <thead>
              <tr>
                <th>Grant Name</th>
                <th>Report Type</th>
                <th>Reporting Period</th>
                <th>Due Date</th>
                <th>Days Remaining</th>
                <th>Status</th>
                <th>Assigned To (PM)</th>
                <th>Reviewer (PGM)</th>
                <th>Final Approver</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.flatMap(contract => {
                  const reportTypes = contract.reporting_requirements?.report_types || 
                    ['Progress Report', 'Financial Report', 'Final Report'];
                  const dueDates = contract.reporting_requirements?.due_dates || 
                    [contract.end_date, contract.end_date, contract.end_date];
                  
                  return reportTypes.map((type, idx) => {
                    const dueDate = dueDates[idx] || contract.end_date;
                    const daysRemaining = getDaysRemaining(dueDate);
                    
                    let reportStatus = 'Draft';
                    if (contract.status === 'approved') reportStatus = 'Approved';
                    else if (contract.status === 'under_review') reportStatus = 'Under Review';
                    else if (contract.status === 'reviewed') reportStatus = 'Reviewed';
                    else if (contract.status === 'published') reportStatus = 'Published';
                    else if (contract.status === 'active') reportStatus = 'Active';
                    else if (daysRemaining && daysRemaining < 0) reportStatus = 'Overdue';
                    
                    return (
                      <tr key={`${contract.id}-${idx}`}>
                        <td className="rpt-grant-name">
                          <span className="rpt-name-link" onClick={() => navigate(`/contracts/${contract.id}`)}>
                            {contract.grant_name}
                          </span>
                        </td>
                        <td>{type}</td>
                        <td>Q{Math.floor(idx/3)+1} {new Date().getFullYear()}</td>
                        <td>{formatDate(dueDate)}</td>
                        <td>
                          {daysRemaining !== null ? (
                            <span className={daysRemaining < 0 ? 'rpt-overdue' : daysRemaining < 30 ? 'rpt-urgent' : ''}>
                              {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td>{getStatusBadge(reportStatus)}</td>
                        <td>{contract.pm_names}</td>
                        <td>{contract.pgm_names}</td>
                        <td>{contract.director_names}</td>
                      </tr>
                    );
                  });
                })
              ) : (
                <tr>
                  <td colSpan="9" className="rpt-empty-state">
                    <FileText size={32} />
                    <p>No active reports found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPendingApprovals = () => {
    const pending = contracts.filter(c => ['under_review', 'reviewed'].includes(c.status));
    
    const byLevel = {
      program_manager: pending.filter(c => c.status === 'under_review'),
      director: pending.filter(c => c.status === 'reviewed')
    };
    
    return (
      <div className="rpt-report-section">
        <div className="rpt-section-header">
          <div className="rpt-section-title">
            <Clock size={18} />
            <h3>Pending Approvals Report</h3>
          </div>
          <div className="rpt-section-actions">
            <button 
              className="rpt-btn-small"
              onClick={() => exportToCSV('pending-approvals')}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="rpt-pending-groups">
          <div className="rpt-pending-group">
            <h4>
              <Users size={16} />
              Awaiting Program Manager
              <span className="rpt-count-badge">{byLevel.program_manager.length}</span>
            </h4>
            <div className="rpt-pending-table">
              <table className="rpt-report-table">
                <thead>
                  <tr>
                    <th>Grant</th>
                    <th>Submission Date</th>
                    <th>Days Pending</th>
                    <th>Amount</th>
                    <th>Reviewer</th>
                  </tr>
                </thead>
                <tbody>
                  {byLevel.program_manager.map(contract => (
                    <tr key={contract.id}>
                      <td className="rpt-grant-name">
                        <span className="rpt-name-link" onClick={() => navigate(`/contracts/${contract.id}`)}>
                          {contract.grant_name}
                        </span>
                      </td>
                      <td>{formatDate(contract.uploaded_at)}</td>
                      <td>{contract.days_since_upload}</td>
                      <td>{formatCurrency(contract.total_amount)}</td>
                      <td>{contract.pgm_names}</td>
                    </tr>
                  ))}
                  {byLevel.program_manager.length === 0 && (
                    <tr>
                      <td colSpan="5" className="rpt-empty-sub">No items pending</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="rpt-pending-group">
            <h4>
              <Award size={16} />
              Awaiting Director
              <span className="rpt-count-badge">{byLevel.director.length}</span>
            </h4>
            <div className="rpt-pending-table">
              <table className="rpt-report-table">
                <thead>
                  <tr>
                    <th>Grant</th>
                    <th>Submission Date</th>
                    <th>Days Pending</th>
                    <th>Amount</th>
                    <th>Program Manager</th>
                  </tr>
                </thead>
                <tbody>
                  {byLevel.director.map(contract => (
                    <tr key={contract.id}>
                      <td className="rpt-grant-name">
                        <span className="rpt-name-link" onClick={() => navigate(`/contracts/${contract.id}`)}>
                          {contract.grant_name}
                        </span>
                      </td>
                      <td>{formatDate(contract.uploaded_at)}</td>
                      <td>{contract.days_since_upload}</td>
                      <td>{formatCurrency(contract.total_amount)}</td>
                      <td>{contract.pgm_names}</td>
                    </tr>
                  ))}
                  {byLevel.director.length === 0 && (
                    <tr>
                      <td colSpan="5" className="rpt-empty-sub">No items pending</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialSummary = () => {
    const filtered = getFilteredContracts();
    
    const totalValue = filtered.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const totalReceived = filtered.reduce((sum, c) => sum + (c.amount_received || 0), 0);
    const totalSpent = filtered.reduce((sum, c) => sum + (c.amount_spent || 0), 0);
    const totalPending = totalValue - totalReceived;
    const totalBalance = totalReceived - totalSpent;
    const avgUtilization = totalValue ? (totalSpent / totalValue * 100).toFixed(1) : 0;
    
    return (
      <div className="rpt-report-section">
        <div className="rpt-section-header">
          <div className="rpt-section-title">
            <Wallet size={18} />
            <h3>Grant Financial Summary Report</h3>
          </div>
          <div className="rpt-section-actions">
            <button 
              className="rpt-btn-small"
              onClick={() => exportToCSV('financial-summary')}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="rpt-summary-metrics">
          <div className="rpt-metric-card">
            <span className="rpt-metric-label">Total Portfolio</span>
            <span className="rpt-metric-value">{formatCurrency(totalValue)}</span>
          </div>
          <div className="rpt-metric-card">
            <span className="rpt-metric-label">Amount Received</span>
            <span className="rpt-metric-value">{formatCurrency(totalReceived)}</span>
            <span className="rpt-metric-sub">{totalValue ? ((totalReceived/totalValue)*100).toFixed(1) : 0}% of total</span>
          </div>
          <div className="rpt-metric-card">
            <span className="rpt-metric-label">Pending Amount</span>
            <span className="rpt-metric-value">{formatCurrency(totalPending)}</span>
          </div>
          <div className="rpt-metric-card">
            <span className="rpt-metric-label">Amount Spent</span>
            <span className="rpt-metric-value">{formatCurrency(totalSpent)}</span>
          </div>
          <div className="rpt-metric-card">
            <span className="rpt-metric-label">Balance Remaining</span>
            <span className="rpt-metric-value">{formatCurrency(totalBalance)}</span>
          </div>
          <div className="rpt-metric-card">
            <span className="rpt-metric-label">Avg Utilization</span>
            <span className="rpt-metric-value">{avgUtilization}%</span>
          </div>
        </div>
        
        <div className="rpt-table-responsive">
          <table className="rpt-report-table">
            <thead>
              <tr>
                <th>Grant Name</th>
                <th>Total Amount</th>
                <th>Amount Received</th>
                <th>Pending</th>
                <th>Amount Spent</th>
                <th>Balance</th>
                <th>Utilization %</th>
                <th>Burn Rate</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(contract => {
                const received = contract.amount_received;
                const spent = contract.amount_spent;
                const pending = contract.total_amount - received;
                const balance = received - spent;
                const utilization = contract.total_amount ? (spent / contract.total_amount * 100).toFixed(1) : 0;
                const monthsActive = contract.start_date ? 
                  Math.max(1, Math.ceil((new Date() - new Date(contract.start_date)) / (1000 * 60 * 60 * 24 * 30))) : 1;
                const burnRate = spent / monthsActive;
                const variance = (Math.random() * 20 - 10).toFixed(1);
                const varianceIcon = variance > 0 ? <ArrowUpRight size={12} className="rpt-positive" /> : 
                                                     <ArrowDownRight size={12} className="rpt-negative" />;
                
                return (
                  <tr key={contract.id}>
                    <td className="rpt-grant-name">
                      <span className="rpt-name-link" onClick={() => navigate(`/contracts/${contract.id}`)}>
                        {contract.grant_name}
                      </span>
                    </td>
                    <td className="rpt-amount">{formatCurrency(contract.total_amount)}</td>
                    <td className="rpt-amount">{formatCurrency(received)}</td>
                    <td className="rpt-amount">{formatCurrency(pending)}</td>
                    <td className="rpt-amount">{formatCurrency(spent)}</td>
                    <td className="rpt-amount">{formatCurrency(balance)}</td>
                    <td className="rpt-percentage">
                      <div className="rpt-progress-container">
                        <span>{utilization}%</span>
                        <div className="rpt-progress-bar">
                          <div className="rpt-progress-fill" style={{width: `${utilization}%`}}></div>
                        </div>
                      </div>
                    </td>
                    <td className="rpt-amount">{formatCurrency(burnRate)}/mo</td>
                    <td className="rpt-variance">
                      {varianceIcon}
                      {Math.abs(variance)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPortfolioHealth = () => {
    const filtered = getFilteredContracts();
    
    const onTrack = filtered.filter(c => c.milestone_completion > 70).length;
    const monitor = filtered.filter(c => c.milestone_completion > 40 && c.milestone_completion <= 70).length;
    const atRisk = filtered.filter(c => c.milestone_completion <= 40).length;
    
    return (
      <div className="rpt-report-section">
        <div className="rpt-section-header">
          <div className="rpt-section-title">
            <Gauge size={18} />
            <h3>Portfolio Health Report</h3>
          </div>
          <div className="rpt-section-actions">
            <button 
              className="rpt-btn-small"
              onClick={() => exportToCSV('portfolio-health')}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="rpt-health-summary">
          <div className="rpt-health-chart">
            <div className="rpt-health-stat">
              <span className="rpt-stat-label">On Track</span>
              <span className="rpt-stat-value rpt-success">{onTrack}</span>
              <span className="rpt-stat-percent">{filtered.length ? ((onTrack/filtered.length)*100).toFixed(1) : 0}%</span>
            </div>
            <div className="rpt-health-stat">
              <span className="rpt-stat-label">Monitor</span>
              <span className="rpt-stat-value rpt-warning">{monitor}</span>
              <span className="rpt-stat-percent">{filtered.length ? ((monitor/filtered.length)*100).toFixed(1) : 0}%</span>
            </div>
            <div className="rpt-health-stat">
              <span className="rpt-stat-label">At Risk</span>
              <span className="rpt-stat-value rpt-danger">{atRisk}</span>
              <span className="rpt-stat-percent">{filtered.length ? ((atRisk/filtered.length)*100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>
        
        <div className="rpt-table-responsive">
          <table className="rpt-report-table">
            <thead>
              <tr>
                <th>Grant Name</th>
                <th>Status</th>
                <th>On Track/At Risk</th>
                <th>Reporting Compliance</th>
                <th>Financial Compliance</th>
                <th>Milestone %</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(contract => {
                const healthStatus = contract.milestone_completion > 70 ? 'On Track' : 
                                    contract.milestone_completion > 40 ? 'Monitor' : 'At Risk';
                const healthClass = healthStatus === 'On Track' ? 'rpt-health-good' :
                                   healthStatus === 'Monitor' ? 'rpt-health-warning' : 'rpt-health-bad';
                
                return (
                  <tr key={contract.id}>
                    <td className="rpt-grant-name">
                      <span className="rpt-name-link" onClick={() => navigate(`/contracts/${contract.id}`)}>
                        {contract.grant_name}
                      </span>
                    </td>
                    <td>{getStatusBadge(contract.status)}</td>
                    <td>
                      <span className={`rpt-health-badge ${healthClass}`}>
                        {healthStatus}
                      </span>
                    </td>
                    <td>
                      <div className="rpt-compliance-indicator">
                        <div className="rpt-progress-circle">
                          <svg viewBox="0 0 36 36" className="rpt-circular-chart">
                            <path className="rpt-circle-bg"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className="rpt-circle"
                              strokeDasharray={`${contract.reporting_compliance}, 100`}
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="rpt-circle-label">{contract.reporting_compliance}%</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="rpt-compliance-indicator">
                        <div className="rpt-progress-circle">
                          <svg viewBox="0 0 36 36" className="rpt-circular-chart">
                            <path className="rpt-circle-bg"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className="rpt-circle"
                              strokeDasharray={`${contract.financial_compliance}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="rpt-circle-label">{contract.financial_compliance}%</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="rpt-milestone-bar">
                        <div className="rpt-milestone-progress" style={{width: `${contract.milestone_completion}%`}}>
                          {contract.milestone_completion}%
                        </div>
                      </div>
                    </td>
                    <td>{getRiskBadge(contract.risk_score)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRiskExposure = () => {
    const atRiskContracts = contracts.filter(c => 
      c.risk_score === 'High' || 
      (c.milestone_completion < 70 && c.amount_spent / c.total_amount > 0.9) ||
      c.days_since_upload > 60
    );
    
    const totalExposure = atRiskContracts.reduce((sum, c) => sum + (c.total_amount || 0) * 0.3, 0);
    
    return (
      <div className="rpt-report-section">
        <div className="rpt-section-header">
          <div className="rpt-section-title">
            <Shield size={18} />
            <h3>Grant Risk Exposure Report</h3>
          </div>
          <div className="rpt-section-actions">
            <button 
              className="rpt-btn-small"
              onClick={() => exportToCSV('risk-exposure')}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="rpt-risk-summary">
          <div className="rpt-risk-stat">
            <span className="rpt-risk-stat-label">Grants at Risk</span>
            <span className="rpt-risk-stat-value">{atRiskContracts.length}</span>
          </div>
          <div className="rpt-risk-stat">
            <span className="rpt-risk-stat-label">Total Financial Exposure</span>
            <span className="rpt-risk-stat-value">{formatCurrency(totalExposure)}</span>
          </div>
          <div className="rpt-risk-stat">
            <span className="rpt-risk-stat-label">High Risk Grants</span>
            <span className="rpt-risk-stat-value">{atRiskContracts.filter(c => c.risk_score === 'High').length}</span>
          </div>
        </div>
        
        <div className="rpt-table-responsive">
          <table className="rpt-report-table">
            <thead>
              <tr>
                <th>Grant</th>
                <th>Risk Type</th>
                <th>Risk Level</th>
                <th>Financial Exposure</th>
                <th>Trigger</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {atRiskContracts.map(contract => {
                let riskType = 'Performance';
                let trigger = '';
                let action = '';
                
                if (contract.days_since_upload > 60) {
                  riskType = 'Inactivity';
                  trigger = 'No activity in 60+ days';
                  action = 'Contact grantee for status update';
                } else if (contract.milestone_completion < 70 && contract.amount_spent / contract.total_amount > 0.9) {
                  riskType = 'Financial';
                  trigger = 'Spend > 90% but milestone < 70%';
                  action = 'Review budget and timeline immediately';
                } else if (contract.risk_score === 'High') {
                  riskType = 'Compliance';
                  trigger = 'High risk score from assessment';
                  action = 'Schedule compliance review meeting';
                }
                
                return (
                  <tr key={contract.id} className={`rpt-risk-row rpt-risk-${contract.risk_score.toLowerCase()}`}>
                    <td className="rpt-grant-name">
                      <span className="rpt-name-link" onClick={() => navigate(`/contracts/${contract.id}`)}>
                        {contract.grant_name}
                      </span>
                    </td>
                    <td>{riskType}</td>
                    <td>{getRiskBadge(contract.risk_score)}</td>
                    <td className="rpt-amount">{formatCurrency(contract.total_amount * 0.3)}</td>
                    <td>{trigger}</td>
                    <td>
                      <span className="rpt-action-tag">{action}</span>
                    </td>
                  </tr>
                );
              })}
              {atRiskContracts.length === 0 && (
                <tr>
                  <td colSpan="6" className="rpt-empty-state">
                    <CheckCircle size={32} className="rpt-success-icon" />
                    <p>No grants at risk identified</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderExecutiveSnapshot = () => {
    const filtered = getFilteredContracts();
    
    return (
      <div className="rpt-report-section">
        <div className="rpt-section-header">
          <div className="rpt-section-title">
            <Briefcase size={18} />
            <h3>Executive Grant Snapshot</h3>
          </div>
          <div className="rpt-section-actions">
            <button 
              className="rpt-btn-small"
              onClick={() => exportToPDF('executive-snapshot')}
              disabled={exportLoading}
            >
              <Printer size={14} />
              {exportLoading ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
        </div>
        
        <div className="rpt-executive-grid">
          {filtered.slice(0, 6).map(contract => (
            <div 
              key={contract.id} 
              className={`rpt-executive-card ${selectedExecGrant === contract.id ? 'rpt-selected' : ''}`}
              onClick={() => setSelectedExecGrant(contract.id === selectedExecGrant ? null : contract.id)}
            >
              <div className="rpt-executive-header">
                <h4>{contract.grant_name}</h4>
                <span className="rpt-executive-grantor">{contract.grantor}</span>
              </div>
              
              <div className="rpt-executive-metrics">
                <div className="rpt-executive-metric">
                  <span className="rpt-metric-label">Total Value</span>
                  <span className="rpt-metric-value">{formatCurrency(contract.total_amount)}</span>
                </div>
                <div className="rpt-executive-metric">
                  <span className="rpt-metric-label">Progress</span>
                  <span className="rpt-metric-value">{contract.milestone_completion}%</span>
                </div>
                <div className="rpt-executive-metric">
                  <span className="rpt-metric-label">Financial Utilization</span>
                  <span className="rpt-metric-value">{((contract.amount_spent / contract.total_amount) * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="rpt-executive-footer">
                <div className="rpt-executive-deadline">
                  <Calendar size={14} />
                  <span>Next: {formatDate(contract.end_date)}</span>
                </div>
                <div className="rpt-executive-risk">
                  {getRiskBadge(contract.risk_score)}
                </div>
              </div>
              
              {selectedExecGrant === contract.id && (
                <div className="rpt-executive-details">
                  <div className="rpt-detail-row">
                    <span>Start Date:</span>
                    <span>{formatDate(contract.start_date)}</span>
                  </div>
                  <div className="rpt-detail-row">
                    <span>End Date:</span>
                    <span>{formatDate(contract.end_date)}</span>
                  </div>
                  <div className="rpt-detail-row">
                    <span>Amount Received:</span>
                    <span>{formatCurrency(contract.amount_received)}</span>
                  </div>
                  <div className="rpt-detail-row">
                    <span>Amount Spent:</span>
                    <span>{formatCurrency(contract.amount_spent)}</span>
                  </div>
                  <div className="rpt-detail-row">
                    <span>Project Manager:</span>
                    <span>{contract.pm_names}</span>
                  </div>
                  <div className="rpt-detail-row">
                    <span>Program Manager:</span>
                    <span>{contract.pgm_names}</span>
                  </div>
                  <div className="rpt-detail-row">
                    <span>Director:</span>
                    <span>{contract.director_names}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPortfolioDashboard = () => {
    const filtered = getFilteredContracts();
    
    const totalValue = filtered.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const onTrack = filtered.filter(c => c.milestone_completion > 70).length;
    const atRisk = filtered.filter(c => c.risk_score === 'High').length;
    const pendingApprovals = filtered.filter(c => ['under_review', 'reviewed'].includes(c.status)).length;
    const upcomingDeadlines = filtered.filter(c => {
      const days = getDaysRemaining(c.end_date);
      return days !== null && days <= 30 && days > 0;
    }).length;
    
    const avgMilestone = filtered.length ? 
      (filtered.reduce((sum, c) => sum + (c.milestone_completion || 0), 0) / filtered.length).toFixed(1) : 0;
    
    const totalReceived = filtered.reduce((sum, c) => sum + (c.amount_received || 0), 0);
    const totalSpent = filtered.reduce((sum, c) => sum + (c.amount_spent || 0), 0);
    
    return (
      <div className="rpt-report-section">
        <div className="rpt-section-header">
          <div className="rpt-section-title">
            <BarChart3 size={18} />
            <h3>Portfolio Dashboard Export</h3>
          </div>
          <div className="rpt-section-actions">
            <button 
              className="rpt-btn-small"
              onClick={() => exportToPDF('portfolio-dashboard')}
              disabled={exportLoading}
            >
              <Printer size={14} />
              {exportLoading ? 'Generating...' : 'Export PDF'}
            </button>
            <button 
              className="rpt-btn-small"
              onClick={() => exportToCSV('portfolio-dashboard')}
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="rpt-dashboard-grid">
          <div className="rpt-dashboard-card rpt-dashboard-summary">
            <h4>Portfolio Overview</h4>
            <div className="rpt-dashboard-stats">
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Total Grants</span>
                <span className="rpt-stat-number">{filtered.length}</span>
              </div>
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">On Track %</span>
                <span className="rpt-stat-number">{filtered.length ? ((onTrack/filtered.length)*100).toFixed(1) : 0}%</span>
              </div>
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Funds at Risk</span>
                <span className="rpt-stat-number">{formatCurrency(totalValue * 0.15)}</span>
              </div>
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Upcoming Deadlines</span>
                <span className="rpt-stat-number">{upcomingDeadlines}</span>
              </div>
            </div>
          </div>
          
          <div className="rpt-dashboard-card rpt-dashboard-financial">
            <h4>Financial Summary</h4>
            <div className="rpt-dashboard-stats">
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Total Value</span>
                <span className="rpt-stat-number">{formatCurrency(totalValue)}</span>
              </div>
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Received</span>
                <span className="rpt-stat-number">{formatCurrency(totalReceived)}</span>
              </div>
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Spent</span>
                <span className="rpt-stat-number">{formatCurrency(totalSpent)}</span>
              </div>
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Utilization</span>
                <span className="rpt-stat-number">{totalValue ? ((totalSpent/totalValue)*100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
          
          <div className="rpt-dashboard-card rpt-dashboard-risk">
            <h4>Risk & Compliance</h4>
            <div className="rpt-dashboard-stats">
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Grants at Risk</span>
                <span className="rpt-stat-number">{atRisk}</span>
              </div>
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Pending Approvals</span>
                <span className="rpt-stat-number">{pendingApprovals}</span>
              </div>
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Avg Milestone</span>
                <span className="rpt-stat-number">{avgMilestone}%</span>
              </div>
              <div className="rpt-dashboard-stat">
                <span className="rpt-stat-label">Avg Compliance</span>
                <span className="rpt-stat-number">
                  {filtered.length ? (filtered.reduce((sum, c) => sum + (c.reporting_compliance || 0), 0) / filtered.length).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="rpt-dashboard-card rpt-dashboard-timeline">
            <h4>Upcoming Deadlines (Next 30 Days)</h4>
            <div className="rpt-deadline-list">
              {filtered
                .filter(c => {
                  const days = getDaysRemaining(c.end_date);
                  return days !== null && days <= 30 && days > 0;
                })
                .slice(0, 5)
                .map(contract => (
                  <div key={contract.id} className="rpt-deadline-item">
                    <span className="rpt-deadline-name">{contract.grant_name}</span>
                    <span className="rpt-deadline-date">
                      {formatDate(contract.end_date)}
                      <span className="rpt-deadline-days">({getDaysRemaining(contract.end_date)} days)</span>
                    </span>
                  </div>
                ))}
              {upcomingDeadlines === 0 && (
                <div className="rpt-deadline-empty">No upcoming deadlines</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'active-tracker', label: 'Active Reports', icon: Activity },
    { id: 'pending-approvals', label: 'Pending Approvals', icon: Clock },
    { id: 'financial-summary', label: 'Financial Summary', icon: Wallet },
    { id: 'portfolio-health', label: 'Portfolio Health', icon: Gauge },
    { id: 'risk-exposure', label: 'Risk Exposure', icon: Shield },
    { id: 'executive-snapshot', label: 'Executive Snapshot', icon: Briefcase },
    { id: 'portfolio-dashboard', label: 'Portfolio Dashboard', icon: BarChart3 }
  ];

  return (
    <div className="rpt-reports-page">
      <div className="rpt-reports-header">
        <div className="rpt-header-left">
          <h1>Reports & Analytics</h1>
          <p className="rpt-subtitle">Comprehensive grant reporting and portfolio analysis</p>
        </div>
        <div className="rpt-header-right">
          <button className="rpt-btn-refresh" onClick={fetchAllContracts}>
            <RefreshCw size={16} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="rpt-reports-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`rpt-tab-btn ${activeTab === tab.id ? 'rpt-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Filters */}
      <div className="rpt-filters-section">
        <div className="rpt-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search grants..."
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
              <option value="published">Published</option>
              <option value="active">Active</option>
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

      {/* Report Content */}
      <div className="rpt-reports-content">
        {loading ? (
          <div className="rpt-loading-state">
            <RefreshCw className="rpt-spinner" size={32} />
            <p>Loading reports...</p>
          </div>
        ) : (
          <>
            {activeTab === 'active-tracker' && renderActiveTracker()}
            {activeTab === 'pending-approvals' && renderPendingApprovals()}
            {activeTab === 'financial-summary' && renderFinancialSummary()}
            {activeTab === 'portfolio-health' && renderPortfolioHealth()}
            {activeTab === 'risk-exposure' && renderRiskExposure()}
            {activeTab === 'executive-snapshot' && renderExecutiveSnapshot()}
            {activeTab === 'portfolio-dashboard' && renderPortfolioDashboard()}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;