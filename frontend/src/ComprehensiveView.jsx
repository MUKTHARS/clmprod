import React from 'react'

function ComprehensiveView({ contractData }) {
  if (!contractData || !contractData.comprehensive_data) {
    return (
      <div className="no-data">
        <h3>No comprehensive data available</h3>
        <p>Upload a PDF to see detailed extracted information</p>
      </div>
    )
  }

  const { comprehensive_data: data, filename, contract_id } = contractData
  
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const renderSection = (title, content) => (
    <div className="section">
      <h3 className="section-title">{title}</h3>
      <div className="section-content">
        {content}
      </div>
    </div>
  )

  const renderParty = (party, title) => (
    <div className="party-info">
      <h4>{title}</h4>
      <div className="party-details">
        <p><strong>Organization:</strong> {party?.organization_name || 'Not specified'}</p>
        <p><strong>Address:</strong> {party?.address || 'Not specified'}</p>
        <p><strong>Contact Person:</strong> {party?.contact_person || 'Not specified'}</p>
        <p><strong>Email:</strong> {party?.email || 'Not specified'}</p>
        <p><strong>Phone:</strong> {party?.phone || 'Not specified'}</p>
      </div>
    </div>
  )

  const renderArray = (array, title) => (
    array && array.length > 0 ? (
      <div className="array-section">
        <h4>{title}:</h4>
        <ul>
          {array.map((item, index) => (
            <li key={index}>{typeof item === 'object' ? JSON.stringify(item, null, 2) : item}</li>
          ))}
        </ul>
      </div>
    ) : null
  )

  const renderInstallments = (installments) => (
    installments && installments.length > 0 ? (
      <div className="installments">
        <h4>Payment Installments:</h4>
        <table className="installments-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((inst, idx) => (
              <tr key={idx}>
                <td>{inst.installment_number || idx + 1}</td>
                <td>{formatCurrency(inst.amount, data.financial_details?.currency)}</td>
                <td>{inst.due_date || 'Not specified'}</td>
                <td>{inst.trigger_condition || 'Not specified'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null
  )

  const renderMilestones = (milestones) => (
    milestones && milestones.length > 0 ? (
      <div className="milestones">
        <h4>Milestones:</h4>
        <table className="milestones-table">
          <thead>
            <tr>
              <th>Milestone</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Deliverable</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((ms, idx) => (
              <tr key={idx}>
                <td>{ms.milestone_name || `Milestone ${idx + 1}`}</td>
                <td>{formatCurrency(ms.amount, data.financial_details?.currency)}</td>
                <td>{ms.due_date || 'Not specified'}</td>
                <td>{ms.deliverable || 'Not specified'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null
  )

  const renderDeliverables = (deliverables) => (
    deliverables && deliverables.length > 0 ? (
      <div className="deliverables">
        <h4>Deliverables:</h4>
        <table className="deliverables-table">
          <thead>
            <tr>
              <th>Deliverable</th>
              <th>Description</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {deliverables.map((del, idx) => (
              <tr key={idx}>
                <td>{del.deliverable_name || `Deliverable ${idx + 1}`}</td>
                <td>{del.description || 'Not specified'}</td>
                <td>{del.due_date || 'Not specified'}</td>
                <td>{del.status || 'Pending'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null
  )

  return (
    <div className="comprehensive-view">
      <div className="view-header">
        <h2>Comprehensive Contract Analysis</h2>
        <div className="file-info">
          <span className="filename">{filename}</span>
          <span className="contract-id">ID: {contract_id}</span>
          {data.metadata?.extraction_confidence && (
            <span className="confidence">
              Confidence: {(data.metadata.extraction_confidence * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="extraction-content">
        {/* Executive Summary */}
        {renderSection("Executive Summary", 
          <div className="summary">
            <p>{data.summary?.executive_summary || "No summary available"}</p>
            <div className="summary-grid">
              <div className="summary-item">
                <strong>Key Dates:</strong>
                <p>{data.summary?.key_dates_summary || "No date information"}</p>
              </div>
              <div className="summary-item">
                <strong>Financial Summary:</strong>
                <p>{data.summary?.financial_summary || "No financial information"}</p>
              </div>
              <div className="summary-item">
                <strong>Risk Assessment:</strong>
                <p>{data.summary?.risk_assessment || "No risk assessment"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Details */}
        {renderSection("Contract Details",
          <div className="contract-details">
            <div className="details-grid">
              <div className="detail-item">
                <strong>Contract Number:</strong>
                <span>{data.contract_details?.contract_number || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <strong>Grant Name:</strong>
                <span>{data.contract_details?.grant_name || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <strong>Agreement Type:</strong>
                <span>{data.contract_details?.agreement_type || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <strong>Effective Date:</strong>
                <span>{data.contract_details?.effective_date || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <strong>Signature Date:</strong>
                <span>{data.contract_details?.signature_date || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <strong>Start Date:</strong>
                <span>{data.contract_details?.start_date || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <strong>End Date:</strong>
                <span>{data.contract_details?.end_date || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <strong>Duration:</strong>
                <span>{data.contract_details?.duration || 'Not specified'}</span>
              </div>
              <div className="detail-item full-width">
                <strong>Purpose:</strong>
                <p>{data.contract_details?.purpose || 'Not specified'}</p>
              </div>
              <div className="detail-item full-width">
                <strong>Scope of Work:</strong>
                <p>{data.contract_details?.scope_of_work || 'Not specified'}</p>
              </div>
              <div className="detail-item">
                <strong>Geographic Scope:</strong>
                <span>{data.contract_details?.geographic_scope || 'Not specified'}</span>
              </div>
            </div>
            {renderArray(data.contract_details?.objectives, "Objectives")}
          </div>
        )}

        {/* Parties Information */}
        {renderSection("Parties Information",
          <div className="parties-section">
            <div className="parties-grid">
              {renderParty(data.parties?.grantor, "Grantor (Funding Organization)")}
              {renderParty(data.parties?.grantee, "Grantee (Recipient Organization)")}
            </div>
            {data.parties?.other_parties && data.parties.other_parties.length > 0 && (
              <div className="other-parties">
                <h4>Other Parties Involved:</h4>
                <ul>
                  {data.parties.other_parties.map((party, idx) => (
                    <li key={idx}>
                      <strong>{party.role}:</strong> {party.name} - {party.details}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Financial Details */}
        {renderSection("Financial Details",
          <div className="financial-section">
            <div className="financial-overview">
              <div className="total-amount">
                <h4>Total Grant Amount:</h4>
                <p className="amount-display">
                  {formatCurrency(data.financial_details?.total_grant_amount, data.financial_details?.currency)}
                </p>
              </div>
              
              {data.financial_details?.budget_breakdown && (
                <div className="budget-breakdown">
                  <h4>Budget Breakdown:</h4>
                  <div className="budget-items">
                    {Object.entries(data.financial_details.budget_breakdown).map(([key, value]) => (
                      value !== null && (
                        <div key={key} className="budget-item">
                          <strong>{key.replace('_', ' ').toUpperCase()}:</strong>
                          <span>{formatCurrency(value, data.financial_details?.currency)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            {data.financial_details?.payment_schedule && (
              <div className="payment-schedule">
                <h4>Payment Schedule: {data.financial_details.payment_schedule.schedule_type || 'Not specified'}</h4>
                {renderInstallments(data.financial_details.payment_schedule.installments)}
                {renderMilestones(data.financial_details.payment_schedule.milestones)}
              </div>
            )}

            {data.financial_details?.financial_reporting_requirements && (
              <div className="reporting-requirements">
                <h4>Financial Reporting Requirements:</h4>
                <p>{data.financial_details.financial_reporting_requirements}</p>
              </div>
            )}
          </div>
        )}

        {/* Deliverables */}
        {renderSection("Deliverables & Reporting",
          <div className="deliverables-section">
            {renderDeliverables(data.deliverables?.items)}
            
            {data.deliverables?.reporting_requirements && (
              <div className="reporting-info">
                <h4>Reporting Requirements:</h4>
                <p><strong>Frequency:</strong> {data.deliverables.reporting_requirements.frequency || 'Not specified'}</p>
                {renderArray(data.deliverables.reporting_requirements.report_types, "Report Types")}
                {renderArray(data.deliverables.reporting_requirements.due_dates, "Due Dates")}
              </div>
            )}
          </div>
        )}

        {/* Terms & Conditions */}
        {renderSection("Terms & Conditions",
          <div className="terms-section">
            <div className="terms-grid">
              {data.terms_conditions?.intellectual_property && (
                <div className="term-item">
                  <strong>Intellectual Property:</strong>
                  <p>{data.terms_conditions.intellectual_property}</p>
                </div>
              )}
              {data.terms_conditions?.confidentiality && (
                <div className="term-item">
                  <strong>Confidentiality:</strong>
                  <p>{data.terms_conditions.confidentiality}</p>
                </div>
              )}
              {data.terms_conditions?.liability && (
                <div className="term-item">
                  <strong>Liability:</strong>
                  <p>{data.terms_conditions.liability}</p>
                </div>
              )}
              {data.terms_conditions?.termination_clauses && (
                <div className="term-item">
                  <strong>Termination Clauses:</strong>
                  <p>{data.terms_conditions.termination_clauses}</p>
                </div>
              )}
              {data.terms_conditions?.renewal_options && (
                <div className="term-item">
                  <strong>Renewal Options:</strong>
                  <p>{data.terms_conditions.renewal_options}</p>
                </div>
              )}
              {data.terms_conditions?.dispute_resolution && (
                <div className="term-item">
                  <strong>Dispute Resolution:</strong>
                  <p>{data.terms_conditions.dispute_resolution}</p>
                </div>
              )}
              {data.terms_conditions?.governing_law && (
                <div className="term-item">
                  <strong>Governing Law:</strong>
                  <p>{data.terms_conditions.governing_law}</p>
                </div>
              )}
              {data.terms_conditions?.force_majeure && (
                <div className="term-item">
                  <strong>Force Majeure:</strong>
                  <p>{data.terms_conditions.force_majeure}</p>
                </div>
              )}
            </div>
            {renderArray(data.terms_conditions?.key_obligations, "Key Obligations")}
            {renderArray(data.terms_conditions?.restrictions, "Restrictions")}
          </div>
        )}

        {/* Compliance */}
        {renderSection("Compliance Requirements",
          <div className="compliance-section">
            <div className="compliance-grid">
              {data.compliance?.audit_requirements && (
                <div className="compliance-item">
                  <strong>Audit Requirements:</strong>
                  <p>{data.compliance.audit_requirements}</p>
                </div>
              )}
              {data.compliance?.record_keeping && (
                <div className="compliance-item">
                  <strong>Record Keeping:</strong>
                  <p>{data.compliance.record_keeping}</p>
                </div>
              )}
              {data.compliance?.regulatory_compliance && (
                <div className="compliance-item">
                  <strong>Regulatory Compliance:</strong>
                  <p>{data.compliance.regulatory_compliance}</p>
                </div>
              )}
              {data.compliance?.ethics_requirements && (
                <div className="compliance-item">
                  <strong>Ethics Requirements:</strong>
                  <p>{data.compliance.ethics_requirements}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw JSON View (for debugging) */}
        <details className="raw-json">
          <summary>View Raw JSON Data</summary>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </details>
      </div>
    </div>
  )
}

export default ComprehensiveView