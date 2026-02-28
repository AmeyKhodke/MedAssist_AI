import os
import re
import json
import base64
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

import database
import langfuse_client

# Load environment variables from .env file
load_dotenv(override=True)

# We use try/except to prevent the app from crashing if groq isn't fully installed yet
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("WARNING: Groq python package not found.")

# Get the API key from environment variables
api_key = os.getenv("GROQ_API_KEY", "dummy_groq_key")

# Configure the API key directly based on user's instruction
try:
    if GROQ_AVAILABLE and "dummy" not in api_key.lower():
        client = Groq(api_key=api_key)
    else:
        client = None
except Exception as e:
    client = None
    print(f"Warning: Failed to initialize Groq client: {e}")

def get_medicine_catalog_data() -> str:
    try:
        return database.get_medicine_catalog()
    except Exception as e:
        print(f"Error getting catalog: {e}")
        return ""

class OrderExtractorAgent:
    def __init__(self):
        self._medicine_names: Optional[str] = None
        self.client = client
        # Llama 3.3 70B is incredible for conversational parsing
        self.model_name = 'llama-3.3-70b-versatile'

    @property
    def medicine_catalog(self):
        if self._medicine_names is None:
            self._medicine_names = get_medicine_catalog_data()
        return self._medicine_names

    def run(self, text: str, user_id: str = "GUEST"):
        # Langfuse trace
        trace = langfuse_client.trace_interaction("OrderExtractor", text, user_id=user_id)
        
        if not self.medicine_catalog:
            self._medicine_names = get_medicine_catalog_data()

        catalog_data = self.medicine_catalog

        # Prompt engineering to handle "messy" NLP, multiple items, and Q&A
        prompt = f"""
        You are 'MedAssist AI', an intelligent and highly capable conversational pharmacy assistant.
        Your task is to parse a user's conversational text, ANSWER any questions they have based on our inventory catalog, AND handle their purchase intents.
        The user might type in messy, unprofessional language (e.g., "i got a bad headache give me 2 packs of aspirins"), use slang, Hinglish (e.g., "bhai ek paracetamol dena", "dawae dedo"), abbreviations, phonetic spellings, or have severe typos.

        CRITICAL INSTRUCTIONS FOR ORDER FLOW:
        1. Read the user's text. If they are asking a question (e.g. "What's the price of X?"), use the Current Inventory catalog to answer them warmly in the 'answer' field.
        2. UI WIDGET TRIGGER: If the user expresses intent to buy an item BUT DOES NOT specify an exact quantity/number (e.g. "I want Paracetamol"), you MUST NOT add it to the 'medicines' array. Instead, extract the intended inventory name into the 'pending_item_name' field so the frontend can display the Dose UI.
        3. EXPLICIT CART ADDITION: If the user EXPLICITLY provides a quantity AND a medicine name (e.g. "Please add 20 of Paracetamol to my cart" or "I want 5 Advil"), you MUST extract it directly into the 'medicines' array and SET 'pending_item_name' to null. Do not use pending_item_name if a number/quantity is present!
        4. Handle plurals, typos, slangs, Hinglish, and mixed languages gracefully (e.g., "aspirins" -> "Aspirin", "para" -> "Paracetamol", "advils" -> "Advil", "dawae" -> medicine context). Map to exact inventory item names.
        4. If it's completely unclear or not in inventory, provide the closest match in 'suggestions'.
        
        Our Current Inventory (Name | Price | Stock | Rx Required): 
        {catalog_data}
        
        Return ONLY a raw JSON object with the following exact schema, do not include markdown blocks:
        {{
            "answer": "Your friendly conversational response or question (e.g. 'How much Paracetamol do you need?').",
            "pending_item_name": "Exact Name From Inventory String OR null",
            "medicines": [
                {{
                    "name": "Exact Name From Inventory String",
                    "qty": integer_quantity
                }}
            ],
            "suggestions": ["list", "of", "similar", "medicines", "if", "not", "found"]
        }}
        """

        if not self.client:
            result = {
                "answer": "My brain (Groq API) is offline! I need a valid GROQ_API_KEY in the .env file.",
                "medicines": [],
                "suggestions": [],
                "user_id": user_id,
                "error": "missing_groq_key"
            }
            if trace:
                trace.update(output=result)
                trace.end()
            return result

        try:
            # Groq completion call format
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": prompt
                    },
                    {
                        "role": "user",
                        "content": text
                    }
                ],
                model=self.model_name,
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            raw_text = chat_completion.choices[0].message.content.strip()
            extracted_data = json.loads(raw_text)
            
            result = {
                "answer": extracted_data.get("answer", "I understood your request."),
                "pending_item_name": extracted_data.get("pending_item_name", None),
                "medicines": extracted_data.get("medicines", []),
                "suggestions": extracted_data.get("suggestions", []),
                "user_id": user_id
            }
        except Exception as e:
            err_str = str(e).lower()
            print(f"Groq Extraction Failed: {err_str}")
            if "429" in err_str or "exhausted" in err_str:
                result = {"answer": "I'm sorry, my AI rate limit has been reached on Groq.", "pending_item_name": None, "medicines": [], "suggestions": [], "user_id": user_id, "error": "groq_rate_limit"}
            else:
                result = {"answer": "I didn't quite catch that. Could you repeat?", "pending_item_name": None, "medicines": [], "suggestions": [], "user_id": user_id, "error": err_str}

        # Update trace
        if trace:
             trace.update(output=result)
             trace.end()
             
        return result


def extract_from_image(file_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    trace = langfuse_client.trace_interaction("ImageExtractor", "prescription_image")
    
    try:
        meds = get_medicine_catalog_data()
    except:
        meds = ""
        
    prompt = f"""
    You are an intelligent pharmacy extraction engine.
    Your task is to parse a doctor's handwritten prescription image and identify ALL medical items, dosages, and quantities, AS WELL AS the prescribing doctor's name.
    
    CRITICAL INSTRUCTIONS:
    1. Read the doctor's handwriting carefully to identify the medicine name and dosage (e.g. Paracetamol 500mg).
    2. Try your best to extract every medicine mentioned.
    3. You must map what you read to the closest exact match from our Current Inventory list below. 
    4. Handle plurals, typos, and bad handwriting gracefully.
    5. Find the prescribing doctor's name (look for 'Dr.', signatures, headers).
    
    Current Inventory:
    {meds}
    
    Return ONLY a raw JSON object with the exact keys below:
    {{
        "doctor_name": "Full name of the doctor, or 'Not specified'",
        "medicines": [
            {{
                "name": "Exact Name From Inventory String",
                "qty": integer_quantity
            }}
        ],
        "suggestions": ["List of extracted medicines that did not match inventory"]
    }}
    """
    
    if not client:
        return {"medicines": [], "suggestions": [], "error": "Groq client not initialized"}

    try:
        # Groq uses base64 data URLs for vision processing
        base64_image = base64.b64encode(file_bytes).decode('utf-8')
        image_url = f"data:{mime_type};base64,{base64_image}"

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url,
                            },
                        },
                    ],
                }
            ],
            model="llama-3.2-11b-vision-preview",
            temperature=0.1
        )
        
        raw_text = chat_completion.choices[0].message.content.strip()
        
        # Llama vision doesn't consistently support response_format json_object yet
        # So we manually parse out the codeblock if it exists:
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0]
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0]
            
        print("--- OCR RAW TEXT ---")
        print(raw_text)
        print("---------------------------")
        extracted_data = json.loads(raw_text.strip())
        
        # Sometimes models use title case for keys, let's parse safely
        doc_name = extracted_data.get("doctor_name") or extracted_data.get("DoctorName") or extracted_data.get("Doctor_Name") or "Unknown Doctor"
        
        result = {
            "doctor_name": doc_name,
            "medicines": extracted_data.get("medicines", []),
            "suggestions": extracted_data.get("suggestions", [])
        }
        if trace:
             trace.update(output=result)
             trace.end()
        return result
        
    except Exception as e:
        print(f"Image Extraction Failed: {e}")
        # Always return a valid struct so backend doesn't crash on tuple unpacking
        result = {
            "doctor_name": "Unknown Doctor",
            "medicines": [],
            "suggestions": [],
            "error": str(e)
        }

    if trace:
        trace.update(output=result)
        trace.end()
        
    return result
