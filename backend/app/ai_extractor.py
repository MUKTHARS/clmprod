# C:\saple.ai\POC\backend\app\ai_extractor.py
# COMPLETE FIXED VERSION - FAST & COMPREHENSIVE

import openai
import json
import re
from typing import Dict, Any, List
from app.config import settings
import os
from datetime import datetime
import sys

class AIExtractor:
    def __init__(self):
        # Clean environment
        self._clean_environment()
        self.api_key = settings.OPENAI_API_KEY
        
        # Initialize client
        self.client = self._create_openai_client()
        
        # Define the comprehensive but optimized prompt
        self.extraction_prompt = """ANALYZE THIS GRANT CONTRACT AND EXTRACT ALL INFORMATION.

MOST IMPORTANT FIELDS (EXTRACT THESE FIRST):
1. CONTRACT TITLE/NAME - Look at beginning of document, headers, logo area
2. GRANTOR & GRANTEE - Look for "BETWEEN [Grantor] AND [Grantee]"
3. CONTRACT/GREFERENCE NUMBER - Any alphanumeric ID
4. TOTAL GRANT AMOUNT - Look for dollar amounts, "total grant", "amount"
5. START AND END DATES - Look for "effective date", "commencement", "term"
6. PAYMENT SCHEDULE - Extract ALL payment details from tables or text

STRUCTURED EXTRACTION:
Extract information for these categories:

A. BASIC IDENTIFICATION
- Contract name/title
- Contract/grant reference number
- Agreement type (Grant Agreement, Contract, MOU)
- Signature date, Effective date
- Parties: Grantor and Grantee with contact details

B. FINANCIAL DETAILS  
- Total grant amount with currency
- Payment schedule (installments, milestones, dates, amounts)
- Budget breakdown if available
- Payment terms and conditions

C. PROJECT DETAILS
- Purpose of the grant
- Objectives and goals
- Scope of work (detailed)
- Deliverables with due dates
- Geographic scope
- Key milestones

D. LEGAL & COMPLIANCE
- Confidentiality clauses
- Intellectual property rights
- Liability and indemnification
- Termination conditions
- Dispute resolution
- Governing law
- Audit requirements
- Reporting requirements

E. DATES & TIMELINES
- All dates mentioned (convert to YYYY-MM-DD)
- Duration of agreement
- Key milestone dates
- Reporting deadlines

F. DELIVERABLES & REPORTING (COMPREHENSIVE - NO CHUNKS)
- ALL deliverables: Extract EACH deliverable with complete name and description
- Deliverable due dates in YYYY-MM-DD format
- Deliverable status (default: "pending")
- Reporting frequency (monthly, quarterly, annually)
- ALL report types (progress, financial, technical, final, etc.)
- Report due dates as array of YYYY-MM-DD
- Report format requirements (PDF, Word, Excel, etc.)
- Submission method (email, portal, physical)
- Report recipients


G. TERMS & CONDITIONS (COMPLETE CLAUSES - NO SUMMARIES)
Extract ALL legal clauses as COMPLETE text, not summaries:

1. Intellectual Property - Complete ownership rights, licenses, patents
2. Confidentiality - Full non-disclosure terms, duration, exceptions
3. Liability & Indemnification - Complete liability limits, indemnity clauses
4. Termination - All termination triggers, notice periods, consequences
5. Renewal Options - Automatic renewal, extension terms, conditions
6. Dispute Resolution - Arbitration, mediation, litigation details
7. Governing Law - Jurisdiction, applicable laws, venue
8. Force Majeure - Complete clause with specific events
9. Warranties - All representations and warranties
10. Assignment - Transfer rights, restrictions
11. Notices - Complete notice procedures, addresses
12. Severability - Clause text
13. Entire Agreement - Complete integration clause
14. Amendment - Modification procedures
15. Key Obligations - Array of specific obligations
16. Restrictions - Array of specific restrictions

H. COMPLIANCE REQUIREMENTS (ALL REQUIREMENTS)
Extract ALL compliance obligations:

1. Audit Rights - Complete audit procedures, frequency, access
2. Record Keeping - Documentation requirements, retention period
3. Regulatory Compliance - All applicable laws, regulations
4. Ethics Requirements - Code of ethics, conduct standards
5. Environmental Compliance - Environmental standards, impact assessment
6. Safety Requirements - Health and safety obligations
7. Accessibility Requirements - Accessibility standards
8. Data Protection - Privacy, data security, GDPR compliance
9. Conflict of Interest - Disclosure requirements, management
10. Code of Conduct - Specific conduct rules
11. Monitoring & Evaluation - Performance monitoring requirements


CRITICAL RULES:
1. For dates: Convert any format to YYYY-MM-DD
2. For amounts: Extract numbers, remove currency symbols
3. For missing fields: Use "Not specified" or empty array
4. If information is in tables: Extract ALL table rows and columns
5. Focus on EXACT text from document, don't infer or create data

TABLES ARE CRITICAL:
- Payment schedule tables: Extract every row
- Budget tables: Extract all categories and amounts
- Milestone tables: Extract all milestones

Return ONLY valid JSON matching this exact structure:
{json_structure}

Contract text (first 12000 characters):
{text}"""

    def _clean_environment(self):
        """Clean proxy environment variables"""
        proxy_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']
        for var in proxy_vars:
            if var in os.environ:
                del os.environ[var]
    
    def _create_openai_client(self):
        """Create OpenAI client"""
        try:
            return openai.OpenAI(
                api_key=self.api_key,
                timeout=90.0  # Increased timeout
            )
        except Exception as e:
            print(f"Client creation failed: {e}")
            return None
    
    def _get_json_structure(self):
        """Return the JSON structure for the prompt"""
        return json.dumps({
            "metadata": {
                "document_type": "string",
                "extraction_confidence": "number",
                "pages_extracted_from": "number",
                "extraction_timestamp": "string"
            },
            "parties": {
                "grantor": {
                    "organization_name": "string",
                    "address": "string",
                    "contact_person": "string",
                    "email": "string",
                    "phone": "string",
                    "signatory_name": "string",
                    "signatory_title": "string",
                    "signature_date": "string"
                },
                "grantee": {
                    "organization_name": "string",
                    "address": "string",
                    "contact_person": "string",
                    "email": "string",
                    "phone": "string",
                    "signatory_name": "string",
                    "signatory_title": "string",
                    "signature_date": "string"
                }
            },
            "contract_details": {
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
                "risk_management": "string"
            },
            "financial_details": {
                "total_grant_amount": "number",
                "currency": "string",
                "payment_schedule": {
                    "schedule_type": "string",
                    "installments": [
                        {
                            "installment_number": "number",
                            "amount": "number",
                            "currency": "string",
                            "due_date": "string",
                            "description": "string"
                        }
                    ],
                    "milestones": [
                        {
                            "milestone_name": "string",
                            "amount": "number",
                            "currency": "string",
                            "due_date": "string",
                            "description": "string"
                        }
                    ]
                },
                "budget_breakdown": {
                    "personnel": "number",
                    "equipment": "number",
                    "travel": "number",
                    "materials": "number",
                    "other": "number"
                }
            },
"deliverables": {
            "items": [
                {
                    "deliverable_name": "string",
                    "description": "string",
                    "due_date": "YYYY-MM-DD",
                    "status": "pending"
                }
            ],
            "reporting_requirements": {
                "frequency": "string",
                "report_types": ["array of strings"],
                "due_dates": ["array of YYYY-MM-DD"],
                "format_requirements": "string",
                "submission_method": "string",
                "recipients": ["array of strings"]
            }
        },
        }, indent=2)
    
    def extract_contract_data(self, text: str) -> Dict[str, Any]:
        """Extract comprehensive structured data from contract text"""
        try:
            # Check API key
            if not self.api_key or self.api_key == "your-openai-api-key-here":
                print("ERROR: Please set OPENAI_API_KEY in .env file")
                return self._get_empty_result()
            
            if not self.client:
                print("ERROR: OpenAI client not initialized")
                return self._get_empty_result()
            
            # Pre-process text
            processed_text = self._preprocess_text(text)
            
            # Use GPT-4o for better extraction (faster and more accurate than gpt-4o-mini)
            response = self.client.chat.completions.create(
                model="gpt-4o",  # CHANGED FROM gpt-4o-mini TO gpt-4o
                messages=[
                    {
                        "role": "system",
                        "content": """You are a contract analysis expert. Extract ALL information from grant contracts.
                        Be extremely thorough. Extract dates, amounts, names, clauses, tables, schedules.
                        If information is missing, use "Not specified".
                        Convert dates to YYYY-MM-DD format.
                        Return ONLY valid JSON."""
                    },
                    {
                        "role": "user", 
                        "content": self.extraction_prompt.format(
                            json_structure=self._get_json_structure(),
                            text=processed_text[:12000]  # Increased limit
                        )
                    }
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
                max_tokens=4000  # Enough for comprehensive extraction
            )
            
            # Parse response
            result = json.loads(response.choices[0].message.content)
            
            # Add timestamp
            result["metadata"]["extraction_timestamp"] = datetime.now().isoformat()
            
            # Add reference IDs
            result["reference_ids"] = self.extract_reference_ids(text, result.get("contract_details", {}))
            
            # Add detailed scope extraction
            if "contract_details" in result:
                if "scope_of_work" not in result["contract_details"] or not result["contract_details"]["scope_of_work"]:
                    result["contract_details"]["scope_of_work"] = self._extract_scope_from_text(text)
                
                # Add detailed scope structure
                result["contract_details"]["detailed_scope_of_work"] = self._extract_detailed_scope(text)
            
            # Post-process and validate
            result = self._validate_and_enhance_data(result, text)
            
            # Add summary section
            result["summary"] = self._generate_summary(result)
            
            # Add extended data section
            result["extended_data"] = self._extract_extended_data(text, result)
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            # Try to fix JSON
            try:
                import re
                json_match = re.search(r'\{.*\}', response.choices[0].message.content, re.DOTALL)
                if json_match:
                    fixed_json = json_match.group()
                    # Clean common JSON issues
                    fixed_json = re.sub(r',\s*}', '}', fixed_json)
                    fixed_json = re.sub(r',\s*]', ']', fixed_json)
                    result = json.loads(fixed_json)
                    return self._validate_and_enhance_data(result, text)
            except:
                pass
            return self._get_empty_result()
        except Exception as e:
            print(f"Extraction error: {e}")
            import traceback
            traceback.print_exc()
            return self._get_empty_result()
    
    def _preprocess_text(self, text: str) -> str:
        """Pre-process text for better extraction"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common OCR issues
        text = re.sub(r'(\d),(\d)', r'\1\2', text)  # Remove commas in numbers
        
        # Extract and mark tables
        lines = text.split('\n')
        processed_lines = []
        
        for line in lines:
            # Check if line looks like table data
            if '|' in line or ('  ' in line and len(line.split()) >= 3 and any(char.isdigit() for char in line)):
                processed_lines.append(f"[TABLE ROW]: {line}")
            else:
                processed_lines.append(line)
        
        return '\n'.join(processed_lines)
    
    def _extract_scope_from_text(self, text: str) -> str:
        """Extract scope of work from text using regex"""
        scope_patterns = [
            r'(?:Scope\s+of\s+Work|Scope\s+of\s+Services)[:\s]*(.+?)(?=\n\n|SECTION|ARTICLE|\d+\.)',
            r'(?:WORK\s+SCOPE|PROJECT\s+SCOPE)[:\s]*(.+?)(?=\n\n|\.\s+[A-Z])',
            r'(?:Services\s+to\s+be\s+Provided)[:\s]*(.+?)(?=\n\n|SECTION)'
        ]
        
        for pattern in scope_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                scope_text = match.group(1).strip()
                if len(scope_text) > 50:  # Ensure meaningful content
                    return scope_text[:2000]  # Limit length
        
        # Fallback: Look for "shall" sentences which often describe work
        sentences = re.split(r'[.!?]', text)
        scope_sentences = []
        for sentence in sentences:
            if ('shall' in sentence.lower() or 'will provide' in sentence.lower() or 
                'deliverables' in sentence.lower() or 'services' in sentence.lower()):
                if len(sentence.strip()) > 30:
                    scope_sentences.append(sentence.strip())
        
        if scope_sentences:
            return ". ".join(scope_sentences[:10])
        
        return "Scope not explicitly specified in contract"
    
    def _extract_detailed_scope(self, text: str) -> Dict[str, Any]:
        """Extract detailed scope structure"""
        detailed_scope = {
            "project_description": "",
            "main_activities": [],
            "deliverables_list": [],
            "timeline_phases": [],
            "technical_requirements": [],
            "key_milestones": [],
            "resources_required": []
        }
        
        # Extract from text using patterns
        # Project description (first paragraph often contains this)
        paragraphs = text.split('\n\n')
        if paragraphs:
            detailed_scope["project_description"] = paragraphs[0][:500]
        
        # Extract deliverables
        deliverable_patterns = [
            r'deliverable[s]?[:\s]+(.+?)(?=\n|\.)',
            r'(?:shall\s+deliver|will\s+provide)[:\s]+(.+?)(?=\n|\.)',
            r'Deliverable\s+\d+[:\s]+(.+?)(?=\n|\.)'
        ]
        
        for pattern in deliverable_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if len(match.strip()) > 10:
                    detailed_scope["deliverables_list"].append(match.strip())
        
        # Extract activities
        activity_patterns = [
            r'(?:activity|task)\s+\d+[:\s]+(.+?)(?=\n|\.)',
            r'(?:shall|will)\s+(?:perform|conduct|implement)[:\s]+(.+?)(?=\n|\.)'
        ]
        
        for pattern in activity_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if len(match.strip()) > 15:
                    detailed_scope["main_activities"].append(match.strip())
        
        # Limit arrays to reasonable sizes
        detailed_scope["deliverables_list"] = detailed_scope["deliverables_list"][:20]
        detailed_scope["main_activities"] = detailed_scope["main_activities"][:15]
        
        return detailed_scope
    
    def _validate_and_enhance_data(self, data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Validate and enhance extracted data"""
        # Ensure all sections exist
        required_sections = [
            "metadata", "parties", "contract_details", "financial_details",
            "deliverables", "terms_conditions", "compliance"
        ]
        
        for section in required_sections:
            if section not in data:
                data[section] = self._get_empty_section(section)
        
        # Fix contract name if missing
        if "contract_details" in data:
            contract_details = data["contract_details"]
            
            if not contract_details.get("grant_name"):
                # Try to extract from text
                name_patterns = [
                    r'AGREEMENT\s+(?:FOR|RELATING TO)\s+(.+?)(?:\n|;)',
                    r'GRANT\s+AGREEMENT\s+(?:FOR|BETWEEN)\s+(.+?)(?:\n|;)',
                    r'THIS\s+(?:GRANT\s+)?AGREEMENT\s+(?:IS\s+MADE\s+)?(?:FOR|ENTITLED)[:\s]+(.+?)(?:\n|;)'
                ]
                
                for pattern in name_patterns:
                    match = re.search(pattern, original_text[:1000], re.IGNORECASE)
                    if match:
                        contract_details["grant_name"] = match.group(1).strip()
                        break
                
                # Fallback to filename or generic
                if not contract_details.get("grant_name"):
                    contract_details["grant_name"] = "Grant Contract"
            
            # Ensure scope exists
            if not contract_details.get("scope_of_work"):
                contract_details["scope_of_work"] = self._extract_scope_from_text(original_text)
        
        # Fix financial amounts
        if "financial_details" in data:
            financial = data["financial_details"]
            
            # Ensure payment_schedule exists
            if "payment_schedule" not in financial:
                financial["payment_schedule"] = {
                    "schedule_type": "Not specified",
                    "installments": [],
                    "milestones": []
                }
            
            # Try to extract payment info from text if missing
            if not financial.get("total_grant_amount"):
                amount_patterns = [
                    r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
                    r'Amount[\s:]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
                    r'Total[\s:]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
                ]
                
                for pattern in amount_patterns:
                    match = re.search(pattern, original_text, re.IGNORECASE)
                    if match:
                        try:
                            amount_str = match.group(1).replace(',', '')
                            financial["total_grant_amount"] = float(amount_str)
                            financial["currency"] = financial.get("currency", "USD")
                            break
                        except:
                            pass

        if "deliverables" in data:
            deliverables = data["deliverables"]
            
            # Ensure reporting_requirements has all fields
            if "reporting_requirements" not in deliverables:
                deliverables["reporting_requirements"] = {}
            
            reporting = deliverables["reporting_requirements"]
            
            # Add missing fields with defaults
            required_fields = {
                "frequency": "Not specified",
                "report_types": [],
                "due_dates": [],
                "format_requirements": "Not specified",
                "submission_method": "Not specified",
                "recipients": []
            }
            
            for field, default in required_fields.items():
                if field not in reporting:
                    reporting[field] = default
            
            # Extract additional report types from text
            if not reporting["report_types"] or len(reporting["report_types"]) == 0:
                reporting["report_types"] = self._extract_report_types(original_text)
            
            # Ensure each deliverable has status
            if "items" in deliverables:
                for item in deliverables["items"]:
                    if "status" not in item:
                        item["status"] = "pending"


        if "terms_conditions" not in data:
            data["terms_conditions"] = {}
        
        terms = data["terms_conditions"]
        
        # Define all required terms fields with defaults
        terms_fields = {
            "intellectual_property": "Not specified",
            "confidentiality": "Not specified", 
            "liability": "Not specified",
            "indemnification": "Not specified",
            "termination_clauses": "Not specified",
            "renewal_options": "Not specified",
            "dispute_resolution": "Not specified",
            "governing_law": "Not specified",
            "force_majeure": "Not specified",
            "warranties": "Not specified",
            "assignment": "Not specified",
            "notices": "Not specified",
            "severability": "Not specified",
            "entire_agreement": "Not specified",
            "amendment": "Not specified",
            "key_obligations": [],
            "restrictions": []
        }
        
        for field, default in terms_fields.items():
            if field not in terms:
                terms[field] = default
        
        # Extract key obligations from text if missing
        if not terms.get("key_obligations") or len(terms["key_obligations"]) == 0:
            terms["key_obligations"] = self._extract_key_obligations(original_text)
        
        # Extract restrictions from text if missing  
        if not terms.get("restrictions") or len(terms["restrictions"]) == 0:
            terms["restrictions"] = self._extract_restrictions(original_text)
        
        # Ensure compliance section exists
        if "compliance" not in data:
            data["compliance"] = {}
        
        compliance = data["compliance"]
        
        # Define all compliance fields with defaults
        compliance_fields = {
            "audit_requirements": "Not specified",
            "record_keeping": "Not specified",
            "regulatory_compliance": "Not specified",
            "ethics_requirements": "Not specified",
            "environmental_compliance": "Not specified",
            "safety_requirements": "Not specified",
            "accessibility_requirements": "Not specified",
            "data_protection": "Not specified",
            "conflict_of_interest": "Not specified",
            "code_of_conduct": "Not specified",
            "monitoring_evaluation": "Not specified"
        }
        
        for field, default in compliance_fields.items():
            if field not in compliance:
                compliance[field] = default
            
        return data
    

    def _extract_key_obligations(self, text: str) -> List[str]:
        """Extract key obligations from text"""
        obligations = []
        
        # Look for obligation patterns
        obligation_patterns = [
            r'(?:shall|must|will)\s+(?:[^\.]+?\.)',
            r'(?:obligation|duty|responsibility)[\s:]+(.+?)(?=\n|\.)',
            r'(?:is\s+required\s+to|are\s+required\s+to)\s+(.+?)(?=\n|\.)'
        ]
        
        for pattern in obligation_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, str):
                    obligation = match.strip()
                    if len(obligation) > 20 and len(obligation) < 200:
                        obligations.append(obligation)
        
        # Remove duplicates
        seen = set()
        unique_obligations = []
        for obligation in obligations:
            if obligation not in seen:
                seen.add(obligation)
                unique_obligations.append(obligation)
        
        return unique_obligations[:15]  # Limit to 15 obligations

    def _extract_restrictions(self, text: str) -> List[str]:
        """Extract restrictions from text"""
        restrictions = []
        
        # Look for restriction patterns
        restriction_patterns = [
            r'(?:shall\s+not|must\s+not|cannot|may\s+not)\s+(.+?)(?=\n|\.)',
            r'(?:restriction|limitation|prohibition)[\s:]+(.+?)(?=\n|\.)',
            r'(?:not\s+permitted\s+to|not\s+allowed\s+to)\s+(.+?)(?=\n|\.)'
        ]
        
        for pattern in restriction_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, str):
                    restriction = match.strip()
                    if len(restriction) > 15 and len(restriction) < 200:
                        restrictions.append(restriction)
        
        # Remove duplicates
        seen = set()
        unique_restrictions = []
        for restriction in restrictions:
            if restriction not in seen:
                seen.add(restriction)
                unique_restrictions.append(restriction)
        
        return unique_restrictions[:10]  # Limit to 10 restrictions


    def _extract_report_types(self, text: str) -> List[str]:
        """Extract all report types from text"""
        report_types = []
        
        # Look for report patterns
        report_patterns = [
            r'(?:submit|provide|deliver)\s+(?:a|an|the)?\s*(.+?)\s*(?:report|document)',
            r'(?:quarterly|monthly|annual|progress|financial|technical|final)\s+report',
            r'Report\s+types?[:\s]+(.+?)(?=\n|\.)',
            r'(?:shall|will)\s+submit\s+(?:a|an)?\s*(.+?)\s+report'
        ]
        
        for pattern in report_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, str):
                    report_name = match.strip()
                    if report_name and len(report_name) > 3:
                        # Clean up the report name
                        if 'report' not in report_name.lower():
                            report_name = f"{report_name} Report"
                        report_types.append(report_name)
        
        # Remove duplicates
        seen = set()
        unique_reports = []
        for report in report_types:
            if report not in seen:
                seen.add(report)
                unique_reports.append(report)
        
        return unique_reports[:10]  # Limit to 10 report types



    def _generate_summary(self, data: Dict[str, Any]) -> Dict[str, str]:
        """Generate summary sections"""
        summary = {
            "executive_summary": "",
            "key_dates_summary": "",
            "financial_summary": "",
            "risk_assessment": "No specific risk assessment found"
        }
        
        # Generate executive summary
        contract_details = data.get("contract_details", {})
        parties = data.get("parties", {})
        financial = data.get("financial_details", {})
        
        grantor = parties.get("grantor", {}).get("organization_name", "Unknown Grantor")
        grantee = parties.get("grantee", {}).get("organization_name", "Unknown Grantee")
        grant_name = contract_details.get("grant_name", "Grant Agreement")
        total_amount = financial.get("total_grant_amount", 0)
        currency = financial.get("currency", "USD")
        
        summary["executive_summary"] = (
            f"{grant_name} between {grantor} and {grantee}. "
            f"Total grant amount: {currency} {total_amount:,.2f}. "
            f"Purpose: {contract_details.get('purpose', 'Not specified')[:200]}"
        )
        
        # Key dates summary
        dates = []
        if contract_details.get("start_date"):
            dates.append(f"Start: {contract_details['start_date']}")
        if contract_details.get("end_date"):
            dates.append(f"End: {contract_details['end_date']}")
        if contract_details.get("signature_date"):
            dates.append(f"Signed: {contract_details['signature_date']}")
        
        summary["key_dates_summary"] = "; ".join(dates) if dates else "No dates specified"
        
        # Financial summary
        if total_amount:
            summary["financial_summary"] = f"Total grant: {currency} {total_amount:,.2f}"
            payment_schedule = financial.get("payment_schedule", {})
            if payment_schedule.get("installments"):
                summary["financial_summary"] += f" ({len(payment_schedule['installments'])} installments)"
            elif payment_schedule.get("milestones"):
                summary["financial_summary"] += f" ({len(payment_schedule['milestones'])} milestones)"
        
        return summary
    
    def _extract_extended_data(self, text: str, main_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract additional data not in main structure"""
        extended_data = {
            "all_dates_found": self._extract_all_dates(text),
            "all_amounts_found": self._extract_all_amounts(text),
            "table_data_extracted": self._extract_table_data(text),
            "signatures_found": self._extract_signatures(text)
        }
        
        return extended_data
    
    def _extract_all_dates(self, text: str) -> List[Dict]:
        """Extract all dates from text"""
        dates = []
        date_patterns = [
            (r'\d{4}-\d{2}-\d{2}', 'YYYY-MM-DD'),
            (r'\d{2}/\d{2}/\d{4}', 'MM/DD/YYYY'),
            (r'\d{2}-\d{2}-\d{4}', 'DD-MM-YYYY'),
            (r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}', 'Month DD, YYYY'),
            (r'\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4}', 'DD Month YYYY')
        ]
        
        for pattern, format_type in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Get context (surrounding text)
                context_start = max(0, text.find(match) - 100)
                context_end = min(len(text), text.find(match) + len(match) + 100)
                context = text[context_start:context_end]
                
                dates.append({
                    "date": match,
                    "context": context.replace('\n', ' '),
                    "type": format_type
                })
        
        return dates[:50]  # Limit to 50 dates
    
    def _extract_all_amounts(self, text: str) -> List[Dict]:
        """Extract all monetary amounts from text"""
        amounts = []
        amount_patterns = [
            r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|JPY|CAD|AUD)',
            r'Amount[\s:]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        ]
        
        for pattern in amount_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    amount = float(match.replace(',', ''))
                    
                    # Get context
                    match_str = match if '$' in match else f"${match}"
                    context_start = max(0, text.find(match_str) - 100)
                    context_end = min(len(text), text.find(match_str) + len(match_str) + 100)
                    context = text[context_start:context_end]
                    
                    amounts.append({
                        "amount": amount,
                        "currency": "USD",  # Default, could be enhanced
                        "context": context.replace('\n', ' '),
                        "type": "monetary_amount"
                    })
                except:
                    continue
        
        return amounts[:50]  # Limit to 50 amounts
    
    def _extract_table_data(self, text: str) -> List[Dict]:
        """Extract table-like data from text"""
        tables = []
        lines = text.split('\n')
        
        # Look for tables
        table_start = -1
        for i, line in enumerate(lines):
            # Check if line looks like table header (has multiple columns)
            if '|' in line or ('  ' in line and len(line.split()) >= 3):
                if table_start == -1:
                    table_start = i
            elif table_start != -1:
                # End of table
                table_data = lines[table_start:i]
                if len(table_data) >= 2:  # At least header and one row
                    tables.append({
                        "table_type": "detected_table",
                        "data": "\n".join(table_data),
                        "row_count": len(table_data) - 1
                    })
                table_start = -1
        
        return tables[:10]  # Limit to 10 tables
    
    def _extract_signatures(self, text: str) -> List[Dict]:
        """Extract signature information"""
        signatures = []
        
        # Look for signature blocks
        sig_patterns = [
            r'(?:SIGNED|SIGNATURE)[\s:]*([^\.]+?)(?:\n|\.)',
            r'(?:By|Per):\s*(.+?)\s*\n\s*(.+?)\s*\n\s*(?:Date|Dated)[:\s]*(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})',
            r'Name:\s*(.+?)\s*\nTitle:\s*(.+?)\s*\nDate:\s*(.+?)(?:\n|$)'
        ]
        
        for pattern in sig_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                if isinstance(match, tuple):
                    if len(match) >= 3:
                        signatures.append({
                            "name": match[0].strip(),
                            "title": match[1].strip(),
                            "date": match[2].strip(),
                            "context": "Signature block"
                        })
                else:
                    signatures.append({
                        "name": match.strip(),
                        "title": "Not specified",
                        "date": "Not specified",
                        "context": "Signature mentioned"
                    })
        
        return signatures[:10]  # Limit to 10 signatures
    
    def _get_empty_section(self, section_name: str) -> Any:
        """Get empty structure for a section"""
        empty_sections = {
            "metadata": {
                "document_type": "grant_contract",
                "extraction_confidence": 0.0,
                "pages_extracted_from": 1,
                "extraction_timestamp": datetime.now().isoformat()
            },
            "parties": {
                "grantor": {},
                "grantee": {}
            },
            "contract_details": {},
            "financial_details": {},
            "deliverables": {"items": [], "reporting_requirements": {}},
            "terms_conditions": {},
            "compliance": {}
        }
        
        return empty_sections.get(section_name, {})
    
    def extract_reference_ids(self, text: str, contract_details: Dict[str, Any]) -> Dict[str, Any]:
        """Extract reference IDs from contract text"""
        import re
        
        extracted_ids = {
            "investment_id": None,
            "project_id": None,
            "grant_id": None,
            "extracted_reference_ids": []
        }
        
        patterns = {
            "investment_id": [
                r'Investment\s*(?:ID|Number|No\.?)[:\s]*([A-Z0-9\-/#]+)',
                r'INV-\d+',
                r'INV[:\s]*([A-Z0-9\-]+)'
            ],
            "project_id": [
                r'Project\s*(?:ID|Number|No\.?|Code)[:\s]*([A-Z0-9\-/#]+)',
                r'PRJ-\d+',
                r'PRJ[:\s]*([A-Z0-9\-]+)'
            ],
            "grant_id": [
                r'Grant\s*(?:ID|Number|No\.?|Reference)[:\s]*([A-Z0-9\-/#]+)',
                r'GR-\d+',
                r'GRANT[:\s]+([A-Z0-9\-/#]+)'
            ]
        }
        
        for id_type, id_patterns in patterns.items():
            for pattern in id_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    extracted_value = match.group(1) if len(match.groups()) > 0 else match.group(0)
                    if extracted_value:
                        extracted_ids[id_type] = extracted_value.strip()
                        extracted_ids["extracted_reference_ids"].append({
                            "type": id_type,
                            "value": extracted_value.strip(),
                            "pattern": pattern
                        })
                        break
        
        return extracted_ids
    
    def _get_empty_result(self) -> Dict[str, Any]:
        """Return empty result structure"""
        return {
            "metadata": {
                "document_type": "grant_contract",
                "extraction_confidence": 0.0,
                "pages_extracted_from": 1,
                "extraction_timestamp": datetime.now().isoformat()
            },
            "parties": {
                "grantor": {},
                "grantee": {}
            },
            "contract_details": {
                "grant_name": "Grant Contract",
                "scope_of_work": "Not specified"
            },
            "financial_details": {
                "total_grant_amount": 0,
                "currency": "USD",
                "payment_schedule": {
                    "schedule_type": "Not specified",
                    "installments": [],
                    "milestones": []
                }
            },
                   "deliverables": {
                    "items": [],
                    "reporting_requirements": {
                        "frequency": "Not specified",
                        "report_types": [],
                        "due_dates": [],
                        "format_requirements": "Not specified",
                        "submission_method": "Not specified",
                        "recipients": []
            }
        },
         "terms_conditions": {
            "intellectual_property": "string",
            "confidentiality": "string",
            "liability": "string",
            "indemnification": "string",
            "termination_clauses": "string",
            "renewal_options": "string",
            "dispute_resolution": "string",
            "governing_law": "string",
            "force_majeure": "string",
            "warranties": "string",
            "assignment": "string",
            "notices": "string",
            "severability": "string",
            "entire_agreement": "string",
            "amendment": "string",
            "key_obligations": ["array of strings"],
            "restrictions": ["array of strings"]
        },
        
        # Add compliance section (AFTER terms_conditions):
        "compliance": {
            "audit_requirements": "string",
            "record_keeping": "string",
            "regulatory_compliance": "string",
            "ethics_requirements": "string",
            "environmental_compliance": "string",
            "safety_requirements": "string",
            "accessibility_requirements": "string",
            "data_protection": "string",
            "conflict_of_interest": "string",
            "code_of_conduct": "string",
            "monitoring_evaluation": "string"
        },
            "reference_ids": {
                "investment_id": None,
                "project_id": None,
                "grant_id": None,
                "extracted_reference_ids": []
            },
            "summary": {
                "executive_summary": "No data extracted",
                "key_dates_summary": "No dates found",
                "financial_summary": "No financial data found"
            },
            "extended_data": {
                "all_dates_found": [],
                "all_amounts_found": [],
                "table_data_extracted": [],
                "signatures_found": []
            }
        }
    
    def get_embedding(self, text: str) -> List[float]:
        """Get vector embedding for text"""
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