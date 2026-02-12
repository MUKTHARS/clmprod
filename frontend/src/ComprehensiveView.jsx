import React from 'react'
import './styles/ComprehensiveView.css'

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
    if (amount === null || amount === undefined || amount === '') return 'Not specified'
    if (typeof amount === 'string') {
      // Clean string amounts
      amount = amount.replace(/[^\d.-]/g, '')
    }
    try {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount)) return 'Invalid amount'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(numAmount)
    } catch (e) {
      return amount
    }
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

  // New function to render report types and due dates horizontally
  const renderReportRequirements = (reportingRequirements) => {
    if (!reportingRequirements) return null;
    
    const { frequency, report_types, due_dates, format_requirements, submission_method } = reportingRequirements;
    const [reportingEvents, setReportingEvents] = useState([]);
    // Find the maximum length between report_types and due_dates
    const maxLength = Math.max(
      report_types?.length || 0,
      due_dates?.length || 0
    );
    
    if (maxLength === 0) return null;
    
    return (
      <div className="reporting-info">
        <h4>Reporting Requirements:</h4>
        {frequency && (
          <p><strong>Frequency:</strong> {frequency}</p>
        )}
        
        {(report_types || due_dates) && (
          <div className="report-requirements-table">
            <table className="requirements-table">
              <thead>
                <tr>
                  {report_types && report_types.length > 0 && (
                    <th>Report Type</th>
                  )}
                  {due_dates && due_dates.length > 0 && (
                    <th>Due Date</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxLength }).map((_, index) => (
                  <tr key={index}>
                    {report_types && report_types.length > 0 && (
                      <td>{report_types[index] || 'N/A'}</td>
                    )}
                    {due_dates && due_dates.length > 0 && (
                      <td>{due_dates[index] || 'N/A'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {format_requirements && (
          <p><strong>Format Requirements:</strong> {format_requirements}</p>
        )}
        {submission_method && (
          <p><strong>Submission Method:</strong> {submission_method}</p>
        )}
      </div>
    );
  }

  const renderInstallments = (installments, currency = 'USD') => (
    installments && installments.length > 0 ? (
      <div className="installments">
        <h4>Payment Installments:</h4>
        <table className="installments-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Due Date</th>
              <th>Condition</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((inst, idx) => (
              <tr key={idx}>
                <td>{inst.installment_number || idx + 1}</td>
                <td>{formatCurrency(inst.amount, inst.currency || currency)}</td>
                <td>{inst.currency || currency}</td>
                <td>{inst.due_date || 'Not specified'}</td>
                <td>{inst.trigger_condition || 'Not specified'}</td>
                <td>{inst.description || 'Not specified'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null
  )

  const renderMilestones = (milestones, currency = 'USD') => (
    milestones && milestones.length > 0 ? (
      <div className="milestones">
        <h4>Milestones:</h4>
        <table className="milestones-table">
          <thead>
            <tr>
              <th>Milestone</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Due Date</th>
              <th>Deliverable</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((ms, idx) => (
              <tr key={idx}>
                <td>{ms.milestone_name || `Milestone ${idx + 1}`}</td>
                <td>{formatCurrency(ms.amount, ms.currency || currency)}</td>
                <td>{ms.currency || currency}</td>
                <td>{ms.due_date || 'Not specified'}</td>
                <td>{ms.deliverable || 'Not specified'}</td>
                <td>{ms.description || 'Not specified'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null
  )

  const renderReimbursements = (reimbursements, currency = 'USD') => (
    reimbursements && reimbursements.length > 0 ? (
      <div className="reimbursements">
        <h4>Reimbursements:</h4>
        <table className="reimbursements-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Conditions</th>
            </tr>
          </thead>
          <tbody>
            {reimbursements.map((reimb, idx) => (
              <tr key={idx}>
                <td>{reimb.category || `Reimbursement ${idx + 1}`}</td>
                <td>{formatCurrency(reimb.amount, reimb.currency || currency)}</td>
                <td>{reimb.currency || currency}</td>
                <td>{reimb.conditions || 'Not specified'}</td>
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
              <th>Linked Milestone</th>
            </tr>
          </thead>
          <tbody>
            {deliverables.map((del, idx) => (
              <tr key={idx}>
                <td>{del.deliverable_name || `Deliverable ${idx + 1}`}</td>
                <td>{del.description || 'Not specified'}</td>
                <td>{del.due_date || 'Not specified'}</td>
                <td>{del.status || 'Pending'}</td>
                <td>{del.milestone_linked || 'Not specified'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null
  )

  const renderAllDates = (allDates) => (
    allDates && allDates.length > 0 ? (
      <div className="all-dates-section">
        <h4>All Dates Found:</h4>
        <table className="dates-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Context</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {allDates.map((dateItem, idx) => (
              <tr key={idx}>
                <td>{dateItem.type || 'Not specified'}</td>
                <td>{dateItem.context || 'Not specified'}</td>
                <td>{dateItem.date || 'Not specified'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null
  )

  const renderAllAmounts = (allAmounts) => (
    allAmounts && allAmounts.length > 0 ? (
      <div className="all-amounts-section">
        <h4>All Amounts Found:</h4>
        <table className="amounts-table">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Currency</th>
              <th>Type</th>
              <th>Context</th>
            </tr>
          </thead>
          <tbody>
            {allAmounts.map((amountItem, idx) => (
              <tr key={idx}>
                <td>{formatCurrency(amountItem.amount, amountItem.currency)}</td>
                <td>{amountItem.currency || 'USD'}</td>
                <td>{amountItem.type || 'Not specified'}</td>
                <td>{amountItem.context || 'Not specified'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null
  )

  const renderAdditionalBudget = (additionalItems, currency = 'USD') => (
    additionalItems && additionalItems.length > 0 ? (
      <div className="additional-budget-section">
        <h4>Additional Budget Items:</h4>
        <table className="additional-budget-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {additionalItems.map((item, idx) => (
              <tr key={idx}>
                <td>{item.category || `Item ${idx + 1}`}</td>
                <td>{formatCurrency(item.amount, currency)}</td>
                <td>{item.description || 'Not specified'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : null
  )

  // New function to render detailed deliverables
  const renderDetailedDeliverables = (detailedDeliverables) => {
    if (!detailedDeliverables) return null
    
    const {
      project_deliverables_summary,
      deliverable_items,
      milestone_deliverables,
      reporting_deliverables,
      documentation_deliverables,
      technical_deliverables,
      training_deliverables,
      quality_deliverables,
      delivery_schedule,
      acceptance_criteria,
      delivery_methods
    } = detailedDeliverables
    
    const hasDeliverableItems = deliverable_items && deliverable_items.length > 0
    const hasMilestoneDeliverables = milestone_deliverables && milestone_deliverables.length > 0
    const hasDeliverySchedule = delivery_schedule && delivery_schedule.length > 0
    const hasAnyData = project_deliverables_summary || hasDeliverableItems || hasMilestoneDeliverables || 
                      hasDeliverySchedule || acceptance_criteria?.length > 0
    
    if (!hasAnyData) return null
    
    return (
      <div className="section detailed-deliverables-section">
        <h3 className="section-title">Detailed Project Deliverables</h3>
        
        {/* Project Deliverables Summary */}
        {project_deliverables_summary && (
          <div className="deliverables-summary">
            <p><strong>Summary:</strong> {project_deliverables_summary}</p>
          </div>
        )}
        
        {/* Main Deliverable Items */}
        {hasDeliverableItems && (
          <div className="deliverable-items-section">
            <h4>Key Deliverables</h4>
            <div className="deliverables-grid">
              {deliverable_items.map((item, idx) => (
                <div key={idx} className="deliverable-card">
                  <div className="deliverable-header">
                    <h5>{item.deliverable_name}</h5>
                    {item.deliverable_type && (
                      <span className={`deliverable-type ${item.deliverable_type.toLowerCase().replace(/\s+/g, '-')}`}>
                        {item.deliverable_type}
                      </span>
                    )}
                  </div>
                  <div className="deliverable-body">
                    {item.description && (
                      <p><strong>Description:</strong> {item.description}</p>
                    )}
                    {item.due_date && (
                      <p><strong>Due Date:</strong> {item.due_date}</p>
                    )}
                    {item.format && item.format !== 'Not specified' && (
                      <p><strong>Format:</strong> {item.format}</p>
                    )}
                    {item.acceptance_criteria && item.acceptance_criteria !== 'Not specified' && (
                      <p><strong>Acceptance Criteria:</strong> {item.acceptance_criteria}</p>
                    )}
                    {item.quality_requirements && item.quality_requirements.length > 0 && (
                      <div className="quality-requirements">
                        <strong>Quality Requirements:</strong>
                        <ul>
                          {item.quality_requirements.map((req, reqIdx) => (
                            <li key={reqIdx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Milestone Deliverables */}
        {hasMilestoneDeliverables && (
          <div className="milestone-deliverables-section">
            <h4>Milestone-Based Deliverables</h4>
            <div className="milestone-table">
              <table>
                <thead>
                  <tr>
                    <th>Milestone</th>
                    <th>Deliverable</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {milestone_deliverables.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.milestone}</td>
                      <td>{item.deliverable}</td>
                      <td>{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Reporting Deliverables */}
        {reporting_deliverables && reporting_deliverables.length > 0 && (
          <div className="reporting-deliverables-section">
            <h4>Reporting Deliverables</h4>
            <ul>
              {reporting_deliverables.map((deliverable, idx) => (
                <li key={idx}>{deliverable}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Documentation Deliverables */}
        {documentation_deliverables && documentation_deliverables.length > 0 && (
          <div className="documentation-deliverables-section">
            <h4>Documentation Deliverables</h4>
            <ul>
              {documentation_deliverables.map((deliverable, idx) => (
                <li key={idx}>{deliverable}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Technical Deliverables */}
        {technical_deliverables && technical_deliverables.length > 0 && (
          <div className="technical-deliverables-section">
            <h4>Technical Deliverables</h4>
            <ul>
              {technical_deliverables.map((deliverable, idx) => (
                <li key={idx}>{deliverable}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Training Deliverables */}
        {training_deliverables && training_deliverables.length > 0 && (
          <div className="training-deliverables-section">
            <h4>Training Deliverables</h4>
            <ul>
              {training_deliverables.map((deliverable, idx) => (
                <li key={idx}>{deliverable}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Quality Deliverables */}
        {quality_deliverables && quality_deliverables.length > 0 && (
          <div className="quality-deliverables-section">
            <h4>Quality Deliverables</h4>
            <ul>
              {quality_deliverables.map((deliverable, idx) => (
                <li key={idx}>{deliverable}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Delivery Schedule */}
        {hasDeliverySchedule && (
          <div className="delivery-schedule-section">
            <h4>Delivery Schedule</h4>
            <ul>
              {delivery_schedule.map((schedule, idx) => (
                <li key={idx}>{schedule}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Acceptance Criteria */}
        {acceptance_criteria && acceptance_criteria.length > 0 && (
          <div className="acceptance-criteria-section">
            <h4>Acceptance Criteria</h4>
            <ul>
              {acceptance_criteria.map((criteria, idx) => (
                <li key={idx}>{criteria}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Delivery Methods */}
        {delivery_methods && delivery_methods.length > 0 && (
          <div className="delivery-methods-section">
            <h4>Delivery Methods</h4>
            <ul>
              {delivery_methods.map((method, idx) => (
                <li key={idx}>{method}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="comprehensive-view">
      <div className="view-header">
        <h2>Comprehensive Contract Analysis</h2>
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
              {data.summary?.total_contract_value && (
                <div className="summary-item">
                  <strong>Total Contract Value:</strong>
                  <p>{data.summary.total_contract_value}</p>
                </div>
              )}
              {data.summary?.payment_timeline_summary && (
                <div className="summary-item">
                  <strong>Payment Timeline:</strong>
                  <p>{data.summary.payment_timeline_summary}</p>
                </div>
              )}
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
              <div className="detail-item">
                <strong>Grant Reference:</strong>
                <span>{data.contract_details?.grant_reference || 'Not specified'}</span>
              </div>
              <div className="detail-item full-width">
                <strong>Purpose:</strong>
                <p>{data.contract_details?.purpose || 'Not specified'}</p>
              </div>
              <div className="detail-item">
                <strong>Geographic Scope:</strong>
                <span>{data.contract_details?.geographic_scope || 'Not specified'}</span>
              </div>
            </div>
            {renderArray(data.contract_details?.objectives, "Objectives")}
          </div>
        )}

        {/* Detailed Scope of Work */}
        {data.contract_details?.detailed_scope_of_work && (
          <div className="section detailed-scope-section">
            <h3 className="section-title">Scope of Work</h3>
            
            {data.contract_details.detailed_scope_of_work.project_description && (
              <div className="scope-subsection">
                <h4>Project Description</h4>
                <p>{data.contract_details.detailed_scope_of_work.project_description}</p>
              </div>
            )}
            
            {data.contract_details.detailed_scope_of_work.main_activities && 
             data.contract_details.detailed_scope_of_work.main_activities.length > 0 && (
              <div className="scope-subsection">
                <h4>Main Activities</h4>
                <ul>
                  {data.contract_details.detailed_scope_of_work.main_activities.map((activity, idx) => (
                    <li key={idx}>{activity}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.contract_details.detailed_scope_of_work.deliverables_list && 
             data.contract_details.detailed_scope_of_work.deliverables_list.length > 0 && (
              <div className="scope-subsection">
                <h4>Deliverables</h4>
                <ul>
                  {data.contract_details.detailed_scope_of_work.deliverables_list.map((deliverable, idx) => (
                    <li key={idx}>{deliverable}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.contract_details.detailed_scope_of_work.tasks_and_responsibilities && 
             data.contract_details.detailed_scope_of_work.tasks_and_responsibilities.length > 0 && (
              <div className="scope-subsection">
                <h4>Tasks and Responsibilities</h4>
                <ul>
                  {data.contract_details.detailed_scope_of_work.tasks_and_responsibilities.map((task, idx) => (
                    <li key={idx}>{task}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.contract_details.detailed_scope_of_work.timeline_phases && 
             data.contract_details.detailed_scope_of_work.timeline_phases.length > 0 && (
              <div className="scope-subsection">
                <h4>Timeline Phases</h4>
                <ul>
                  {data.contract_details.detailed_scope_of_work.timeline_phases.map((phase, idx) => (
                    <li key={idx}>{phase}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.contract_details.detailed_scope_of_work.technical_requirements && 
             data.contract_details.detailed_scope_of_work.technical_requirements.length > 0 && (
              <div className="scope-subsection">
                <h4>Technical Requirements</h4>
                <ul>
                  {data.contract_details.detailed_scope_of_work.technical_requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.contract_details.detailed_scope_of_work.performance_standards && 
             data.contract_details.detailed_scope_of_work.performance_standards.length > 0 && (
              <div className="scope-subsection">
                <h4>Performance Standards</h4>
                <ul>
                  {data.contract_details.detailed_scope_of_work.performance_standards.map((standard, idx) => (
                    <li key={idx}>{standard}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.contract_details.detailed_scope_of_work.work_breakdown_structure && 
             data.contract_details.detailed_scope_of_work.work_breakdown_structure.length > 0 && (
              <div className="scope-subsection">
                <h4>Work Breakdown Structure</h4>
                <ul>
                  {data.contract_details.detailed_scope_of_work.work_breakdown_structure.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.contract_details.detailed_scope_of_work.key_milestones && 
             data.contract_details.detailed_scope_of_work.key_milestones.length > 0 && (
              <div className="scope-subsection">
                <h4>Key Milestones</h4>
                <ul>
                  {data.contract_details.detailed_scope_of_work.key_milestones.map((milestone, idx) => (
                    <li key={idx}>{milestone}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.contract_details.detailed_scope_of_work.resources_required && 
             data.contract_details.detailed_scope_of_work.resources_required.length > 0 && (
              <div className="scope-subsection">
                <h4>Resources Required</h4>
                <ul>
                  {data.contract_details.detailed_scope_of_work.resources_required.map((resource, idx) => (
                    <li key={idx}>{resource}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.contract_details.detailed_scope_of_work.assumptions_and_constraints && 
             data.contract_details.detailed_scope_of_work.assumptions_and_constraints.length > 0 && (
              <div className="scope-subsection">
                <h4>Assumptions and Constraints</h4>
                <ul>
                  {data.contract_details.detailed_scope_of_work.assumptions_and_constraints.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
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
                {data.financial_details?.currency && (
                  <p><strong>Currency:</strong> {data.financial_details.currency}</p>
                )}
                {data.financial_details?.additional_currencies && data.financial_details.additional_currencies.length > 0 && (
                  <p><strong>Additional Currencies:</strong> {data.financial_details.additional_currencies.join(', ')}</p>
                )}
              </div>
              
              {data.financial_details?.budget_breakdown && (
                <div className="budget-breakdown">
                  <h4>Budget Breakdown:</h4>
                  <div className="budget-items">
                    {Object.entries(data.financial_details.budget_breakdown).map(([key, value]) => (
                      value !== null && value !== undefined && (
                        <div key={key} className="budget-item">
                          <strong>{key.replace('_', ' ').toUpperCase()}:</strong>
                          <span>
                            {typeof value === 'number' 
                              ? formatCurrency(value, data.financial_details?.currency) 
                              : value}
                          </span>
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
                {data.financial_details.payment_terms && (
                  <p><strong>Payment Terms:</strong> {data.financial_details.payment_terms}</p>
                )}
                {renderInstallments(data.financial_details.payment_schedule.installments, data.financial_details?.currency)}
                {renderMilestones(data.financial_details.payment_schedule.milestones, data.financial_details?.currency)}
                {renderReimbursements(data.financial_details.payment_schedule.reimbursements, data.financial_details?.currency)}
                
                {/* Financial Totals */}
                {(data.financial_details.total_installments_amount || data.financial_details.total_milestones_amount) && (
                  <div className="financial-totals">
                    <h4>Financial Totals:</h4>
                    <div className="totals-grid">
                      {data.financial_details.total_installments_amount && (
                        <div className="total-item">
                          <strong>Total Installments:</strong>
                          <span>{formatCurrency(data.financial_details.total_installments_amount, data.financial_details?.currency)}</span>
                        </div>
                      )}
                      {data.financial_details.total_milestones_amount && (
                        <div className="total-item">
                          <strong>Total Milestones:</strong>
                          <span>{formatCurrency(data.financial_details.total_milestones_amount, data.financial_details?.currency)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {data.financial_details?.additional_budget_items && data.financial_details.additional_budget_items.length > 0 && (
              renderAdditionalBudget(data.financial_details.additional_budget_items, data.financial_details?.currency)
            )}

            {data.financial_details?.financial_reporting_requirements && (
              <div className="reporting-requirements">
                <h4>Financial Reporting Requirements:</h4>
                <p>{data.financial_details.financial_reporting_requirements}</p>
              </div>
            )}

            {data.financial_details?.financial_tables_summary && (
              <div className="tables-summary">
                <h4>Financial Tables Summary:</h4>
                <p>{data.financial_details.financial_tables_summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Detailed Deliverables Section - NEW */}
        {data.deliverables?.detailed_deliverables && (
          renderDetailedDeliverables(data.deliverables.detailed_deliverables)
        )}

        {/* Deliverables (Original) */}
        {renderSection("Project Deliverables",
          <div className="deliverables-section">
            {renderDeliverables(data.deliverables?.items)}
            

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

        {/* Extended Data */}
        {data.extended_data && (
          renderSection("Detailed Extraction Analysis",
            <div className="extended-data-section">
              {renderAllDates(data.extended_data.all_dates_found)}
              {renderAllAmounts(data.extended_data.all_amounts_found)}
              
              {data.extended_data.table_data_extracted && data.extended_data.table_data_extracted.length > 0 && (
                <div className="table-data-extracted">
                  <h4>Tables Extracted:</h4>
                  {data.extended_data.table_data_extracted.map((table, idx) => (
                    <div key={idx} className="table-item">
                      <strong>Table Type: {table.table_type || 'Unknown'}</strong>
                      <pre className="table-data-pre">
                        {typeof table.data === 'string' 
                          ? table.data 
                          : JSON.stringify(table.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* Raw JSON View (for debugging) */}
        {/* <details className="raw-json">
          <summary>View Raw JSON Data</summary>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </details> */}
      </div>
    </div>
  )
}

export default ComprehensiveView