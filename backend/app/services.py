import openai
import pdfplumber
import PyPDF2
import tiktoken
from typing import Dict, Any, Optional, List
import json
import os
from datetime import datetime
import logging
import numpy as np

logger = logging.getLogger(__name__)

class PDFExtractor:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.openai_api_key
        
    def extract_text_from_pdf(self, file_path: str) -> Dict[str, Any]:
        """Extract text from PDF using multiple methods for accuracy"""
        try:
            text_content = ""
            metadata = {}
            
            # Method 1: pdfplumber (good for tables)
            with pdfplumber.open(file_path) as pdf:
                page_count = len(pdf.pages)
                metadata['page_count'] = page_count
                
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        text_content += f"--- Page {page_num + 1} ---\n{text}\n\n"
                    
                    # Try to extract tables
                    tables = page.extract_tables()
                    for table in tables:
                        if table:
                            text_content += f"[Table on Page {page_num + 1}]\n"
                            for row in table:
                                text_content += " | ".join([str(cell) if cell else "" for cell in row]) + "\n"
                            text_content += "\n"
            
            # Method 2: PyPDF2 as fallback
            if not text_content.strip():
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    metadata['page_count'] = len(pdf_reader.pages)
                    
                    for page_num, page in enumerate(pdf_reader.pages):
                        text = page.extract_text()
                        text_content += f"--- Page {page_num + 1} ---\n{text}\n\n"
            
            return {
                "text": text_content,
                "metadata": metadata,
                "char_count": len(text_content),
                "word_count": len(text_content.split())
            }
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise

    def extract_with_openai(self, text: str, fields_to_extract: List[str]) -> Dict[str, Any]:
        """Use OpenAI to extract structured data from text"""
        
        prompt = f"""
        Analyze the following grant contract text and extract the specified fields.
        Return ONLY a valid JSON object with the following structure. Do not include any explanations.
        
        Fields to extract: {", ".join(fields_to_extract)}
        
        Expected JSON structure:
        {{
            "contract_number": "string or null",
            "grant_name": "string or null",
            "grantor": "string or null",
            "grantee": "string or null",
            "effective_date": "YYYY-MM-DD or null",
            "end_date": "YYYY-MM-DD or null",
            "total_amount": number or null,
            "currency": "string (default: USD)",
            "payment_schedule": {{
                "schedule_type": "string",
                "milestones": [
                    {{"date": "YYYY-MM-DD", "amount": number, "description": "string"}}
                ]
            }} or null,
            "deliverables": {{
                "items": [
                    {{"description": "string", "due_date": "YYYY-MM-DD", "status": "string"}}
                ]
            }} or null,
            "reporting_requirements": {{
                "frequency": "string",
                "reports": [
                    {{"type": "string", "due_date": "YYYY-MM-DD", "format": "string"}}
                ]
            }} or null,
            "confidence_score": number between 0 and 1,
            "extraction_summary": "string"
        }}
        
        Contract Text:
        {text[:12000]}
        
        JSON Output:
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",  # Using gpt-3.5-turbo for cost efficiency
                messages=[
                    {"role": "system", "content": "You are a contract analysis expert. Extract structured data from contracts."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0,
                max_tokens=2000
            )
            
            result = response.choices[0].message.content.strip()
            
            # Clean the result
            if result.startswith("```json"):
                result = result[7:]
            if result.endswith("```"):
                result = result[:-3]
            result = result.strip()
            
            extracted_data = json.loads(result)
            return extracted_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response: {e}")
            return self._fallback_extraction(text, fields_to_extract)
        except Exception as e:
            logger.error(f"OpenAI extraction failed: {e}")
            raise

    def _fallback_extraction(self, text: str, fields_to_extract: List[str]) -> Dict[str, Any]:
        """Fallback extraction method using regex and rules"""
        import re
        from datetime import datetime
        
        extracted = {
            "contract_number": None,
            "grant_name": None,
            "grantor": None,
            "grantee": None,
            "effective_date": None,
            "end_date": None,
            "total_amount": None,
            "currency": "USD",
            "payment_schedule": None,
            "deliverables": None,
            "reporting_requirements": None,
            "confidence_score": 0.3,
            "extraction_summary": "Extracted using fallback method"
        }
        
        patterns = {
            "contract_number": [r'Contract\s*(?:No\.?|Number)\s*[:]?\s*([A-Z0-9-]+)',
                               r'Agreement\s*(?:No\.?|Number)\s*[:]?\s*([A-Z0-9-]+)'],
            "total_amount": [r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
                           r'Amount[\s:]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'],
            "grantor": [r'Grantor[\s:]*([^\n]+)',
                       r'Between\s+([^,]+)'],
            "grantee": [r'Grantee[\s:]*([^\n]+)',
                       r'and\s+([^,]+)']
        }
        
        for field, field_patterns in patterns.items():
            for pattern in field_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    extracted[field] = match.group(1).strip()
                    break
        
        return extracted

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text"""
        try:
            response = openai.Embedding.create(
                model="text-embedding-ada-002",
                input=text[:8000]  # Limit text for embedding
            )
            return response['data'][0]['embedding']
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return [0] * 1536  # Return zero vector if failed

    def generate_summary(self, text: str, max_length: int = 200) -> str:
        """Generate a concise summary of the contract"""
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a contract summarizer."},
                    {"role": "user", "content": f"Summarize the following grant contract in 1-2 sentences. Focus on: who is giving the grant to whom, for what purpose, and the total amount.\n\nContract text: {text[:3000]}"}
                ],
                temperature=0.3,
                max_tokens=max_length
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return text[:200] + "..." if len(text) > 200 else text