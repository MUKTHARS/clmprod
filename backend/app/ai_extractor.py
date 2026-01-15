import openai
import json
from typing import Dict, Any
from app.config import settings
import os

# Apply proxy fix at module level
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import and apply the patch
try:
    from openai_patch import *
except ImportError:
    # If patch doesn't exist, manually clean proxy env vars
    for var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']:
        os.environ.pop(var, None)

class AIExtractor:
    def __init__(self):
        # Clean environment
        self._clean_environment()
        
        # Set API key
        self.api_key = settings.OPENAI_API_KEY
        
        # Initialize client with minimal configuration
        self.client = self._create_openai_client()
        
        # Enhanced prompt for comprehensive extraction
        # Enhanced prompt for comprehensive extraction with focus on tables
        
        self.extraction_prompt = """ANALYZE THIS GRANT CONTRACT THOROUGHLY AND EXTRACT ALL INFORMATION.
    
        CRITICAL - EXTRACT THESE SPECIFIC FIELDS THAT ARE OFTEN MISSED:

        1. RISK MANAGEMENT: Extract ALL risk-related clauses including:
           - Risk assessment procedures
           - Risk mitigation strategies
           - Risk allocation between parties
           - Insurance requirements
           - Risk reporting obligations

        2. SCOPE OF WORK: Extract the complete scope including:
           - Detailed project description
           - Specific tasks and activities
           - Deliverables and outputs
           - Performance standards
           - Technical specifications
           - Work breakdown structure if available

        3. GRANT REFERENCE: Look for ALL reference numbers including:
           - Grant reference numbers
           - Award numbers
           - Project codes
           - Application numbers
           - File numbers
           - Any alphanumeric identifiers starting with: GR, G, AW, PRJ, REF

        4. REPORTING REQUIREMENTS: Extract ALL reporting obligations:
           - Report types (progress, financial, technical, final)
           - Reporting frequency (monthly, quarterly, annually)
           - Specific due dates for reports
           - Report formats and templates required
           - Submission methods and recipients

        5. CONFIDENTIALITY: Extract ALL confidentiality clauses:
           - Non-disclosure agreements
           - Confidential information definition
           - Duration of confidentiality
           - Exceptions to confidentiality
           - Return/destruction of confidential materials

        6. RENEWAL OPTIONS: Extract ALL renewal/extension terms:
           - Automatic renewal clauses
           - Option to renew/extend
           - Renewal procedures and deadlines
           - Conditions for renewal
           - Renewal terms and duration

        7. DISPUTE RESOLUTION: Extract ALL dispute mechanisms:
           - Negotiation/mediation procedures
           - Arbitration clauses (location, rules, language)
           - Litigation provisions
           - Jurisdiction and venue
           - Escalation procedures
           - Expert determination clauses

        8. GOVERNING LAW: Extract ALL legal framework details:
           - Applicable law (country, state)
           - Legal system specified
           - Choice of law clauses
           - International law references if any

        9. FORCE MAJEURE: Extract ALL force majeure clauses:
           - Definition of force majeure events
           - Specific events listed (natural disasters, war, etc.)
           - Notification requirements
           - Consequences (suspension, termination, extension)
           - Mitigation obligations

        10. SIGNATURE DATES & SIGNATORIES: Extract ALL signature information:
            - Date of signing (may be different from effective date)
            - Names and titles of all signatories
            - Signatory authority details
            - Witness information if present
            - Multiple signature dates if parties sign separately

        11. OBJECTIVES: Extract ALL project objectives including:
            - Primary objectives
            - Secondary objectives
            - SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound)
            - Program goals
            - Expected outcomes and impacts

        12. ADDITIONAL FIELD - KEY DATES: Also extract:
            - Proposal submission date
            - Approval date
            - Notification date
            - Commencement date
            - Any other milestone dates mentioned

        PAY SPECIAL ATTENTION TO:
        - Look in headers, footers, signature blocks, and appendices
        - Extract even if information is spread across multiple sections
        - Include partial information if complete info not available
        - Use "See attached" or "Refer to Appendix" if referenced elsewhere
        - Extract ALL dates in any format and convert to YYYY-MM-DD

        Return ONLY valid JSON in this exact format:
        {{
        "metadata": {{
            "document_type": "string",
            "extraction_confidence": "number",
            "pages_extracted_from": "number",
            "extraction_timestamp": "string"
        }},
        "parties": {{
            "grantor": {{
            "organization_name": "string",
            "address": "string",
            "contact_person": "string",
            "email": "string",
            "phone": "string",
            "signatory_name": "string",
            "signatory_title": "string",
            "signature_date": "string"
            }},
            "grantee": {{
            "organization_name": "string",
            "address": "string",
            "contact_person": "string",
            "email": "string",
            "phone": "string",
            "signatory_name": "string",
            "signatory_title": "string",
            "signature_date": "string"
            }},
            "other_parties": [
            {{
                "role": "string",
                "name": "string",
                "details": "string",
                "signatory_name": "string",
                "signature_date": "string"
            }}
            ]
        }},
        "contract_details": {{
            "contract_number": "string",
            "grant_name": "string",
            "grant_reference": "string",
            "agreement_type": "string",
            "effective_date": "string",
            "signature_date": "string",
            "start_date": "string",
            "end_date": "string",
            "duration": "string",
            "purpose": "string",
            "objectives": ["array of strings"],
            "scope_of_work": "string",
            "geographic_scope": "string",
            "risk_management": "string",
            "key_dates": {{
            "proposal_submission_date": "string",
            "approval_date": "string",
            "notification_date": "string"
            }}
        }},
        "financial_details": {{"existing structure..."}},
        "deliverables": {{
            "items": [
            {{
                "deliverable_name": "string",
                "description": "string",
                "due_date": "string",
                "status": "string",
                "milestone_linked": "string"
            }}
            ],
            "reporting_requirements": {{
            "frequency": "string",
            "report_types": ["array"],
            "due_dates": ["array"],
            "format_requirements": "string",
            "submission_method": "string"
            }}
        }},
        "terms_conditions": {{
            "intellectual_property": "string",
            "confidentiality": "string",
            "liability": "string",
            "termination_clauses": "string",
            "renewal_options": "string",
            "dispute_resolution": "string",
            "governing_law": "string",
            "force_majeure": "string",
            "key_obligations": ["array"],
            "restrictions": ["array"]
        }},
        "compliance": {{
            "audit_requirements": "string",
            "record_keeping": "string",
            "regulatory_compliance": "string",
            "ethics_requirements": "string"
        }},
        "summary": {{
            "executive_summary": "string",
            "key_dates_summary": "string",
            "financial_summary": "string",
            "risk_assessment": "string",
            "total_contract_value": "string",
            "payment_timeline_summary": "string"
        }},
        "extended_data": {{
            "all_dates_found": [
            {{
                "date": "string",
                "context": "string",
                "type": "string"
            }}
            ],
            "all_amounts_found": [
            {{
                "amount": "number",
                "currency": "string",
                "context": "string",
                "type": "string"
            }}
            ],
            "table_data_extracted": [
            {{
                "table_type": "string",
                "data": "string"
            }}
            ],
            "signatures_found": [
            {{
                "name": "string",
                "title": "string",
                "organization": "string",
                "date": "string",
                "context": "string"
            }}
            ]
        }}
        }}


        CRITICAL INSTRUCTIONS FOR MISSING FIELDS:
        
        1. FOR TERMS & CONDITIONS: Extract ALL legal clauses including:
           - Intellectual Property rights and ownership
           - Confidentiality obligations and NDAs
           - Liability and indemnification clauses
           - Termination conditions and procedures
           - Dispute resolution methods (arbitration, mediation, etc.)
           - Governing law and jurisdiction
           - Force majeure provisions
           - Any restrictions or limitations

        2. FOR COMPLIANCE: Extract ALL compliance requirements:
           - Audit rights and procedures
           - Record keeping requirements
           - Regulatory compliance obligations
           - Ethics and code of conduct requirements

        3. FOR CONTRACT NAME: If "grant_name" is not explicitly stated, look for:
           - Document titles at the beginning
           - "This Agreement" followed by a description
           - Project names or initiative names
           - Funding program names

        4. ALWAYS include these sections even if partially empty. Use "Not specified" for missing information.


        IMPORTANT: FOCUS ON EXTRACTING TABULAR DATA FROM FINANCIAL TABLES, PAYMENT SCHEDULES, AND BUDGETS.

        SPECIFIC INSTRUCTIONS:
        1. EXTRACT ALL DATES IN ANY FORMAT - convert to YYYY-MM-DD format
        2. EXTRACT ALL MONETARY AMOUNTS - look for currency symbols
        3. PAY SPECIAL ATTENTION TO TABLES - extract every row and column
        4. For tables with installments: extract installment number, due date, amount, description
        5. For budget tables: extract each budget category and amount

        Return ONLY valid JSON in this exact format:
        {{"metadata": {{"document_type": "string", "extraction_confidence": "number", "pages_extracted_from": "number", "extraction_timestamp": "string"}},
        "parties": {{"grantor": {{"organization_name": "string", "address": "string", "contact_person": "string", "email": "string", "phone": "string"}},
        "grantee": {{"organization_name": "string", "address": "string", "contact_person": "string", "email": "string", "phone": "string"}},
        "other_parties": [{{"role": "string", "name": "string", "details": "string"}}]}},
        "contract_details": {{"contract_number": "string", "grant_name": "string", "grant_reference": "string", "agreement_type": "string", "effective_date": "string", "signature_date": "string", "start_date": "string", "end_date": "string", "duration": "string", "purpose": "string", "objectives": ["array"], "scope_of_work": "string", "geographic_scope": "string"}},
        "financial_details": {{"total_grant_amount": "number", "currency": "string", "additional_currencies": ["array"],
        "payment_schedule": {{"schedule_type": "string", "installments": [{{"installment_number": "number", "amount": "number", "due_date": "string", "trigger_condition": "string", "description": "string", "currency": "string"}}], "milestones": [{{"milestone_name": "string", "amount": "number", "due_date": "string", "deliverable": "string", "description": "string"}}], "reimbursements": [{{"category": "string", "amount": "number", "conditions": "string"}}]}},
        "budget_breakdown": {{"personnel": "number", "equipment": "number", "travel": "string", "materials": "number", "indirect_costs": "number", "other": "number", "contingency": "number", "overhead": "number", "subcontractors": "number"}},
        "additional_budget_items": [{{"category": "string", "amount": "number", "description": "string"}}],
        "financial_reporting_requirements": "string",
        "financial_tables_summary": "string",
        "total_installments_amount": "number",
        "total_milestones_amount": "number",
        "payment_terms": "string"}},
        "deliverables": {{"items": [{{"deliverable_name": "string", "description": "string", "due_date": "string", "status": "string", "milestone_linked": "string"}}],
        "reporting_requirements": {{"frequency": "string", "report_types": ["array"], "due_dates": ["array"]}}}},
        "terms_conditions": {{"intellectual_property": "string", "confidentiality": "string", "liability": "string", "termination_clauses": "string", "renewal_options": "string", "dispute_resolution": "string", "governing_law": "string", "force_majeure": "string", "key_obligations": ["array"], "restrictions": ["array"]}},
        "compliance": {{"audit_requirements": "string", "record_keeping": "string", "regulatory_compliance": "string", "ethics_requirements": "string"}},
        "summary": {{"executive_summary": "string", "key_dates_summary": "string", "financial_summary": "string", "risk_assessment": "string", "total_contract_value": "string", "payment_timeline_summary": "string"}},
        "extended_data": {{"all_dates_found": [{{"date": "string", "context": "string", "type": "string"}}], "all_amounts_found": [{{"amount": "number", "currency": "string", "context": "string", "type": "string"}}], "table_data_extracted": [{{"table_type": "string", "data": "string"}}]}}}}

        Contract text (including all tables):
        {text}"""
    
    def _clean_environment(self):
        """Clean proxy environment variables"""
        proxy_vars = [
            'HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy',
            'ALL_PROXY', 'all_proxy', 'NO_PROXY', 'no_proxy'
        ]
        for var in proxy_vars:
            if var in os.environ:
                del os.environ[var]
    
    def _create_openai_client(self):
        """Create OpenAI client without proxy issues"""
        try:
            return openai.OpenAI(
                api_key=self.api_key,
                timeout=60.0  # Increased timeout for comprehensive extraction
            )
        except Exception as e:
            print(f"Client creation failed: {e}")
            os.environ['OPENAI_API_KEY'] = self.api_key
            return openai.OpenAI()
    
    def extract_contract_data(self, text: str) -> Dict[str, Any]:
        """Extract comprehensive structured data from contract text with focus on tables"""
        try:
            # Check API key
            if not self.api_key or self.api_key == "your-openai-api-key-here":
                print("ERROR: Please set OPENAI_API_KEY in .env file")
                return self._get_empty_result()
            
            # Pre-process text to highlight tables
            # Look for table markers in the text
            table_markers = ["=== TABLES ===", "Table", "Schedule", "Payment", "Budget", "Milestone"]
            has_tables = any(marker in text for marker in table_markers)
            
            # Add context about tables if found
            if has_tables:
                print("Detected tables in text, extracting with special attention...")
            
            # Use gpt-4o-mini for comprehensive extraction
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": """You are a highly experienced contract analyst specializing in financial contract analysis.
                        Your task is to extract EVERY piece of financial information, dates, and amounts from contracts.

                        CRITICAL: DO NOT MISS THESE FIELDS:
                        1. Risk Management clauses
                        2. Scope of Work (detailed description)
                        3. Grant Reference numbers
                        4. Reporting Requirements (frequency, types, due dates)
                        5. Confidentiality provisions
                        6. Renewal Options
                        7. Dispute Resolution mechanisms
                        8. Governing Law
                        9. Force Majeure clauses
                        10. Signature Dates and Signatories
                        11. Project Objectives
                        
                        For dates: extract ALL dates in any format and convert to YYYY-MM-DD when possible.
                        For amounts: extract ALL amounts with their currencies.
                        For signatures: extract names, titles, and dates from signature blocks.

                        PAY SPECIAL ATTENTION TO TABLES - extract all rows, columns, and data from any tables you find.
                        For financial data: extract ALL amounts with their currencies.
                        For dates: extract ALL dates in any format and convert to YYYY-MM-DD when possible.
                        Be extremely thorough with ALL sections, not just financial data.
                        Be extremely thorough with numerical data and dates."""
                    },
                    {
                        "role": "user", 
                        "content": self.extraction_prompt.format(text=text[:15000])  # Increased limit for table data
                    }
                ],
                temperature=0.1,  # Lower temperature for more consistent extraction
                response_format={"type": "json_object"},
                max_tokens=6000  # Increased for comprehensive table extraction
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Add timestamp if not present
            import datetime
            if "metadata" in result and "extraction_timestamp" not in result["metadata"]:
                result["metadata"]["extraction_timestamp"] = datetime.datetime.now().isoformat()
            
            # Validate and clean the extracted data
            result = self._validate_extracted_data(result)
            result = self._post_process_extracted_data(result, text[:5000])
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            # Try to extract and fix JSON
            try:
                import re
                json_match = re.search(r'\{.*\}', response.choices[0].message.content, re.DOTALL)
                if json_match:
                    fixed_json = json_match.group()
                    # Clean common JSON issues
                    fixed_json = fixed_json.replace('\n', ' ').replace('\r', ' ')
                    fixed_json = re.sub(r',\s*}', '}', fixed_json)
                    fixed_json = re.sub(r',\s*]', ']', fixed_json)
                    result = json.loads(fixed_json)
                    result = self._validate_extracted_data(result)
                    return result
            except:
                pass
            return self._get_empty_result()
        except Exception as e:
            print(f"Extraction error: {e}")
            import traceback
            traceback.print_exc()
            return self._get_empty_result()

    # def _validate_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
    #     """Validate and clean extracted data"""
    #     # Ensure financial amounts are numbers
    #     if "financial_details" in data:
    #         # Convert total_grant_amount to number if it's a string
    #         if isinstance(data["financial_details"].get("total_grant_amount"), str):
    #             try:
    #                 # Remove currency symbols and commas
    #                 amount_str = data["financial_details"]["total_grant_amount"]
    #                 amount_str = re.sub(r'[^\d.]', '', amount_str)
    #                 data["financial_details"]["total_grant_amount"] = float(amount_str)
    #             except:
    #                 data["financial_details"]["total_grant_amount"] = None
            
    #         # Process installments and milestones
    #         payment_schedule = data["financial_details"].get("payment_schedule", {})
            
    #         for installment in payment_schedule.get("installments", []):
    #             if isinstance(installment.get("amount"), str):
    #                 try:
    #                     amount_str = installment["amount"]
    #                     amount_str = re.sub(r'[^\d.]', '', amount_str)
    #                     installment["amount"] = float(amount_str)
    #                 except:
    #                     installment["amount"] = None
            
    #         for milestone in payment_schedule.get("milestones", []):
    #             if isinstance(milestone.get("amount"), str):
    #                 try:
    #                     amount_str = milestone["amount"]
    #                     amount_str = re.sub(r'[^\d.]', '', amount_str)
    #                     milestone["amount"] = float(amount_str)
    #                 except:
    #                     milestone["amount"] = None
        
    #     return data


    def _post_process_extracted_data(self, data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Post-process extracted data to fill missing fields"""
        import re
        
        # If contract name is missing, try to extract from text
        if not data.get("contract_details", {}).get("grant_name"):
            # Look for common contract name patterns
            patterns = [
                r'GRANT\s+AGREEMENT\s+(?:FOR|RELATING TO|REGARDING)\s+(.+?)(?:\n|;)',
                r'CONTRACT\s+(?:NO\.|NUMBER)[:\s]*[A-Z0-9-]+\s+(?:FOR|RELATING TO)\s+(.+?)(?:\n|;)',
                r'AGREEMENT\s+(?:BETWEEN|AMONG).+?AND.+?FOR\s+(.+?)(?:\n|;)',
                r'PROJECT\s+NAME[:\s]+(.+?)(?:\n|;)',
                r'TITLE[:\s]+(.+?)(?:\n|;)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, original_text[:2000], re.IGNORECASE)
                if match:
                    data["contract_details"]["grant_name"] = match.group(1).strip()
                    break
        
        # Ensure terms_conditions section exists
        if "terms_conditions" not in data:
            data["terms_conditions"] = self._get_empty_result()["terms_conditions"]
        
        # Ensure compliance section exists
        if "compliance" not in data:
            data["compliance"] = self._get_empty_result()["compliance"]
        
        return data



    def _validate_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean extracted data"""
        import re
        
        # Ensure financial amounts are numbers
        if "financial_details" in data:
            # Convert total_grant_amount to number if it's a string
            if isinstance(data["financial_details"].get("total_grant_amount"), str):
                try:
                    # Remove currency symbols and commas
                    amount_str = data["financial_details"]["total_grant_amount"]
                    amount_str = re.sub(r'[^\d.]', '', amount_str)
                    data["financial_details"]["total_grant_amount"] = float(amount_str)
                except:
                    data["financial_details"]["total_grant_amount"] = None
            
            # Process installments and milestones
            payment_schedule = data["financial_details"].get("payment_schedule", {})
            
            for installment in payment_schedule.get("installments", []):
                if isinstance(installment.get("amount"), str):
                    try:
                        amount_str = installment["amount"]
                        amount_str = re.sub(r'[^\d.]', '', amount_str)
                        installment["amount"] = float(amount_str)
                    except:
                        installment["amount"] = None
            
            for milestone in payment_schedule.get("milestones", []):
                if isinstance(milestone.get("amount"), str):
                    try:
                        amount_str = milestone["amount"]
                        amount_str = re.sub(r'[^\d.]', '', amount_str)
                        milestone["amount"] = float(amount_str)
                    except:
                        milestone["amount"] = None
        
        # ADD THIS: Validate terms_conditions and compliance sections
        if "terms_conditions" in data:
            terms = data["terms_conditions"]
            # Ensure all fields exist with at least empty strings
            required_terms_fields = [
                "intellectual_property", "confidentiality", "liability", 
                "termination_clauses", "renewal_options", "dispute_resolution", 
                "governing_law", "force_majeure", "key_obligations", "restrictions"
            ]
            for field in required_terms_fields:
                if field not in terms or terms[field] is None:
                    terms[field] = "" if field.endswith("s") else []
        
        if "compliance" in data:
            compliance = data["compliance"]
            # Ensure all fields exist with at least empty strings
            required_compliance_fields = [
                "audit_requirements", "record_keeping", 
                "regulatory_compliance", "ethics_requirements"
            ]
            for field in required_compliance_fields:
                if field not in compliance or compliance[field] is None:
                    compliance[field] = ""
        
        
        if "contract_details" in data:
            contract_details = data["contract_details"]

            if "scope_of_work" not in contract_details or not contract_details["scope_of_work"]:
                contract_details["scope_of_work"] = "Not specified in contract"
        
            # Ensure grant_reference is extracted
            if "grant_reference" not in contract_details:
                contract_details["grant_reference"] = None
            
            # Ensure risk_management is extracted
            if "risk_management" not in contract_details:
                contract_details["risk_management"] = "Not specified in contract"
            
            # Ensure objectives is an array
            if "objectives" not in contract_details:
                contract_details["objectives"] = []
            elif not isinstance(contract_details["objectives"], list):
                # If it's a string, convert to array
                if isinstance(contract_details["objectives"], str):
                    contract_details["objectives"] = [contract_details["objectives"]]
                else:
                    contract_details["objectives"] = []
        
        # Ensure deliverables has enhanced reporting_requirements
        if "deliverables" in data and "reporting_requirements" in data["deliverables"]:
            reporting = data["deliverables"]["reporting_requirements"]
            if "format_requirements" not in reporting:
                reporting["format_requirements"] = "Not specified"
            if "submission_method" not in reporting:
                reporting["submission_method"] = "Not specified"
        
        # Ensure parties have signatory information
        if "parties" in data:
            for party_type in ["grantor", "grantee"]:
                if party_type in data["parties"]:
                    party = data["parties"][party_type]
                    if "signatory_name" not in party:
                        party["signatory_name"] = None
                    if "signatory_title" not in party:
                        party["signatory_title"] = None
                    if "signature_date" not in party:
                        party["signature_date"] = None
        
        # Ensure terms_conditions has all fields with proper defaults
        if "terms_conditions" in data:
            terms = data["terms_conditions"]
            
            # Fields that should be strings (not arrays)
            string_fields = [
                "confidentiality", "renewal_options", "dispute_resolution",
                "governing_law", "force_majeure"
            ]
            
            for field in string_fields:
                if field not in terms or terms[field] is None:
                    terms[field] = "Not specified in contract"
                elif isinstance(terms[field], list):
                    # If somehow it's a list, join it
                    terms[field] = ". ".join(terms[field])
        
        # Ensure extended_data has signatures_found
        if "extended_data" in data and "signatures_found" not in data["extended_data"]:
            data["extended_data"]["signatures_found"] = []
            
            if not contract_details.get("grant_name") and not contract_details.get("contract_number"):
                # Try to find contract name in text if not extracted
                # Look for common patterns in the original text
                contract_details["extraction_notes"] = "Contract name not explicitly found in standard fields"
        
        return data

    def get_embedding(self, text: str) -> list:
        """Get vector embedding for text - used for ChromaDB"""
        try:
            if not self.api_key or self.api_key == "your-openai-api-key-here":
                print("ERROR: Please set OPENAI_API_KEY in .env file")
                return []
            
            response = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000]
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Embedding error: {e}")
            return []
    
    def _get_empty_result(self) -> Dict[str, Any]:
        """Return comprehensive empty result structure"""
        import datetime
        return {
            "metadata": {
                "document_type": None,
                "extraction_confidence": 0.0,
                "pages_extracted_from": None,
                "extraction_timestamp": datetime.datetime.now().isoformat()
            },
            "parties": {
                "grantor": {
                    "organization_name": None,
                    "address": None,
                    "contact_person": None,
                    "email": None,
                    "phone": None,
                    "signatory_name": None,  # ADDED
                    "signatory_title": None,   # ADDED
                    "signature_date": None     # ADDED
                },
                "grantee": {
                    "organization_name": None,
                    "address": None,
                    "contact_person": None,
                    "email": None,
                    "phone": None,
                    "signatory_name": None,    # ADDED
                    "signatory_title": None,   # ADDED
                    "signature_date": None     # ADDED
                },
                "other_parties": []
            },
            "contract_details": {
                "contract_number": None,
                "grant_name": None,
                "grant_reference": None,       # ADDED
                "agreement_type": None,
                "effective_date": None,
                "signature_date": None,        # ADDED explicit signature date
                "start_date": None,
                "end_date": None,
                "duration": None,
                "purpose": None,
                "objectives": [],              # ADDED as array
                "scope_of_work": None,         # ADDED
                "geographic_scope": None,
                "risk_management": None,       # ADDED
                "key_dates": {                 # ADDED
                    "proposal_submission_date": None,
                    "approval_date": None,
                    "notification_date": None
                }
            },
            "financial_details": {
                # ... [keep existing financial structure]
            },
            "deliverables": {
                "items": [],
                "reporting_requirements": {
                    "frequency": None,
                    "report_types": [],
                    "due_dates": [],
                    "format_requirements": None,    # ADDED
                    "submission_method": None       # ADDED
                }
            },
            "terms_conditions": {
                "intellectual_property": None,
                "confidentiality": None,       # This exists but ensure it's extracted
                "liability": None,
                "termination_clauses": None,
                "renewal_options": None,       # This exists but ensure it's extracted
                "dispute_resolution": None,    # This exists but ensure it's extracted
                "governing_law": None,         # This exists but ensure it's extracted
                "force_majeure": None,         # This exists but ensure it's extracted
                "key_obligations": [],
                "restrictions": []
            },
            "compliance": {
                "audit_requirements": None,
                "record_keeping": None,
                "regulatory_compliance": None,
                "ethics_requirements": None
            },
            "summary": {
                "executive_summary": "No summary available",
                "key_dates_summary": "No date information extracted",
                "financial_summary": "No financial information extracted",
                "risk_assessment": "No risk assessment available",  # ADDED
                "total_contract_value": "No total value extracted",
                "payment_timeline_summary": "No payment timeline extracted"
            },
            "extended_data": {
                "all_dates_found": [],
                "all_amounts_found": [],
                "table_data_extracted": [],
                "signatures_found": []         # ADDED
            }
        }

    # def _get_empty_result(self) -> Dict[str, Any]:
        """Return comprehensive empty result structure"""
        import datetime
        return {
            "metadata": {
                "document_type": None,
                "extraction_confidence": 0.0,
                "pages_extracted_from": None,
                "extraction_timestamp": datetime.datetime.now().isoformat()
            },
            "parties": {
                "grantor": {
                    "organization_name": None,
                    "address": None,
                    "contact_person": None,
                    "email": None,
                    "phone": None
                },
                "grantee": {
                    "organization_name": None,
                    "address": None,
                    "contact_person": None,
                    "email": None,
                    "phone": None
                },
                "other_parties": []
            },
            "contract_details": {
                "contract_number": None,
                "grant_name": None,
                "grant_reference": None,
                "agreement_type": None,
                "effective_date": None,
                "signature_date": None,
                "start_date": None,
                "end_date": None,
                "duration": None,
                "purpose": None,
                "objectives": [],
                "scope_of_work": None,
                "geographic_scope": None
            },
            "financial_details": {
                "total_grant_amount": None,
                "currency": "USD",
                "additional_currencies": [],
                "payment_schedule": {
                    "schedule_type": None,
                    "installments": [],
                    "milestones": [],
                    "reimbursements": []
                },
                "budget_breakdown": {
                    "personnel": None,
                    "equipment": None,
                    "travel": None,
                    "materials": None,
                    "indirect_costs": None,
                    "other": None,
                    "contingency": None,
                    "overhead": None,
                    "subcontractors": None
                },
                "additional_budget_items": [],
                "financial_reporting_requirements": None,
                "financial_tables_summary": None,
                "total_installments_amount": None,
                "total_milestones_amount": None,
                "payment_terms": None
            },
            "deliverables": {
                "items": [],
                "reporting_requirements": {
                    "frequency": None,
                    "report_types": [],
                    "due_dates": []
                }
            },
            "terms_conditions": {
                "intellectual_property": None,
                "confidentiality": None,
                "liability": None,
                "termination_clauses": None,
                "renewal_options": None,
                "dispute_resolution": None,
                "governing_law": None,
                "force_majeure": None,
                "key_obligations": [],
                "restrictions": []
            },
            "compliance": {
                "audit_requirements": None,
                "record_keeping": None,
                "regulatory_compliance": None,
                "ethics_requirements": None
            },
            "summary": {
                "executive_summary": "No summary available",
                "key_dates_summary": "No date information extracted",
                "financial_summary": "No financial information extracted",
                "risk_assessment": "No risk assessment available",
                "total_contract_value": "No total value extracted",
                "payment_timeline_summary": "No payment timeline extracted"
            },
            "extended_data": {
                "all_dates_found": [],
                "all_amounts_found": [],
                "table_data_extracted": []
            }
        }