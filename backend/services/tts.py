from kokoro import KPipeline
import soundfile as sf
import numpy as np
from config import SAMPLE_RATE

pipeline = KPipeline(lang_code="a")

def generate_speech(text: str, voiceId: str, speed: float):

    audio_chunks = []
    
    generator = pipeline(
        text,
        voice=voiceId,
        speed=speed
        )
    
    for i, (gs, ps, audio) in enumerate(generator):
        audio_chunks.append(audio)
        
    if audio_chunks:
        return np.concatenate(audio_chunks)
    return np.array([], dtype=np.float32)
    

def save_audio(audio, filename):
    sf.write(filename, audio, SAMPLE_RATE)
    return filename