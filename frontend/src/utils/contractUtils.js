export const normalizeContract = (contract) => {
  if (!contract) return null;
  
  // If contract already has basic fields, return as is
  if (contract.grant_name || contract.grantor || contract.total_amount) {
    return contract;
  }
  
  // Try to extract from comprehensive_data
  if (contract.comprehensive_data) {
    const compData = contract.comprehensive_data;
    const contractDetails = compData.contract_details || {};
    const parties = compData.parties || {};
    const financial = compData.financial_details || {};
    
    return {
      ...contract,
      grant_name: contractDetails.grant_name || contract.filename || 'Unnamed Contract',
      grantor: parties.grantor?.organization_name || 'Unknown Grantor',
      grantee: parties.grantee?.organization_name || 'Unknown Grantee',
      total_amount: financial?.total_grant_amount || contract.total_amount || 0,
      contract_number: contractDetails.contract_number || contract.contract_number,
      start_date: contractDetails.start_date || contract.start_date,
      end_date: contractDetails.end_date || contract.end_date,
      purpose: contractDetails.purpose || contract.purpose,
      status: contract.status || 'processed',
      // Include reference IDs from database
      investment_id: contract.investment_id,
      project_id: contract.project_id,
      grant_id: contract.grant_id,
      comprehensive_data: compData
    };
  }
  
  // Fallback to direct database fields
  return {
    ...contract,
    grant_name: contract.grant_name || contract.filename || 'Unnamed Contract',
    grantor: contract.grantor || 'Unknown Grantor',
    total_amount: contract.total_amount || 0,
    status: contract.status || 'unknown'
  };
};

export const extractContractField = (contract, field) => {
  const normalized = normalizeContract(contract);
  return normalized ? normalized[field] : null;
};