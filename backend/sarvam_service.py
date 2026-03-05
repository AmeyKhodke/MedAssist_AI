import os
import httpx
from dotenv import load_dotenv

load_dotenv(override=True)

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

def translate_text(text: str, source_lang: str = "Unknown", target_lang: str = "en-IN") -> dict:
    """
    Translates text using the Sarvam AI Translation API.
    By default, detects the source language and translates to English (en-IN).
    Returns a dict with: {'translated_text': str, 'detected_source': str}
    """
    if not SARVAM_API_KEY or SARVAM_API_KEY == "sk_e0nw1xzt_WaiLKhTxwOlNqut5DJDQUeaY":
        # If no key, just return the text as-is (graceful degradation)
        return {"translated_text": text, "detected_source": source_lang}
        
    url = "https://api.sarvam.ai/translate"
    
    payload = {
        "input": text,
        "source_language_code": source_lang,
        "target_language_code": target_lang,
        "speaker_gender": "Male",
        "mode": "formal",
        "model": "sarvam-translate:v1",
        "enable_preprocessing": True
    }
    
    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY
    }
    
    try:
        # Using httpx for potentially async-friendly synchronous calls
        with httpx.Client() as client:
            response = client.post(url, json=payload, headers=headers, timeout=10.0)
            
        if response.status_code == 200:
            data = response.json()
            # The API returns the translated text and usually the actual source language it used/detected
            translated = data.get("translated_text", text)
            # Some versions of the API return 'source_language_code', otherwise assume our input
            detected = data.get("source_language_code", source_lang)
            return {"translated_text": translated, "detected_source": detected}
        else:
            print(f"[SARVAM ERROR] {response.status_code}: {response.text}")
            return {"translated_text": text, "detected_source": source_lang}
            
    except Exception as e:
        print(f"[SARVAM EXCEPTION] {e}")
        return {"translated_text": text, "detected_source": source_lang}
