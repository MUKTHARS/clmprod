# C:\saple.ai\POC\backend\app\ai_extractor.py

import openai
import json
from typing import Dict, Any
from app.config import settings
import os
import re

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
        
        # Enhanced prompt for comprehensive extraction with focus on ALL fields
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

12. CONTRACT NAME: Look in these specific locations:
    - LOGO TEXT - often all caps text near the beginning
    - HEADER LINES - centered or bold text before "BETWEEN"
    - "THIS AGREEMENT" followed by "for" or "entitled"
    - Text between the parties names (e.g., "between X and Y for [Project Name]")
    - "Project:" or "Title:" markers
    - Funding program names mentioned in first paragraph

13. ADDITIONAL FIELD - KEY DATES: Also extract:
    - Proposal submission date
    - Approval date
    - Notification date
    - Commencement date
    - Any other milestone dates mentioned

IMPORTANT INSTRUCTIONS:
1. EXTRACT ALL DATES IN ANY FORMAT - convert to YYYY-MM-DD format
2. EXTRACT ALL MONETARY AMOUNTS - look for currency symbols
3. PAY SPECIAL ATTENTION TO TABLES - extract every row and column
4. For tables with installments: extract installment number, due date, amount, description
5. For budget tables: extract each budget category and amount
6. ALWAYS include these sections even if partially empty. Use "Not specified" for missing information.
7. Return ONLY valid JSON - ensure proper formatting with correct quotes and brackets.

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
    "objectives": ["array"],
    "scope_of_work": "string",
    "geographic_scope": "string",
    "risk_management": "string",
    "key_dates": {{
      "proposal_submission_date": "string",
      "approval_date": "string",
      "notification_date": "string"
    }}
  }},
  "financial_details": {{
    "total_grant_amount": "number",
    "currency": "string",
    "additional_currencies": ["array"],
    "payment_schedule": {{
      "schedule_type": "string",
      "installments": [
        {{
          "installment_number": "number",
          "amount": "number",
          "due_date": "string",
          "trigger_condition": "string",
          "description": "string",
          "currency": "string"
        }}
      ],
      "milestones": [
        {{
          "milestone_name": "string",
          "amount": "number",
          "due_date": "string",
          "deliverable": "string",
          "description": "string"
        }}
      ],
      "reimbursements": [
        {{
          "category": "string",
          "amount": "number",
          "conditions": "string"
        }}
      ]
    }},
    "budget_breakdown": {{
      "personnel": "number",
      "equipment": "number",
      "travel": "string",
      "materials": "number",
      "indirect_costs": "number",
      "other": "number",
      "contingency": "number",
      "overhead": "number",
      "subcontractors": "number"
    }},
    "additional_budget_items": [
      {{
        "category": "string",
        "amount": "number",
        "description": "string"
      }}
    ],
    "financial_reporting_requirements": "string",
    "financial_tables_summary": "string",
    "total_installments_amount": "number",
    "total_milestones_amount": "number",
    "payment_terms": "string"
  }},
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

Contract text (including all tables, headers, footers, appendices, and signature blocks):
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
                        "content": """You are a contract analysis expert with special expertise in document structure recognition AND financial contract analysis.

ULTRA-IMPORTANT FOR CONTRACT NAMES:
1. Scan the VERY BEGINNING of the document for logo text (often all caps)
2. Look for document titles BEFORE the "BETWEEN" clause
3. Extract text from header lines and formatted sections
4. Find the project name in phrases like "for the [Project Name]" after party names
5. If you see centered, bold, or all-caps text at the top, it's likely the contract name

DOCUMENT STRUCTURE AWARENESS:
- Recognize that logos often contain the project/program name
- Headers typically contain the document title
- The first substantive paragraph often names the project
- Signature blocks may repeat the contract name

CONTRACT NAME EXTRACTION RULES:
1. ALWAYS extract a contract name
2. Prefer descriptive names over generic ones
3. Look for names in quotes or after colons
4. If multiple candidates, choose the most specific one
5. Document where you found the name for validation

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

PAY SPECIAL ATTENTION TO:
- TABLES: extract all rows, columns, and data from any tables you find
- FINANCIAL DATA: extract ALL amounts with their currencies
- DATES: extract ALL dates in any format and convert to YYYY-MM-DD when possible
- SIGNATURES: extract names, titles, and dates from signature blocks

Be extremely thorough with ALL sections, not just financial data.
Be extremely thorough with numerical data and dates.

IMPORTANT: ALWAYS return valid, properly formatted JSON. Ensure all quotes are correct, all brackets are matched, and all arrays are properly formatted."""
                    },
                    {
                        "role": "user", 
                        "content": self.extraction_prompt.format(text=text[:15000])
                    }
                ],
                temperature=0.1,  # Lower temperature for more consistent extraction
                response_format={"type": "json_object"},
                max_tokens=7000  # Increased for comprehensive extraction
            )
            
            # Extract the response content
            response_content = response.choices[0].message.content
            
            # Clean and fix common JSON issues before parsing
            cleaned_json = self._clean_json_response(response_content)
            
            # Parse the JSON
            result = json.loads(cleaned_json)
            
            # Add timestamp if not present
            import datetime
            if "metadata" in result and "extraction_timestamp" not in result["metadata"]:
                result["metadata"]["extraction_timestamp"] = datetime.datetime.now().isoformat()
            
            # Validate and clean the extracted data
            result = self._validate_extracted_data(result)
            
            # Post-process to fill missing fields
            result = self._post_process_extracted_data(result, text[:5000])
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            print(f"Response content that failed to parse: {response_content[:500]}...")
            
            # Try to extract and fix JSON with enhanced methods
            try:
                fixed_json = self._extract_and_fix_json(response_content)
                result = json.loads(fixed_json)
                result = self._validate_extracted_data(result)
                result = self._post_process_extracted_data(result, text[:5000])
                return result
            except Exception as fix_error:
                print(f"Failed to fix JSON: {fix_error}")
                return self._get_empty_result()
                
        except Exception as e:
            print(f"Extraction error: {e}")
            import traceback
            traceback.print_exc()
            return self._get_empty_result()
    
    def _clean_json_response(self, json_string: str) -> str:
        """Clean JSON response from common formatting issues"""
        # Remove markdown code blocks
        if json_string.startswith("```json"):
            json_string = json_string[7:]
        if json_string.endswith("```"):
            json_string = json_string[:-3]
        json_string = json_string.strip()
        
        # Fix common issues
        json_string = re.sub(r',\s*}', '}', json_string)
        json_string = re.sub(r',\s*]', ']', json_string)
        json_string = re.sub(r'(\w+)\s*:\s*"(.*?[^\\])"', r'"\1": "\2"', json_string)
        
        # Fix unescaped quotes within strings
        json_string = re.sub(r'(?<!\\)"(.*?)(?<!\\)"(?=\s*[:,}\]])', lambda m: '"' + m.group(1).replace('"', '\\"') + '"', json_string)
        
        # Ensure proper array formatting
        json_string = re.sub(r'(\[|\{)\s*\]', r'\1]', json_string)
        json_string = re.sub(r'(\[|\{)\s*\}', r'\1}', json_string)
        
        return json_string
    
    def _extract_and_fix_json(self, text: str) -> str:
        """Extract and fix broken JSON from text"""
        # Try to find JSON object
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            json_text = json_match.group()
            
            # Fix common issues
            json_text = re.sub(r'(\w+)\s*:\s*([^"\s{}\[\],]+)(?=\s*[,}\]])', r'"\1": "\2"', json_text)
            
            # Fix missing quotes around keys
            json_text = re.sub(r'([{,]\s*)(\w+)(\s*:)', r'\1"\2"\3', json_text)
            
            # Fix trailing commas
            json_text = re.sub(r',\s*(?=[}\]])', '', json_text)
            
            # Fix unclosed brackets
            open_braces = json_text.count('{')
            close_braces = json_text.count('}')
            if open_braces > close_braces:
                json_text += '}' * (open_braces - close_braces)
            
            open_brackets = json_text.count('[')
            close_brackets = json_text.count(']')
            if open_brackets > close_brackets:
                json_text += ']' * (open_brackets - close_brackets)
            
            return json_text
        
        # If no JSON found, return empty structure
        return '{}'
    
    def _validate_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean extracted data for ALL fields"""
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
        
        # ENSURE ALL REQUIRED FIELDS ARE PRESENT
        
        # 1. Ensure contract_details has all fields
        if "contract_details" in data:
            contract_details = data["contract_details"]
            
            # Fields that should be strings with defaults
            string_fields = {
                "contract_number": None,
                "grant_name": None,
                "grant_reference": None,
                "agreement_type": None,
                "effective_date": None,
                "signature_date": None,
                "start_date": None,
                "end_date": None,
                "duration": None,
                "purpose": "Not specified",
                "scope_of_work": "Not specified",
                "geographic_scope": "Not specified",
                "risk_management": "Not specified"
            }
            
            for field, default in string_fields.items():
                if field not in contract_details or contract_details[field] is None:
                    contract_details[field] = default
            
            # Ensure objectives is an array
            if "objectives" not in contract_details:
                contract_details["objectives"] = []
            elif isinstance(contract_details["objectives"], str):
                # Split string into array if needed
                if contract_details["objectives"]:
                    contract_details["objectives"] = [obj.strip() for obj in contract_details["objectives"].split(';')]
                else:
                    contract_details["objectives"] = []
            
            # Ensure key_dates exists
            if "key_dates" not in contract_details:
                contract_details["key_dates"] = {
                    "proposal_submission_date": None,
                    "approval_date": None,
                    "notification_date": None
                }
        
        # 2. Ensure terms_conditions has all fields
        if "terms_conditions" in data:
            terms = data["terms_conditions"]
            
            string_fields = {
                "intellectual_property": "Not specified",
                "confidentiality": "Not specified",
                "liability": "Not specified",
                "termination_clauses": "Not specified",
                "renewal_options": "Not specified",
                "dispute_resolution": "Not specified",
                "governing_law": "Not specified",
                "force_majeure": "Not specified"
            }
            
            for field, default in string_fields.items():
                if field not in terms or terms[field] is None:
                    terms[field] = default
            
            # Ensure arrays exist
            if "key_obligations" not in terms:
                terms["key_obligations"] = []
            if "restrictions" not in terms:
                terms["restrictions"] = []
        
        # 3. Ensure compliance has all fields
        if "compliance" in data:
            compliance = data["compliance"]
            
            string_fields = {
                "audit_requirements": "Not specified",
                "record_keeping": "Not specified",
                "regulatory_compliance": "Not specified",
                "ethics_requirements": "Not specified"
            }
            
            for field, default in string_fields.items():
                if field not in compliance or compliance[field] is None:
                    compliance[field] = default
        
        # 4. Ensure parties have signatory information
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
        
        # 5. Ensure deliverables has enhanced reporting_requirements
        if "deliverables" in data:
            if "reporting_requirements" not in data["deliverables"]:
                data["deliverables"]["reporting_requirements"] = {}
            
            reporting = data["deliverables"]["reporting_requirements"]
            if "format_requirements" not in reporting:
                reporting["format_requirements"] = "Not specified"
            if "submission_method" not in reporting:
                reporting["submission_method"] = "Not specified"
        
        # 6. Ensure extended_data has all sections
        if "extended_data" in data:
            if "signatures_found" not in data["extended_data"]:
                data["extended_data"]["signatures_found"] = []
        
        return data
    
    def _post_process_extracted_data(self, data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Post-process extracted data to fill missing fields with intelligent extraction"""
        # 1. ENHANCED CONTRACT NAME EXTRACTION
        if not data.get("contract_details", {}).get("grant_name"):
            contract_details = data.setdefault("contract_details", {})
            
            # Strategy 1: Look for document titles BEFORE "BETWEEN" or "AGREEMENT BETWEEN"
            patterns_pre_between = [
                # Pattern: Title before "BETWEEN"
                r'^(.*?)\s*(?:GRANT\s+)?(?:AGREEMENT|CONTRACT|MEMORANDUM OF UNDERSTANDING)\s*(?:NO\.?[:\s]*[A-Z0-9-]+)?\s*(?:BETWEEN|AMONG)\s+',
                # Pattern: "THIS" followed by agreement type and name
                r'THIS\s+(?:GRANT\s+)?(?:AGREEMENT|CONTRACT|MEMORANDUM)\s+(?:IS\s+MADE\s+)?(?:FOR|ENTITLED|TITLED)[:\s]+["\']?(.+?)["\']?(?:\s+BY\s+AND\s+BETWEEN|\s+BETWEEN|\.|$)',
                # Pattern: Logo text detection (often all caps)
                r'\n([A-Z][A-Z\s&,\-\'\(\)]{10,60})\n\s*(?:Logo|L O G O|\\/\\s*logo\\s*\\/\\s*)?\n',
                # Pattern: Header lines (often centered or bold)
                r'\n\s*([A-Z][A-Za-z0-9\s&,\-:\(\)]{10,80})\n\s*[-=~*_]{10,}\n',
            ]
            
            # Check first 500 characters (where titles usually are)
            first_section = original_text[:500]
            for pattern in patterns_pre_between:
                match = re.search(pattern, first_section, re.IGNORECASE | re.DOTALL)
                if match:
                    potential_name = match.group(1).strip()
                    # Clean the extracted name
                    if len(potential_name) > 5 and len(potential_name) < 100:
                        # Remove common prefixes/suffixes
                        clean_name = re.sub(r'^(?:THE\s+|A\s+|AN\s+|THIS\s+)', '', potential_name, flags=re.IGNORECASE)
                        clean_name = re.sub(r'\s+(?:AGREEMENT|CONTRACT|GRANT|PROJECT|PROGRAM)$', '', clean_name, flags=re.IGNORECASE)
                        if clean_name and not re.search(r'^\d+$', clean_name):  # Not just numbers
                            contract_details["grant_name"] = clean_name
                            contract_details["name_extraction_method"] = "pre_between_pattern"
                            break
            
            # Strategy 2: Look for "Project:" or "Title:" markers
            if not contract_details.get("grant_name"):
                marker_patterns = [
                    r'(?:Project\s*Name|Title|Grant\s*Title)[:\s]+["\']?(.+?)["\']?(?:\n|\.|;)',
                    r'RE:\s*["\']?(.+?)["\']?(?:\n|\.|;)',
                    r'SUBJECT:\s*["\']?(.+?)["\']?(?:\n|\.|;)',
                    r'^[A-Z\s]{10,50}\n(?:for|regarding)\s+["\']?(.+?)["\']?(?:\n|\.|$)',
                ]
                
                for pattern in marker_patterns:
                    match = re.search(pattern, first_section, re.IGNORECASE)
                    if match:
                        potential_name = match.group(1).strip()
                        if 5 < len(potential_name) < 100:
                            contract_details["grant_name"] = potential_name
                            contract_details["name_extraction_method"] = "marker_pattern"
                            break
            
            # Strategy 3: Extract from between parties (common format)
            if not contract_details.get("grant_name"):
                between_pattern = r'(?:BETWEEN|AMONG)\s+(.+?)\s+(?:AND|&)\s+(.+?)(?:\s+for\s+["\']?(.+?)["\']?|\s+relating\s+to\s+["\']?(.+?)["\']?|\s+regarding\s+["\']?(.+?)["\']?|\s+concerning\s+["\']?(.+?)["\']?)'
                match = re.search(between_pattern, first_section, re.IGNORECASE)
                if match:
                    for i in range(3, 7):  # Check groups 3-6 (the "for X" parts)
                        if match.group(i):
                            potential_name = match.group(i).strip()
                            if 5 < len(potential_name) < 100:
                                contract_details["grant_name"] = potential_name
                                contract_details["name_extraction_method"] = "between_parties_pattern"
                                break
            
            # Strategy 4: Smart fallback - Use the most descriptive line from first paragraph
            if not contract_details.get("grant_name"):
                # Get the first paragraph (before first double newline)
                first_para_match = re.search(r'^(.+?)(?:\n\s*\n|$)', original_text[:1000], re.DOTALL)
                if first_para_match:
                    first_para = first_para_match.group(1)
                    # Find the most meaningful line
                    lines = [line.strip() for line in first_para.split('\n') if line.strip()]
                    for line in lines:
                        if (30 < len(line) < 200 and 
                            not re.search(r'^\d', line) and
                            not re.search(r'page|confidential|proprietary', line, re.IGNORECASE) and
                            re.search(r'\b(?:grant|project|initiative|program|agreement|contract)\b', line, re.IGNORECASE)):
                            contract_details["grant_name"] = line
                            contract_details["name_extraction_method"] = "first_paragraph_fallback"
                            break
            
            # Final fallback: Use first meaningful line
            if not contract_details.get("grant_name"):
                lines = [line.strip() for line in original_text[:300].split('\n') if line.strip()]
                for line in lines:
                    if (10 < len(line) < 150 and 
                        not re.search(r'^\s*$', line) and
                        not re.search(r'^\d', line) and
                        not re.search(r'^(?:to|and|the|of|in|for|by|with|from|at|on|as|is|was|be|are|were|have|has|had|do|does|did|will|would|should|could|can|may|might|must)$', line, re.IGNORECASE)):
                        contract_details["grant_name"] = line
                        contract_details["name_extraction_method"] = "first_line_fallback"
                        break
        
        # 2. Clean up the contract name if found
        if "contract_details" in data and data["contract_details"].get("grant_name"):
            name = data["contract_details"]["grant_name"]
            # Clean up the name
            name = re.sub(r'\s+', ' ', name).strip()
            # Remove common prefixes
            name = re.sub(r'^(?:MEMORANDUM OF UNDERSTANDING|GRANT AGREEMENT|CONTRACT|AGREEMENT)\s*[:-]?\s*', '', name, flags=re.IGNORECASE)
            # Remove quotes
            name = re.sub(r'^["\']|["\']$', '', name)
            
            # If name is still valid, keep it
            if 3 <= len(name) <= 200:
                data["contract_details"]["grant_name"] = name
            else:
                # Name is too short or too long
                data["contract_details"]["grant_name"] = None
        
        # 3. Add metadata about name extraction
        if "contract_details" in data:
            contract_details = data["contract_details"]
            if "name_extraction_method" not in contract_details:
                contract_details["name_extraction_method"] = "AI_extraction" if contract_details.get("grant_name") else "not_found"
            
            # Add confidence score for name extraction
            if "grant_name" in contract_details:
                # Calculate confidence based on extraction method
                confidence_map = {
                    "pre_between_pattern": 0.9,
                    "marker_pattern": 0.8,
                    "between_parties_pattern": 0.7,
                    "program_pattern": 0.6,
                    "first_paragraph_fallback": 0.5,
                    "first_line_fallback": 0.4,
                    "AI_extraction": 0.85
                }
                method = contract_details.get("name_extraction_method", "AI_extraction")
                contract_details["name_extraction_confidence"] = confidence_map.get(method, 0.5)
        
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
                    "signatory_name": None,
                    "signatory_title": None,
                    "signature_date": None
                },
                "grantee": {
                    "organization_name": None,
                    "address": None,
                    "contact_person": None,
                    "email": None,
                    "phone": None,
                    "signatory_name": None,
                    "signatory_title": None,
                    "signature_date": None
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
                "purpose": "Not specified",
                "objectives": [],
                "scope_of_work": "Not specified",
                "geographic_scope": "Not specified",
                "risk_management": "Not specified",
                "key_dates": {
                    "proposal_submission_date": None,
                    "approval_date": None,
                    "notification_date": None
                }
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
                    "due_dates": [],
                    "format_requirements": "Not specified",
                    "submission_method": "Not specified"
                }
            },
            "terms_conditions": {
                "intellectual_property": "Not specified",
                "confidentiality": "Not specified",
                "liability": "Not specified",
                "termination_clauses": "Not specified",
                "renewal_options": "Not specified",
                "dispute_resolution": "Not specified",
                "governing_law": "Not specified",
                "force_majeure": "Not specified",
                "key_obligations": [],
                "restrictions": []
            },
            "compliance": {
                "audit_requirements": "Not specified",
                "record_keeping": "Not specified",
                "regulatory_compliance": "Not specified",
                "ethics_requirements": "Not specified"
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
                "table_data_extracted": [],
                "signatures_found": []
            }
        }