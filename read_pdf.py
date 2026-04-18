import sys
from pypdf import PdfReader

# Force UTF-8 encoding for standard output
sys.stdout.reconfigure(encoding='utf-8')

for file_path in ["hackathon.pdf", "Project Summary.pdf"]:
    print(f"--- {file_path} ---")
    try:
        reader = PdfReader(file_path)
        for i, page in enumerate(reader.pages):
            print(f"Page {i+1}:")
            print(page.extract_text())
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    print("\n" + "="*40 + "\n")
