import os
from datetime import timedelta
basedir = os.path.abspath(os.path.dirname(__file__))
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(basedir, '.env'))
except ImportError as e:
    print(f"Error loading env: {e}")

class Config:
    SECRET_KEY = timedelta(days=30)
    MONGO_DB_SETTINGS = 
    REMEMBER_COOKIE_DURATION = 