import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

class Config:
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "prod-secret-key-change-me")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    
    # LLM Services
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GOOGLE_API = os.getenv("GOOGLE_API")
    
    # Memory Services (Hindsight)
    HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")
    HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
    HINDSIGHT_BANK_ID = os.getenv("HINDSIGHT_BANK_ID", "1")
    
    # Translation Services
    SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
    
    # SMTP Settings
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    
    # Database
    DB_PATH = os.getenv("DB_PATH", "pharmacy.db")

    @classmethod
    def validate(cls):
        """Validates that critical keys are present."""
        critical_keys = ["GROQ_API_KEY", "GOOGLE_API"]
        missing = [key for key in critical_keys if not getattr(cls, key)]
        if missing:
            print(f"WARNING: Missing critical configuration: {', '.join(missing)}")
        return len(missing) == 0

# Validate on import
Config.validate()
