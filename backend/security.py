from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import asyncio

# --- .env Configuration ---
# This line loads the variables from your .env file (e.g., SECRET_KEY)
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

if not SECRET_KEY:
    raise Exception("SECRET_KEY not set in .env file")

# --- Password Hashing (from before) ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def verify_password_async(plain_password, hashed_password):
    """ Verifies a plain password against a hashed password. Returns True if they match, False otherwise. """
    return await asyncio.to_thread(
        pwd_context.verify,
        plain_password,
        hashed_password
    )

def get_password_hash(password: str) -> str:
    """
    Hashes a plain password.
    Returns the hash.
    """
    return pwd_context.hash(password)


# --- JWT (Token) Schemas ---

# class Token(BaseModel):
#     """
#     This is the schema for the token response.
#     It's what we send back to the user when they log in.
#     """
#     access_token: str
#     token_type: str

# class TokenData(BaseModel):
#     """
#     This is the schema for the data *inside* the token.
#     We will just store the user's email (or ID).
#     """
#     email: str | None = None


# --- NEW: JWT (Token) Creation ---

def create_access_token(data: dict):
    """
    Creates a new JWT access token.
    """
    to_encode = data.copy()
    
    # Calculate the exact time the token should expire
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # "Sign" the token with our SECRET_KEY and algorithm
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

