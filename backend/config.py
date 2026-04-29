"""
Development configuration and utilities
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24  # 30 days

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./legal_analysis.db")

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# PDF Configuration
MAX_PDF_SIZE = 10 * 1024 * 1024  # 10MB

# LLM Configuration
LLM_MODEL = "gpt-3.5-turbo"
LLM_TEMPERATURE = 0.7
LLM_MAX_TOKENS = 1500

# Logging Configuration
LOG_LEVEL = "INFO" if not DEBUG else "DEBUG"

# Feature Flags
ENABLE_MULTI_AGENT = True
ENABLE_CHATBOT = True
ENABLE_ANALYTICS = True

class DevelopmentConfig:
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True

class TestingConfig:
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_ECHO = True
    DATABASE_URL = "sqlite:///./test.db"

class ProductionConfig:
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False

def get_config():
    """Get appropriate configuration based on environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionConfig()
    elif env == "testing":
        return TestingConfig()
    else:
        return DevelopmentConfig()
