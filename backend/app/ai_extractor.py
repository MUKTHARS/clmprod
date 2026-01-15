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
        
        # Use triple quotes with double curly braces to escape them
        self.extraction_prompt = """Extract the following information from the grant contract text. If a field is not found, use null.

IMPORTANT: Extract ALL monetary values and amounts. Look for numbers with currency symbols ($, €, £, etc.) or words like "dollars", "euros".

Fields to extract:
1. contract_number: Contract/Agreement number
2. grant_name: Name of the grant/project
3. grantor: Organization providing the grant
4. grantee: Organization/individual receiving the grant
5. total_amount: Total grant amount (extract the highest/largest amount mentioned)
6. start_date: Contract start date
7. end_date: Contract end date
8. purpose: Purpose of the grant
9. payment_schedule: Any payment schedule information as JSON
10. terms_conditions: Key terms and conditions as JSON

Return ONLY valid JSON in this exact format:
{{
  "contract_number": "string or null",
  "grant_name": "string or null",
  "grantor": "string or null",
  "grantee": "string or null",
  "total_amount": "number or null",
  "start_date": "string or null",
  "end_date": "string or null",
  "purpose": "string or null",
  "payment_schedule": {{"schedule": "array or object"}} or null,
  "terms_conditions": {{"terms": "array or object"}} or null
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
        # Method 1: Try with timeout only (no proxies)
        try:
            return openai.OpenAI(
                api_key=self.api_key,
                timeout=30.0
            )
        except TypeError as e:
            print(f"Method 1 failed: {e}")
            
            # Method 2: Try without any extra parameters
            try:
                # Set API key in environment
                os.environ['OPENAI_API_KEY'] = self.api_key
                return openai.OpenAI()
            except Exception as e2:
                print(f"Method 2 failed: {e2}")
                
                # Method 3: Use direct httpx client
                try:
                    import httpx
                    # Create custom transport without proxies
                    transport = httpx.HTTPTransport(retries=3)
                    http_client = httpx.Client(transport=transport)
                    
                    return openai.OpenAI(
                        api_key=self.api_key,
                        http_client=http_client
                    )
                except Exception as e3:
                    print(f"Method 3 failed: {e3}")
                    raise Exception(f"Failed to create OpenAI client: {e3}")
    
    def extract_contract_data(self, text: str) -> Dict[str, Any]:
        """Extract structured data from contract text using GPT"""
        try:
            # Check API key
            if not self.api_key or self.api_key == "your-openai-api-key-here":
                print("ERROR: Please set OPENAI_API_KEY in .env file")
                return self._get_empty_result()
            
            # Use gpt-4o-mini as requested
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using gpt-4o-mini as requested
                messages=[
                    {"role": "system", "content": "You are a contract analysis expert. Extract precise information from grant contracts."},
                    {"role": "user", "content": self.extraction_prompt.format(text=text[:15000])}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Clean and validate the data
            if isinstance(result.get("total_amount"), str):
                import re
                amount_str = result["total_amount"]
                numbers = re.findall(r'[\d,]+\.?\d*', amount_str)
                if numbers:
                    numbers_clean = [float(n.replace(',', '')) for n in numbers]
                    result["total_amount"] = max(numbers_clean) if numbers_clean else None
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            print("Response might not be valid JSON, trying to fix...")
            # Try to extract JSON from the response
            try:
                import re
                # Look for JSON pattern in the response
                json_match = re.search(r'\{.*\}', response.choices[0].message.content, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
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
            # Check API key
            if not self.api_key or self.api_key == "your-openai-api-key-here":
                print("ERROR: Please set OPENAI_API_KEY in .env file")
                return []
            
            # Use text-embedding-3-small for embeddings
            response = self.client.embeddings.create(
                model="text-embedding-3-small",  # Changed to consistent model
                input=text[:8000]
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Embedding error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _get_empty_result(self) -> Dict[str, Any]:
        """Return empty result structure"""
        return {
            "contract_number": None,
            "grant_name": None,
            "grantor": None,
            "grantee": None,
            "total_amount": None,
            "start_date": None,
            "end_date": None,
            "purpose": None,
            "payment_schedule": None,
            "terms_conditions": None
        }