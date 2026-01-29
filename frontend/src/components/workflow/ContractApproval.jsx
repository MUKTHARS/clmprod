import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  User,
  Calendar,
  FileText,
  AlertCircle,
  ChevronRight,
  Eye,
  Download,
  Send,
  History,
  Shield
} from 'lucide-react';

function ContractApproval() {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [comment, setComment] = useState('');
  const [decision, setDecision] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContractsForApproval();
  }, []);

  const fetchContractsForApproval = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://44.219.56.85:4001/api/contracts/status/reviewed', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    }
  };

  const handleFinalApproval = async () => {
    if (!selectedContract || !decision || !comment) {
      alert('Please select a decision and provide comments');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://44.219.56.85:4001/api/contracts/${selectedContract.id}/final-approval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision,
          comments: comment
        })
      });

      if (response.ok) {
        alert('Final decision submitted successfully');
        fetchContractsForApproval();
        setSelectedContract(null);
        setComment('');
        setDecision('');
      } else {
        const error = await response.json();
        alert(`Failed to submit decision: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to submit decision:', error);
      alert('Failed to submit decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workflow-container">
      <div className="workflow-header">
        <Shield size={32} />
        <h1>Final Approval</h1>
        <p>Review and provide final approval for contracts</p>
      </div>

      {/* Similar structure to ContractReview but with final approval options */}
      {/* Implementation similar to ContractReview component */}
    </div>
  );
}

export default ContractApproval;