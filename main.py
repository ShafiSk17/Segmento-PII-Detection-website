# backend/main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend import RegexClassifier
import pandas as pd
import io
import json

app = FastAPI()

# Allow the frontend (Vercel) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize your Logic Core
classifier = RegexClassifier()

@app.get("/")
def home():
    return {"message": "Segmento Sense API is running"}

@app.get("/patterns")
def get_patterns():
    return classifier.list_patterns()

@app.post("/analyze/text")
def analyze_text(text: str = Form(...)):
    """Analyzes raw text string"""
    results = classifier.get_pii_counts(text)
    # Get inspection details
    inspection = classifier.run_full_inspection(text)
    
    return {
        "counts": results.to_dict(orient="records"),
        "inspection": inspection.to_dict(orient="records")
    }

@app.post("/analyze/file")
async def analyze_file(file: UploadFile = File(...)):
    """Handles PDF, CSV, JSON, Parquet uploads"""
    content = await file.read()
    file_type = file.filename.split('.')[-1].lower()
    
    df = pd.DataFrame()
    text_content = ""

    try:
        # Reuse your backend logic
        if file_type == "pdf":
            # For simplicity, just scanning page 0 for the API demo
            text_content = classifier.get_pdf_page_text(content, 0)
            counts = classifier.get_pii_counts(text_content)
            inspection = classifier.run_full_inspection(text_content)
            
            return {
                "type": "pdf",
                "counts": counts.to_dict(orient="records"),
                "inspection": inspection.to_dict(orient="records"),
                "preview_text": text_content[:500] # Send sample text back
            }

        elif file_type == "csv":
            df = pd.read_csv(io.BytesIO(content))
        elif file_type == "json":
            df = classifier.get_json_data(io.BytesIO(content))
        elif file_type in ["parquet", "pqt"]:
            df = classifier.get_parquet_data(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        # Process Structured Data
        if not df.empty:
            counts = classifier.get_pii_counts_dataframe(df)
            # Create sample text for inspector
            sample_text = df.head(10).to_string()
            inspection = classifier.run_full_inspection(sample_text)
            schema = classifier.get_data_schema(df)

            return {
                "type": "structured",
                "counts": counts.to_dict(orient="records"),
                "inspection": inspection.to_dict(orient="records"),
                "schema": schema.to_dict(orient="records"),
                "preview_data": df.head(50).fillna("").to_dict(orient="records")
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))