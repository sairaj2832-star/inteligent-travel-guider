from fastapi import FastAPI, Depends, HTTPException, status
# NEW IMPORT for the login form
from fastapi.security import OAuth2PasswordRequestForm 
from contextlib import asynccontextmanager
from typing import Annotated

from sqlalchemy.ext.asyncio import AsyncSession

# Import all our modules
import models
import CRUD
import schemas
import security # NEW: We need the full security module
from database import init_db, async_session

# --- Lifespan Function (from before) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Server starting up...")
    print("Initializing database...")
    await init_db() 
    print("Database is initialized. Tables created (if they didn't exist).")
    yield 
    print("Server shutting down...")

# --- Database Dependency (from before) ---
async def get_db():
    db = async_session()
    try:
        yield db
    finally:
        await db.close()

AsyncDb = Annotated[AsyncSession, Depends(get_db)]

# --- FastAPI App ---
app = FastAPI(
    title="Intelligent Travel Companion API",
    lifespan=lifespan 
)

# --- API Endpoints ---

@app.get("/api/health")
def read_health():
    return {"status": "ok"}


# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: AsyncDb):
    db_user = await CRUD.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    new_user = await CRUD.create_user(db, user=user)
    return new_user

# --- NEW: LOGIN ENDPOINT ---
@app.post("/api/auth/login", response_model=schemas.Token)
async def login_for_access_token(
    # This is new:
    # FastAPI will automatically get the "username" and "password"
    # from a form for us.
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncDb
):
    """
    Logs in a user and returns a JWT access token.
    
    Note: The OAuth2 form standard uses "username", 
    but we will treat it as our "email".
    """
    # 1. Get the user from the DB by their email (which is 'form_data.username')
    user = await CRUD.get_user_by_email(db, email=form_data.username)
    
    # 2. Check if user exists OR if the password is wrong
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}, # Standard for login errors
        )
        
    # 3. If password is correct, create the JWT "ID Card"
    access_token_data = {"sub": user.email} # "sub" is a standard name for the token "subject"
    access_token = security.create_access_token(data=access_token_data)
    
    # 4. Return the token
    return {"access_token": access_token, "token_type": "bearer"}