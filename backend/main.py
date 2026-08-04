from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
import uuid
import os
from services.tts import generate_speech, save_audio

# Ensure the outputs directory exists
os.makedirs("outputs", exist_ok=True)

app = FastAPI()
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    text: str
    voiceId: str
    speed: float

@app.get("/")
def root():
    return {"message": "Backend is running."}

@app.post("/generate")
def generate(request: GenerateRequest):
    audio = generate_speech(
        request.text,
        request.voiceId,
        request.speed,
    )
    filename = f"audio_{uuid.uuid4()}.wav"
    filepath = f"outputs/{filename}"
    save_audio(audio, filepath)
    return {"filename": filename}
