import openai
import json
import re
import hashlib
from typing import Dict, Any, List, Optional
from app.config import settings
import os
from datetime import datetime
import sys
import pickle
from pathlib import Path

class AIExtractor:
    def __init__(self):
        # Clean environment
        self._clean_environment()
        self.api_key = settings.OPENAI_API_KEY
        
        # Initialize client
        self.client = self._create_openai_client()
        
        # Cache directory for deterministic extraction
        self.cache_dir = Path("./.extraction_cache")
        self.cache_dir.mkdir(exist_ok=True)
        
        # Define the comprehensive but optimized prompt with STRONG EMPHASIS on deliverables
        self.extraction_prompt = """ANALYZE THIS GRANT CONTRACT AND EXTRACT ALL INFORMATION.

CRITICAL PRIORITY: EXTRACT ALL DELIVERABLES & REPORTING REQUIREMENTS

MOST IMPORTANT FIELDS (EXTRACT THESE FIRST):
1. CONTRACT TITLE/NAME - Look at beginning of document, headers, logo area
2. GRANTOR & GRANTEE - Look for "BETWEEN [Grantor] AND [Grantee]"
3. CONTRACT/GRANT REFERENCE NUMBER - Any alphanumeric ID
4. TOTAL GRANT AMOUNT - Look for dollar amounts, "total grant", "amount"
5. START AND END DATES - Look for "effective date", "commencement", "term"
6. DELIVERABLES - Extract EVERY deliverable, milestone, task, output
7. PAYMENT SCHEDULE - Extract ALL payment details from tables or text

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

D. DATES & TIMELINES
- All dates mentioned (convert to YYYY-MM-DD)
- Duration of agreement
- Key milestone dates
- Reporting deadlines

E. DELIVERABLES & REPORTING (COMPREHENSIVE - NO CHUNKS)
- **MANDATORY**: Extract ALL deliverables. If no explicit deliverables found, create logical ones from project description
- Extract EACH deliverable with complete name and description
- Deliverable due dates in YYYY-MM-DD format
- Deliverable status (default: "pending")
- Reporting frequency (monthly, quarterly, annually)
- ALL report types (progress, financial, technical, final, etc.)
- Report due dates as array of YYYY-MM-DD
- Report format requirements (PDF, Word, Excel, etc.)
- Submission method (email, portal, physical)
- Report recipients

DELIVERABLE EXTRACTION RULES (MOST IMPORTANT):
1. Look for sections titled: "Deliverables", "Outputs", "Milestones", "Tasks", "Work Packages"
2. Extract any numbered or bulleted lists describing work items
3. If deliverables aren't explicitly listed, extract them from scope of work or project description
4. Each deliverable MUST have: name, description, due date (or estimate if not specified)
5. Minimum 2 deliverables MUST be extracted from every contract
6. If no deliverables found, create logical ones based on project purpose

CRITICAL RULES:
1. For dates: Convert any format to YYYY-MM-DD
2. For amounts: Extract numbers, remove currency symbols
3. For missing fields: Use "Not specified" or empty array
4. If information is in tables: Extract ALL table rows and columns
5. Focus on EXACT text from document, don't infer or create data (except for deliverables which MUST be extracted)

TABLES ARE CRITICAL:
- Payment schedule tables: Extract every row
- Budget tables: Extract all categories and amounts
- Milestone tables: Extract all milestones
- Deliverable tables: Extract ALL deliverables

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
            }
        }, indent=2)
    
    def extract_contract_data(self, text: str) -> Dict[str, Any]:
        """Extract comprehensive structured data from contract text with deterministic caching"""
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
            
            # Create a deterministic hash of the text for caching
            text_hash = self._create_text_hash(processed_text[:12000])
            cache_file = self.cache_dir / f"{text_hash}.pkl"
            
            # Check if we have a cached extraction for this exact text
            if cache_file.exists():
                print(f"📦 Loading cached extraction for text hash: {text_hash[:8]}...")
                try:
                    with open(cache_file, 'rb') as f:
                        cached_result = pickle.load(f)
                    # Add fresh timestamp
                    cached_result["metadata"]["extraction_timestamp"] = datetime.now().isoformat()
                    return cached_result
                except Exception as e:
                    print(f"⚠️ Cache load failed: {e}")
            
            print(f"🔍 No cache found, extracting from text hash: {text_hash[:8]}...")
            
            # Use GPT-4o with enhanced focus on deliverables - WITH DETERMINISTIC SETTINGS
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a contract analysis expert with special focus on deliverables and reporting requirements.
                        Your PRIMARY TASK is to extract ALL deliverables from grant contracts.
                        NEVER return empty deliverables array. If deliverables aren't explicitly listed, extract them from scope of work or project description.
                        Create at least 2 logical deliverables based on contract purpose if none are found.
                        Be extremely thorough with deliverables extraction.
                        For other fields: Extract dates, amounts, names, clauses, tables, schedules.
                        If information is missing, use "Not specified".
                        Convert dates to YYYY-MM-DD format.
                        Return ONLY valid JSON."""
                    },
                    {
                        "role": "user", 
                        "content": self.extraction_prompt.format(
                            json_structure=self._get_json_structure(),
                            text=processed_text[:12000]
                        )
                    }
                ],
                temperature=0.1,  # Very low temperature for consistency
                response_format={"type": "json_object"},
                max_tokens=3000  # Increased for better deliverables extraction
            )
            
            # Parse response
            result = json.loads(response.choices[0].message.content)
            
            # Add timestamp
            result["metadata"]["extraction_timestamp"] = datetime.now().isoformat()
            
            # Add reference IDs
            result["reference_ids"] = self.extract_reference_ids(processed_text, result.get("contract_details", {}))
            
            # Add detailed scope extraction
            if "contract_details" in result:
                if "scope_of_work" not in result["contract_details"] or not result["contract_details"]["scope_of_work"]:
                    result["contract_details"]["scope_of_work"] = self._extract_scope_from_text(processed_text)
                
                # Add detailed scope structure
                result["contract_details"]["detailed_scope_of_work"] = self._extract_detailed_scope(processed_text)
            
            # ENHANCED: Post-process with special focus on deliverables
            result = self._validate_and_enhance_deliverables(result, processed_text)
            
            # Add summary section
            result["summary"] = self._generate_summary(result)
            
            # Add extended data section
            result["extended_data"] = self._extract_extended_data(processed_text, result)
            
            # Cache the result for future identical extractions
            try:
                with open(cache_file, 'wb') as f:
                    pickle.dump(result, f)
                print(f"💾 Cached extraction for future use: {text_hash[:8]}")
            except Exception as e:
                print(f"⚠️ Cache save failed: {e}")
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            # Try to fix JSON
            try:
                json_match = re.search(r'\{.*\}', response.choices[0].message.content, re.DOTALL)
                if json_match:
                    fixed_json = json_match.group()
                    # Clean common JSON issues
                    fixed_json = re.sub(r',\s*}', '}', fixed_json)
                    fixed_json = re.sub(r',\s*]', ']', fixed_json)
                    result = json.loads(fixed_json)
                    return self._validate_and_enhance_deliverables(result, processed_text)
            except:
                pass
            return self._get_empty_result()
        except Exception as e:
            print(f"Extraction error: {e}")
            import traceback
            traceback.print_exc()
            return self._get_empty_result()
    
    def _create_text_hash(self, text: str) -> str:
        """Create deterministic hash of text for caching"""
        # Normalize text for consistent hashing
        normalized_text = text.strip().lower()
        normalized_text = re.sub(r'\s+', ' ', normalized_text)  # Normalize whitespace
        return hashlib.md5(normalized_text.encode('utf-8')).hexdigest()
    
    def _validate_and_enhance_deliverables(self, data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Special validation with enhanced deliverables extraction - FIXED DETERMINISTIC VERSION"""
        # First, run the standard validation
        data = self._validate_and_enhance_data(data, original_text)
        
        # ENHANCED DELIVERABLES HANDLING
        if "deliverables" not in data:
            data["deliverables"] = {}
        
        deliverables = data["deliverables"]
        
        # Ensure items exist and are not empty
        if "items" not in deliverables or not deliverables["items"]:
            deliverables["items"] = []
        
        # If no deliverables were extracted, create them from the contract text
        if not deliverables["items"] or len(deliverables["items"]) == 0:
            print("WARNING: No deliverables extracted. Creating from contract text...")
            extracted_deliverables = self._extract_deliverables_from_text(original_text)
            deliverables["items"] = extracted_deliverables
        
        # Validate and normalize each deliverable - CRITICAL: Sort them for consistency
        for item in deliverables["items"]:
            # Ensure required fields
            if "deliverable_name" not in item or not item["deliverable_name"]:
                item["deliverable_name"] = "Unnamed Deliverable"
            if "description" not in item or not item["description"]:
                item["description"] = "Description not specified in contract"
            if "due_date" not in item or not item["due_date"]:
                # Try to extract a date from the contract
                item["due_date"] = self._extract_deliverable_due_date(original_text, item.get("deliverable_name", ""))
            if "status" not in item:
                item["status"] = "pending"
        
        # Sort deliverables by due date, then name for consistency
        deliverables["items"] = sorted(
            deliverables["items"],
            key=lambda x: (
                x.get("due_date", "9999-12-31"),
                x.get("deliverable_name", "").lower()
            )
        )
        
        # Ensure reporting_requirements section exists and is populated
        if "reporting_requirements" not in deliverables:
            deliverables["reporting_requirements"] = {}
        
        reporting = deliverables["reporting_requirements"]
        
        # Enhanced reporting requirements extraction
        required_fields = {
            "frequency": self._extract_reporting_frequency(original_text),
            "report_types": self._extract_report_types(original_text),
            "due_dates": sorted(self._extract_reporting_due_dates(original_text)),  # Sort for consistency
            "format_requirements": self._extract_reporting_format(original_text),
            "submission_method": self._extract_submission_method(original_text),
            "recipients": sorted(self._extract_report_recipients(original_text))  # Sort for consistency
        }
        
        # Update with extracted values if current ones are empty
        for field, extracted_value in required_fields.items():
            if field not in reporting or not reporting[field] or (isinstance(reporting[field], list) and len(reporting[field]) == 0):
                reporting[field] = extracted_value
        
        # Sort arrays for consistency
        if isinstance(reporting.get("report_types"), list):
            reporting["report_types"] = sorted(reporting["report_types"])
        if isinstance(reporting.get("recipients"), list):
            reporting["recipients"] = sorted(reporting["recipients"])
        
        return data

    def _validate_and_enhance_data(self, data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Validate and enhance extracted data - FIXED FOR CONSISTENCY"""
        # Ensure all sections exist
        required_sections = [
            "metadata", "parties", "contract_details", "financial_details",
            "deliverables"
        ]
        
        for section in required_sections:
            if section not in data:
                data[section] = self._get_empty_section(section)
        
        # Fix contract name if missing
        if "contract_details" in data:
            contract_details = data["contract_details"]
            
            if not contract_details.get("grant_name"):
                # Try to extract from text - use FIRST match only for consistency
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
        
        # Fix financial amounts - ALWAYS use the same method
        if "financial_details" in data:
            financial = data["financial_details"]
            
            # Ensure payment_schedule exists
            if "payment_schedule" not in financial:
                financial["payment_schedule"] = {
                    "schedule_type": "Not specified",
                    "installments": [],
                    "milestones": []
                }
            
            # Try to extract payment info from text if missing - use FIRST match
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
            
            # Sort installments and milestones for consistency
            payment_schedule = financial.get("payment_schedule", {})
            if isinstance(payment_schedule.get("installments"), list):
                payment_schedule["installments"] = sorted(
                    payment_schedule["installments"],
                    key=lambda x: (
                        x.get("installment_number", 999),
                        x.get("due_date", "9999-12-31")
                    )
                )
            
            if isinstance(payment_schedule.get("milestones"), list):
                payment_schedule["milestones"] = sorted(
                    payment_schedule["milestones"],
                    key=lambda x: (
                        x.get("due_date", "9999-12-31"),
                        x.get("milestone_name", "").lower()
                    )
                )

        return data

    # UPDATED METHODS FOR CONSISTENT DELIVERABLES EXTRACTION
    def _extract_deliverables_from_text(self, text: str) -> List[Dict[str, str]]:
        """Extract deliverables from contract text using multiple methods - FIXED FOR CONSISTENCY"""
        deliverables = []
        
        # print("DEBUG: Starting CONSISTENT deliverables extraction from text...")
        
        # Method 1: Look for explicit deliverables sections
        deliverable_patterns = [
            r'(?:Deliverable|Output|Milestone|Task|Work Package)\s*(?:#|No\.?|Number)?\s*\d+[:\-\s]+(.+?)(?=\n|Deliverable|Output|Milestone|Task|$|\.)',
            r'(?:shall deliver|will provide|to deliver|to provide)[:\s]+(.+?)(?=\n|\.)',
            r'(?:deliverable|output|milestone)[:\s]+(.+?)(?=\n|\.)',
        ]
        
        # Process patterns in a fixed order for consistency
        for pattern in deliverable_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            # Sort matches for consistency
            matches = sorted(matches, key=lambda x: x.lower() if isinstance(x, str) else "")
            for match in matches:
                if isinstance(match, str) and len(match.strip()) > 10:
                    deliverable_name = match.strip()
                    # Clean up the name - CONSISTENT cleaning
                    deliverable_name = re.sub(r'^(Deliverable|Output|Milestone|Task)\s*\d+\s*[:\-\s]*', '', deliverable_name, flags=re.IGNORECASE)
                    deliverable_name = deliverable_name.strip()
                    
                    if deliverable_name and len(deliverable_name) > 5:
                        # Check if we already have this deliverable (case-insensitive)
                        existing_names = [d["deliverable_name"].lower() for d in deliverables]
                        if deliverable_name.lower() not in existing_names:
                            deliverables.append({
                                "deliverable_name": deliverable_name[:100],
                                "description": self._extract_deliverable_description(text, deliverable_name),
                                "due_date": self._extract_deliverable_due_date(text, deliverable_name),
                                "status": "pending"
                            })
        
        # Method 2: Extract numbered/bulleted items for consistency
        if len(deliverables) < 2:
            # Extract numbered items (1., 2., etc.)
            numbered_pattern = r'^\s*(\d+)\.\s+(.+?)(?=\n|$)'
            numbered_matches = re.findall(numbered_pattern, text, re.MULTILINE)
            
            for number, content in numbered_matches[:5]:  # Take up to 5
                if len(content.strip()) > 10:
                    deliverables.append({
                        "deliverable_name": f"Deliverable {number}: {content.strip()[:80]}",
                        "description": f"Complete item {number} as specified in contract",
                        "due_date": self._extract_next_date(text, 90),
                        "status": "pending"
                    })
        
        # Method 3: Extract from scope/objectives if still not enough
        if len(deliverables) < 2:
            # print("DEBUG: Extracting from objectives for consistency...")
            
            # Extract objectives from text
            objectives = re.findall(r'(?:Objective|Goal|Aim)\s*\d*[:\-\s]+(.+?)(?=\n|Objective|Goal|Aim|\.)', text, re.IGNORECASE)
            objectives = sorted(objectives, key=lambda x: x.lower())  # Sort for consistency
            
            for i, objective in enumerate(objectives[:3]):  # Take up to 3 objectives
                if len(objective.strip()) > 15:
                    deliverables.append({
                        "deliverable_name": f"Deliverable {i+1}: {objective.strip()[:80]}",
                        "description": f"Complete {objective.strip()} as specified in contract objectives",
                        "due_date": self._extract_next_date(text, 90),
                        "status": "pending"
                    })
        
        # Method 4: Create standard generic deliverables if still none found
        if len(deliverables) == 0:
            # print("DEBUG: Creating STANDARD generic deliverables...")
            # Always create the SAME generic deliverables for consistency
            deliverables = [
                {
                    "deliverable_name": "Project Inception Report",
                    "description": "Initial project setup and planning documentation",
                    "due_date": self._extract_next_date(text, 30),
                    "status": "pending"
                },
                {
                    "deliverable_name": "Final Project Report",
                    "description": "Comprehensive final report summarizing project outcomes",
                    "due_date": self._extract_next_date(text, 180),
                    "status": "pending"
                }
            ]
        
        # Sort deliverables for consistency
        deliverables = sorted(
            deliverables,
            key=lambda x: (
                x.get("deliverable_name", "").lower(),
                x.get("due_date", "9999-12-31")
            )
        )[:10]  # Limit to 10 deliverables
        
        # print(f"DEBUG: Extracted {len(deliverables)} CONSISTENT deliverables")
        return deliverables

    # REST OF THE METHODS REMAIN THE SAME (except for consistency fixes)
    def _extract_deliverable_description(self, text: str, deliverable_name: str) -> str:
        """Extract description for a deliverable - CONSISTENT"""
        # Look for description near the deliverable name
        name_escaped = re.escape(deliverable_name[:50])  # Use first 50 chars
        pattern = f'{name_escaped}[^.]*\.'
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Use FIRST match for consistency
            return matches[0].strip()
        
        # If no description found, create consistent ones based on deliverable type
        deliverable_lower = deliverable_name.lower()
        if 'report' in deliverable_lower:
            return "Detailed report as specified in contract requirements"
        elif 'plan' in deliverable_lower:
            return "Comprehensive planning document"
        elif 'analysis' in deliverable_lower or 'study' in deliverable_lower:
            return "Analytical document with findings and recommendations"
        elif 'training' in deliverable_lower or 'workshop' in deliverable_lower:
            return "Training/workshop session with materials"
        elif 'software' in deliverable_lower or 'tool' in deliverable_lower:
            return "Software/tool development and documentation"
        
        return "Deliverable as specified in contract scope of work"

    def _extract_deliverable_due_date(self, text: str, deliverable_name: str) -> str:
        """Extract due date for a deliverable - CONSISTENT"""
        # Look for dates near the deliverable
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',
            r'\d{2}/\d{2}/\d{4}',
            r'\d{2}-\d{2}-\d{4}',
            r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}'
        ]
        
        # Search in a window around the deliverable name
        name_pos = text.lower().find(deliverable_name.lower())
        if name_pos != -1:
            start = max(0, name_pos - 200)
            end = min(len(text), name_pos + len(deliverable_name) + 200)
            context = text[start:end]
            
            for pattern in date_patterns:
                matches = re.findall(pattern, context, re.IGNORECASE)
                if matches:
                    # Use FIRST match for consistency
                    return self._normalize_date(matches[0])
        
        # If no date found, return a calculated date based on contract duration
        return self._extract_next_date(text, 90)  # Default: 90 days from now

    def _extract_next_date(self, text: str, days_from_now: int) -> str:
        """Extract a date by adding days to contract start date or current date"""
        # Try to find contract start date
        start_date_patterns = [
            r'(?:start date|commencement date|effective date)[:\s]*(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})',
            r'(?:Date.*?)\s+(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})'
        ]
        
        for pattern in start_date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    start_date = self._normalize_date(match.group(1))
                    if start_date:
                        # Parse the date and add days
                        from datetime import datetime, timedelta
                        parsed_date = datetime.strptime(start_date, "%Y-%m-%d")
                        new_date = parsed_date + timedelta(days=days_from_now)
                        return new_date.strftime("%Y-%m-%d")
                except:
                    pass
        
        # If no start date found, use current date + days
        from datetime import datetime, timedelta
        new_date = datetime.now() + timedelta(days=days_from_now)
        return new_date.strftime("%Y-%m-%d")

    def _normalize_date(self, date_str: str) -> str:
        """Normalize date to YYYY-MM-DD format"""
        try:
            # Remove any leading/trailing whitespace
            date_str = date_str.strip()
            
            # Try different formats
            formats = [
                "%Y-%m-%d",
                "%d/%m/%Y",
                "%m/%d/%Y",
                "%d-%m-%Y",
                "%B %d, %Y",
                "%b %d, %Y",
                "%d %B %Y",
                "%d %b %Y"
            ]
            
            for fmt in formats:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    return dt.strftime("%Y-%m-%d")
                except:
                    continue
        except:
            pass
        
        return ""  # Return empty if can't parse

    def _extract_reporting_frequency(self, text: str) -> str:
        """Extract reporting frequency from text"""
        frequency_patterns = [
            r'(?:reporting frequency|reports due|submit reports)[:\s]*(monthly|quarterly|annually|weekly|bi-weekly|semi-annually)',
            r'(?:shall submit|will submit)\s+(?:a|an)?\s*(monthly|quarterly|annual)',
            r'(?:monthly report|quarterly report|annual report|weekly report)'
        ]
        
        for pattern in frequency_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                freq = match.group(1).lower()
                if freq in ['monthly', 'quarterly', 'annually', 'weekly']:
                    return freq
        
        return "quarterly"  # Default frequency

    def _extract_reporting_due_dates(self, text: str) -> List[str]:
        """Extract reporting due dates from text"""
        dates = []
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',
            r'\d{2}/\d{2}/\d{4}'
        ]
        
        # Look for dates in reporting context
        reporting_context = re.search(r'(?:report|submit|deliver).*?(?:by|due|on).*?(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})', text, re.IGNORECASE | re.DOTALL)
        if reporting_context:
            for pattern in date_patterns:
                matches = re.findall(pattern, reporting_context.group(0), re.IGNORECASE)
                for match in matches:
                    normalized = self._normalize_date(match)
                    if normalized:
                        dates.append(normalized)
        
        return dates[:5]  # Return up to 5 dates

    def _extract_reporting_format(self, text: str) -> str:
        """Extract reporting format requirements"""
        format_patterns = [
            r'(?:format|submit|deliver).*?(?:PDF|Word|Excel|docx|doc|xlsx|csv|PowerPoint|pptx)',
            r'(?:in|as).*?(?:electronic|digital|hard copy|printed)'
        ]
        
        for pattern in format_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)[:100]
        
        return "PDF or Word document"

    def _extract_submission_method(self, text: str) -> str:
        """Extract submission method"""
        method_patterns = [
            r'(?:submit|send|deliver).*?(?:email|portal|online platform|physical copy|mail)',
            r'(?:via|by).*?(?:email|portal|post|courier)'
        ]
        
        for pattern in method_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)[:100]
        
        return "Email submission"

    def _extract_report_recipients(self, text: str) -> List[str]:
        """Extract report recipients"""
        recipients = []
        
        # Look for grantor organization name
        grantor_patterns = [
            r'(?:grantor|funder|donor|sponsor).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'(?:submit to|send to|report to).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
        ]
        
        for pattern in grantor_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if len(match.strip()) > 3 and match.strip() not in recipients:
                    recipients.append(match.strip())
        
        if not recipients:
            recipients = ["Grantor Organization", "Project Manager"]
        
        return recipients[:5]  # Return up to 5 recipients

    # The rest of the methods remain exactly the same as before
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
        
        # Extract deliverables (using enhanced method)
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
        
        # Ensure at least one report type
        if not unique_reports:
            unique_reports = ["Progress Report", "Final Report"]
        
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
        deliverables = data.get("deliverables", {})
        
        grantor = parties.get("grantor", {}).get("organization_name", "Unknown Grantor")
        grantee = parties.get("grantee", {}).get("organization_name", "Unknown Grantee")
        grant_name = contract_details.get("grant_name", "Grant Agreement")
        total_amount = financial.get("total_grant_amount", 0)
        currency = financial.get("currency", "USD")
        deliverables_count = len(deliverables.get("items", [])) if deliverables else 0
        
        summary["executive_summary"] = (
            f"{grant_name} between {grantor} and {grantee}. "
            f"Total grant amount: {currency} {total_amount:,.2f}. "
            f"Purpose: {contract_details.get('purpose', 'Not specified')[:200]}. "
            f"Deliverables: {deliverables_count} items specified."
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
            "signatures_found": self._extract_signatures(text),
            "deliverables_extracted_count": len(main_data.get("deliverables", {}).get("items", [])) if main_data.get("deliverables") else 0
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
            "deliverables": {
                "items": [
                    {
                        "deliverable_name": "Project Inception Report",
                        "description": "Initial project setup and planning documentation",
                        "due_date": datetime.now().strftime("%Y-%m-%d"),
                        "status": "pending"
                    },
                    {
                        "deliverable_name": "Final Project Report",
                        "description": "Comprehensive final report summarizing project outcomes",
                        "due_date": (datetime.now().replace(month=datetime.now().month + 6)).strftime("%Y-%m-%d"),
                        "status": "pending"
                    }
                ],
                "reporting_requirements": {
                    "frequency": "quarterly",
                    "report_types": ["Progress Report", "Final Report"],
                    "due_dates": [],
                    "format_requirements": "PDF or Word document",
                    "submission_method": "Email submission",
                    "recipients": ["Grantor Organization"]
                }
            }
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
        """Return empty result structure WITH GUARANTEED DELIVERABLES"""
        from datetime import datetime, timedelta
        
        # Create default deliverables
        default_deliverables = [
            {
                "deliverable_name": "Project Inception Report",
                "description": "Initial project setup and planning documentation",
                "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
                "status": "pending"
            },
            {
                "deliverable_name": "Final Project Report", 
                "description": "Comprehensive final report summarizing project outcomes",
                "due_date": (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d"),
                "status": "pending"
            }
        ]
        
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
                "items": default_deliverables,
                "reporting_requirements": {
                    "frequency": "quarterly",
                    "report_types": ["Progress Report", "Financial Report", "Final Report"],
                    "due_dates": [],
                    "format_requirements": "PDF format preferred",
                    "submission_method": "Email to grantor",
                    "recipients": ["Grantor Organization"]
                }
            },
            "reference_ids": {
                "investment_id": None,
                "project_id": None,
                "grant_id": None,
                "extracted_reference_ids": []
            },
            "summary": {
                "executive_summary": "No data extracted. Basic contract information missing.",
                "key_dates_summary": "No dates found",
                "financial_summary": "No financial data found",
                "deliverables_summary": f"{len(default_deliverables)} deliverables specified"
            },
            "extended_data": {
                "all_dates_found": [],
                "all_amounts_found": [],
                "table_data_extracted": [],
                "signatures_found": [],
                "deliverables_extracted_count": len(default_deliverables)
            }
        }
    def extract_reporting_schedule(pdf_text: str) -> list:
        """
        Extract reporting schedules, deliverables, milestones and payment schedules
        from the contract text using LLM structured output.
        """
  
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