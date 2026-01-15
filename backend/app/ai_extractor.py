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
        self.extraction_prompt = """Analyze the following grant contract text and extract ALL relevant information comprehensively.
        Provide detailed extraction in the JSON format below. Be thorough and extract as much information as possible.

        IMPORTANT INSTRUCTIONS:
        1. Extract ALL dates mentioned (signature dates, effective dates, start dates, end dates, milestone dates)
        2. Extract ALL monetary amounts (total amounts, installments, milestones, reimbursements)
        3. Extract ALL parties involved (full names, addresses, contact information)
        4. Extract ALL key clauses and terms
        5. If information is not found, use null
        6. For amounts, always include currency if specified
        7. For dates, try to format as YYYY-MM-DD when possible

        Return ONLY valid JSON in this exact format:
        {{
          "metadata": {{
            "document_type": "string",
            "extraction_confidence": "number between 0 and 1",
            "pages_extracted_from": "number or null",
            "extraction_timestamp": "current timestamp in ISO format"
          }},
          
          "parties": {{
            "grantor": {{
              "organization_name": "string or null",
              "address": "string or null",
              "contact_person": "string or null",
              "email": "string or null",
              "phone": "string or null"
            }},
            "grantee": {{
              "organization_name": "string or null",
              "address": "string or null",
              "contact_person": "string or null",
              "email": "string or null",
              "phone": "string or null"
            }},
            "other_parties": [
              {{
                "role": "string",
                "name": "string",
                "details": "string"
              }}
            ]
          }},
          
          "contract_details": {{
            "contract_number": "string or null",
            "grant_name": "string or null",
            "grant_reference": "string or null",
            "agreement_type": "string or null",
            "effective_date": "string or null",
            "signature_date": "string or null",
            "start_date": "string or null",
            "end_date": "string or null",
            "duration": "string or null",
            "purpose": "string or null",
            "objectives": ["array of strings"],
            "scope_of_work": "string or null",
            "geographic_scope": "string or null"
          }},
          
          "financial_details": {{
            "total_grant_amount": "number or null",
            "currency": "string (default: USD)",
            "payment_schedule": {{
              "schedule_type": "string (lump_sum, installments, milestones, reimbursements)",
              "installments": [
                {{
                  "installment_number": "number",
                  "amount": "number",
                  "due_date": "string",
                  "trigger_condition": "string"
                }}
              ],
              "milestones": [
                {{
                  "milestone_name": "string",
                  "amount": "number",
                  "due_date": "string",
                  "deliverable": "string"
                }}
              ]
            }},
            "budget_breakdown": {{
              "personnel": "number or null",
              "equipment": "number or null",
              "travel": "number or null",
              "materials": "number or null",
              "indirect_costs": "number or null",
              "other": "number or null"
            }},
            "financial_reporting_requirements": "string or null"
          }},
          
          "deliverables": {{
            "items": [
              {{
                "deliverable_name": "string",
                "description": "string",
                "due_date": "string",
                "status": "pending"
              }}
            ],
            "reporting_requirements": {{
              "frequency": "string",
              "report_types": ["array of strings"],
              "due_dates": ["array of strings"]
            }}
          }},
          
          "terms_conditions": {{
            "intellectual_property": "string or null",
            "confidentiality": "string or null",
            "liability": "string or null",
            "termination_clauses": "string or null",
            "renewal_options": "string or null",
            "dispute_resolution": "string or null",
            "governing_law": "string or null",
            "force_majeure": "string or null",
            "key_obligations": ["array of strings"],
            "restrictions": ["array of strings"]
          }},
          
          "compliance": {{
            "audit_requirements": "string or null",
            "record_keeping": "string or null",
            "regulatory_compliance": "string or null",
            "ethics_requirements": "string or null"
          }},
          
          "summary": {{
            "executive_summary": "string",
            "key_dates_summary": "string",
            "financial_summary": "string",
            "risk_assessment": "string"
          }}
        }}

        Contract text:
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
        """Extract comprehensive structured data from contract text"""
        try:
            # Check API key
            if not self.api_key or self.api_key == "your-openai-api-key-here":
                print("ERROR: Please set OPENAI_API_KEY in .env file")
                return self._get_empty_result()
            
            # Use gpt-4o-mini for comprehensive extraction
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a highly experienced contract analyst. Extract comprehensive information from grant contracts with maximum detail. Be thorough and extract every piece of information you can find."
                    },
                    {
                        "role": "user", 
                        "content": self.extraction_prompt.format(text=text[:12000])  # Slightly reduced for reliability
                    }
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
                max_tokens=4000  # Increased for comprehensive response
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Add timestamp if not present
            import datetime
            if "metadata" in result and "extraction_timestamp" not in result["metadata"]:
                result["metadata"]["extraction_timestamp"] = datetime.datetime.now().isoformat()
            
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
                    return result
            except:
                pass
            return self._get_empty_result()
        except Exception as e:
            print(f"Extraction error: {e}")
            import traceback
            traceback.print_exc()
            return self._get_empty_result()
    
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
                "payment_schedule": {
                    "schedule_type": None,
                    "installments": [],
                    "milestones": []
                },
                "budget_breakdown": {
                    "personnel": None,
                    "equipment": None,
                    "travel": None,
                    "materials": None,
                    "indirect_costs": None,
                    "other": None
                },
                "financial_reporting_requirements": None
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
                "risk_assessment": "No risk assessment available"
            }
        }