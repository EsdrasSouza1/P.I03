import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(basedir, '.env'))
except ImportError as e:
    print(f"Error loading env: {e}")

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'sua-chave-secreta-padrao')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    MONGO_DB = os.environ.get('MONGO_DB', 'portal_imobiliario')
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    REMEMBER_COOKIE_DURATION = timedelta(days=30)
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = 'Lax'
    TOKEN_EXPIRATION_SECONDS = int(os.environ.get('TOKEN_EXPIRATION_SECONDS', 86400))
    REMEMBER_TOKEN_EXPIRATION_SECONDS = int(os.environ.get('REMEMBER_TOKEN_EXPIRATION_SECONDS', 2592000))
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get('CORS_ORIGINS', '').split(',')
        if origin.strip()
    ]
