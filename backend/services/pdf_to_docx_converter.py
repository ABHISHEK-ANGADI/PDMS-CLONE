#!/usr/bin/env python3
# backend/services/pdf_to_docx_converter.py

import sys
import os
import json
from pdf2docx import Converter

def convert_pdf_to_docx(pdf_path, docx_path):
    """
    Convert PDF to DOCX using pdf2docx
    """
    try:
        # Use simple ASCII messages (no emojis)
        print(f"Converting PDF to DOCX...")
        print(f"   Input: {pdf_path}")
        print(f"   Output: {docx_path}")
        
        # Create converter instance
        cv = Converter(pdf_path)
        
        # Convert all pages
        cv.convert(docx_path, start=0, end=None)
        
        # Close the converter
        cv.close()
        
        print(f"Conversion complete!")
        return True
        
    except Exception as e:
        print(f"Conversion failed: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    # Set UTF-8 for output
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='ignore')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='ignore')
    
    # Get arguments
    if len(sys.argv) < 3:
        print("Usage: python pdf_to_docx_converter.py <pdf_path> <docx_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    
    # Check if input file exists
    if not os.path.exists(pdf_path):
        print(f"Input file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    
    # Convert
    success = convert_pdf_to_docx(pdf_path, docx_path)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)