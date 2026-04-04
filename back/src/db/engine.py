from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

load_dotenv()  # Loads variables from .env
CREDENTIALS = os.getenv("CREDENTIALS")

engine = create_engine(CREDENTIALS)