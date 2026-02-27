import os
import re
import json
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from google import genai
import database
import langfuse_client

# Load environment variables from .env file
load_dotenv()

# Get the API key from environment variables
api_key = os.getenv("GOOGLE_API")

# Configure the API key directly based on user's instruction
client = genai.Client(api_key=api_key)

def get_medicine_names() -> List[str]:
    conn = database.get_db_connection()
    meds = conn.execute("SELECT name FROM medicines").fetchall()
    conn.close()
    return [m['name'] for m in meds]

class OrderExtractorAgent:
    def __init__(self):
        self._medicine_names: Optional[List[str]] = None
        # Use flash model for fast NLP extraction
        self.client = client
        self.model_name = 'gemini-2.5-flash'

    @property
    def medicine_names(self):
        if self._medicine_names is None:
            try:
                self._medicine_names = get_medicine_names()
            except:
                return []
        return self._medicine_names

    def run(self, text: str, user_id: str = "GUEST"):
        # Langfuse trace
        trace = langfuse_client.trace_interaction("OrderExtractor", text, user_id=user_id)
        
        if not self.medicine_names:
            try:
                self._medicine_names = get_medicine_names()
            except:
                pass

        valid_meds_list = ", ".join(self.medicine_names)

        # Prompt engineering to handle "messy" NLP
        prompt = f"""
        You are an intelligent pharmacy extraction engine. 
        Your task is to parse a user's conversational, informal, and messy text and identify if they are trying to order any medical items and what the quantity is.
        The user might type in messy, unprofessional language (e.g., "i got a bad headache give me 2 packs of aspirins").

        CRITICAL INSTRUCTIONS: 
        1. You MUST map the user's intent to the closest exact medicine names from our inventory list ONLY.
        2. Handle plurals and typos gracefully (e.g., "aspirins" -> "Aspirin", "para" -> "Paracetamol", "advils" -> "Advil").
        3. If the user mentions an item, YOU MUST extract it into the 'medicines' array if it resembles our inventory.
        4. If it's completely unclear or not in inventory, provide the closest match in 'suggestions'.
        
        Our Current Inventory: 
        {valid_meds_list}
        
        User Text: "{text}"

        Return ONLY a raw JSON object with the following exact schema, do not include markdown blocks. Do not return any other conversational text:
        {{
            "medicines": [
                {{
                    "name": "Exact Name From Inventory String",
                    "qty": integer_quantity
                }}
            ],
            "suggestions": ["list", "of", "similar", "medicines", "if", "not", "found"]
        }}
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )
            # Defensive JSON parsing
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            
            extracted_data = json.loads(raw_text.strip())
            
            result = {
                "medicines": extracted_data.get("medicines", []),
                "suggestions": extracted_data.get("suggestions", []),
                "user_id": user_id
            }
        except Exception as e:
            err_str = str(e).lower()
            print(f"Gemini Extraction Failed: {err_str}")
            if "429" in err_str or "exhausted" in err_str:
                result = {"medicines": [], "suggestions": [], "user_id": user_id, "error": "gemini_rate_limit"}
            else:
                result = {"medicines": [], "suggestions": [], "user_id": user_id}

        # Update trace
        if trace:
             trace.update(output=result)
             
        return result

def extract_from_image(file_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    trace = langfuse_client.trace_interaction("ImageExtractor", "prescription_image")
    
    try:
        meds = get_medicine_names()
    except:
        meds = []
    
    valid_meds_list = ", ".join(meds)
    
    prompt = f"""
    You are an intelligent pharmacy extraction engine.
    Your task is to parse a doctor's handwritten prescription image and identify ALL medical items, dosages, and quantities.
    
    CRITICAL INSTRUCTIONS:
    1. Read the doctor's handwriting carefully to identify the medicine name and dosage (e.g. Paracetamol 500mg).
    2. Try your best to extract every medicine mentioned.
    3. You must map what you read to the closest exact match from our Current Inventory list below. 
    4. Handle plurals, typos, and bad handwriting gracefully.
    
    Current Inventory:
    {valid_meds_list}
    
    Return ONLY a raw JSON object with the following exact schema (no markdown formatting):
    {{
        "medicines": [
            {{
                "name": "Exact Name From Inventory String",
                "qty": integer_quantity
            }}
        ],
        "suggestions": ["List of extracted medicines that did not match inventory"]
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, {'mime_type': mime_type, 'data': file_bytes}]
        )
        
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        
        extracted_data = json.loads(raw_text.strip())
        result = {
            "medicines": extracted_data.get("medicines", []),
            "suggestions": extracted_data.get("suggestions", [])
        }
    except Exception as e:
        print(f"Gemini Image Extraction Failed: {e}")
        result = {"medicines": [], "suggestions": [], "error": str(e)}

    if trace:
        trace.update(output=result)
        
    return result
