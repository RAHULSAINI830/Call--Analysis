from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import whisper
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# ---------------- CORS (for frontend access) ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Load Whisper Model ----------------
print("Loading Whisper model...")
model = whisper.load_model("base")
print("Whisper model loaded successfully!")

# ---------------- Setup Upload Folder ----------------
# Vercel only allows writing to /tmp
UPLOAD_DIR = "/tmp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------- Models ----------------
class AnalysisRequest(BaseModel):
    text: str

# ---------------- API Endpoints ----------------
@app.post("/speech-to-text/")
async def speech_to_text(file: UploadFile = File(...)):
    file_path = f"{UPLOAD_DIR}/{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    print("Transcribing:", file.filename)

    result = model.transcribe(file_path)

    return {
        "filename": file.filename,
        "transcription": result["text"]
    }

@app.post("/analyze/")
async def analyze_call(request: AnalysisRequest):
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
         raise HTTPException(status_code=500, detail="HF_TOKEN not configured in backend")

    # Initialize Client
    from huggingface_hub import InferenceClient
    client = InferenceClient(token=hf_token)
    
    messages = [
        {
            "role": "system", 
            "content": "You are a helpful assistant that outputs only JSON. Do not write any text outside the JSON object."
        },
        {
            "role": "user", 
            "content": f"""
            Analyze the following transcript and provide a JSON response with these exact metrics and actionable feedback.
            
            1. overall_score (0-10)
            2. overall_feedback (Advice on general improvement)
            3. sentiment (Positive, Neutral, Negative)
            4. response_time_rating (Fast, Moderate, Slow)
            5. response_time_feedback (Comments on pacing and pauses)
            6. call_clarity (0-10)
            7. call_clarity_feedback (Tips on articulation and communication)
            8. summary (1 sentence)

            Transcript: "{request.text}"

            Return ONLY valid JSON.
            Example format:
            {{
                "overall_score": 8,
                "overall_feedback": "Great opening, but could be more empathetic in the middle.",
                "sentiment": "Positive",
                "response_time_rating": "Fast",
                "response_time_feedback": "Good pace, but allow the customer to finish speaking.",
                "call_clarity": 9,
                "call_clarity_feedback": "Very clear articulation, professional tone.",
                "summary": "Customer was happy with the resolution."
            }}
            """
        }
    ]

    try:
        response = client.chat_completion(
            messages=messages, 
            model="Qwen/Qwen2.5-7B-Instruct", 
            max_tokens=500,
            temperature=0.1
        )
        
        generated_text = response.choices[0].message.content
        
        # Cleanup to ensure valid JSON
        import re
        json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
        if json_match:
            return json_match.group(0) # Returns the JSON string
            
        return generated_text # Fallback
        
    except Exception as e:
        print(f"Error calling HF API: {e}")
        raise HTTPException(status_code=500, detail=str(e))
