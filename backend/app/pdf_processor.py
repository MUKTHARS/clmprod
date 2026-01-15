import pdfplumber
import io
from typing import Dict, Any, Optional
import PyPDF2

class PDFProcessor:
    def __init__(self):
        pass
    
    def extract_text(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text from PDF with multiple methods for best results
        """
        text_content = ""
        metadata = {}
        
        try:
            # Method 1: pdfplumber (best for structured data)
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n\n"
                
                # Try to extract tables if any
                tables = []
                for page in pdf.pages:
                    page_tables = page.extract_tables()
                    if page_tables:
                        tables.extend(page_tables)
                
                if tables:
                    text_content += "\n\n=== TABLES ===\n\n"
                    for table in tables:
                        for row in table:
                            text_content += " | ".join([str(cell) if cell else "" for cell in row]) + "\n"
                        text_content += "\n"
        
        except Exception as e:
            print(f"pdfplumber error: {e}")
        
        # Method 2: PyPDF2 as fallback
        if not text_content.strip():
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
                for page in pdf_reader.pages:
                    text_content += page.extract_text() + "\n\n"
            except Exception as e:
                print(f"PyPDF2 error: {e}")
        
        # Extract metadata
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            metadata = pdf_reader.metadata
        except:
            metadata = {}
        
        return {
            "text": text_content.strip(),
            "metadata": metadata,
            "page_count": len(pdf_reader.pages) if 'pdf_reader' in locals() else 0,
            "has_tables": "=== TABLES ===" in text_content
        }
    
    def clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove excessive whitespace
        import re
        text = re.sub(r'\s+', ' ', text)
        # Fix common OCR issues
        text = re.sub(r'(\d),(\d)', r'\1,\2', text)  # Fix comma in numbers
        return text.strip()