import re

class ResumeParser:
    @staticmethod
    def extract_text(pdf_bytes: bytes) -> str:
        """Extracts text from PDF bytes using PyMuPDF."""
        try:
            import fitz  # PyMuPDF
            # Open PDF from bytes memory
            with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                full_text = ""
                for page in doc:
                    full_text += page.get_text() + "\n"
                return full_text
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document with PyMuPDF: {str(e)}")

    @staticmethod
    def clean_text(text: str) -> str:
        """Cleans and normalizes extracted resume text."""
        # Split text into lines
        lines = text.split("\n")
        
        # Clean lines: remove excess spacing, filter out empty lines
        cleaned_lines = []
        for line in lines:
            line_cleaned = re.sub(r'\s+', ' ', line).strip()
            if line_cleaned:
                cleaned_lines.append(line_cleaned)
        
        # Join lines back
        normalized_text = "\n".join(cleaned_lines)
        return normalized_text
