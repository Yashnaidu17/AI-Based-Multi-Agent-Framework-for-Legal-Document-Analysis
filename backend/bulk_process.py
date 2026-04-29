import asyncio
import os
import time
import json
import pdfplumber
import argparse
from datetime import datetime

# Load necessary backend modules
from analyzer import analyze_document_content
from database import SessionLocal, User, Document

async def process_pdf(file_path: str, user_id: int, db):
    """Process a single PDF file and insert it into the database."""
    filename = os.path.basename(file_path)
    print(f"\nProcessing: {filename}...")
    
    # Extract text
    pdf_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                pdf_text += page.extract_text() or ""
    except Exception as e:
        print(f"  [X] Error reading PDF {filename}: {e}")
        return False
        
    if not pdf_text.strip():
        print(f"  [X] Error: No text found in {filename}.")
        return False

    # Analyze document
    _start = time.time()
    try:
        analysis_result = await analyze_document_content(pdf_text)
        analysis_result["analysis_time_seconds"] = round(time.time() - _start, 2)
    except Exception as e:
        print(f"  [X] Failed analyzing {filename} via AI: {e}")
        return False

    # Insert into database
    try:
        document = Document(
            user_id=user_id,
            filename=filename,
            analysis=json.dumps(analysis_result),
            verdict=analysis_result.get("verdict", "Unknown"),
            created_at=datetime.utcnow()
        )
        db.add(document)
        db.commit()
        print(f"  [✔] Success! Saved {filename} to database. (Took {analysis_result['analysis_time_seconds']}s)")
        return True
    except Exception as e:
        print(f"  [X] Database error saving {filename}: {e}")
        db.rollback()
        return False

async def main(folder_path: str, user_email: str):
    """Iterate through all PDFs in a folder and process them."""
    if not os.path.exists(folder_path):
        print(f"Error: Folder '{folder_path}' does not exist.")
        return

    pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith(".pdf")]
    
    if not pdf_files:
        print(f"No PDF files found in '{folder_path}'.")
        return

    print(f"Found {len(pdf_files)} PDF files. Initializing database connection...")

    db = SessionLocal()
    try:
        # Find the target user
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            print(f"Error: User with email '{user_email}' not found in the database.")
            return

        print(f"User found: {user.full_name} (ID: {user.id})")
        print("-" * 50)

        success_count = 0
        failure_count = 0
        total_start = time.time()

        for filename in pdf_files:
            file_path = os.path.join(folder_path, filename)
            success = await process_pdf(file_path, user.id, db)
            
            if success:
                success_count += 1
            else:
                failure_count += 1
                
            # Sleep between requests to avoid rate limits (Adjust if needed)
            print("  [Waiting 3 seconds to avoid API rate limits...]")
            time.sleep(3)

        total_time = round(time.time() - total_start, 2)
        print("\n" + "=" * 50)
        print(f"BATCH PROCESSING COMPLETE!")
        print(f"Successfully processed: {success_count}/{len(pdf_files)}")
        print(f"Failed: {failure_count}")
        print(f"Total time taken: {total_time}s")

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk process local PDF legal documents.")
    parser.add_argument("folder_path", help="Path to the folder containing the PDFs (e.g., C:/cases/)")
    parser.add_argument("--user", default="demo@legal.com", help="User email to assign the cases to (default: demo@legal.com)")
    
    args = parser.parse_args()
    
    # Run the async main loop
    asyncio.run(main(args.folder_path, args.user))
