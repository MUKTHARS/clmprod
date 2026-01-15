import hashlib
import json
from datetime import datetime
from typing import Any, Dict

def generate_file_hash(file_path: str) -> str:
    """Generate MD5 hash of file"""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def format_date(date_str: str) -> datetime:
    """Parse various date formats"""
    formats = [
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%B %d, %Y",
        "%d %B %Y"
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    return None

def validate_extracted_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and clean extracted data"""
    # Remove None values
    cleaned = {k: v for k, v in data.items() if v is not None}
    
    # Ensure numeric fields are floats
    numeric_fields = ["total_amount", "confidence_score"]
    for field in numeric_fields:
        if field in cleaned and isinstance(cleaned[field], (int, float)):
            cleaned[field] = float(cleaned[field])
    
    return cleaned