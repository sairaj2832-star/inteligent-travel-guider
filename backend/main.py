from fastapi import FastAPI, Depends, HTTPException, status
from contextlib import asynccontextmanager
from typing import Annotated # We need this for the new dependency system

from sqlalchemy.ext.asyncio import AsyncSession

# Import all our new modules
import models
import CRUD
import schemas
from database import init_db, async_session # We now import async_session

# --- Lifespan Function (from before) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Server starting up...")
    print("Initializing database...")
    await init_db() 
    print("Database is initialized. Tables created (if they didn't exist).")
    yield 
    print("Server shutting down...")

# --- Database "Ticket" System (Dependency) ---
# This is our new "dependency" function.
# It's our "ticket" system for the database.
async def get_db():
    """
    This function gets a database session from our async_session "ticket counter".
    It will be used by every endpoint that needs to talk to the database.
    It uses try...finally to ensure the database connection is *always*
    closed, even if an error occurs.
    """
    # Get a "ticket" (a new session) from our factory
    db = async_session()
    try:
        yield db
    finally:
        # Always close the ticket/session when we're done or if an error happens
        await db.close()

# This is a "shorthand" for our dependency.
# In our endpoints, we can just type `db: AsyncDb` and FastAPI
# will automatically run the get_db() function.
AsyncDb = Annotated[AsyncSession, Depends(get_db)]


# --- FastAPI App ---
app = FastAPI(
    title="Intelligent Travel Companion API",
    lifespan=lifespan 
)

# --- API Endpoints ---

@app.get("/api/health")
def read_health():
    """
    Health check endpoint to confirm the API is running.
    """
    return {"status": "ok"}


# --- NEW AUTH ENDPOINT ---
@app.post("/api/auth/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: AsyncDb):
    """
    Registers a new user in the database.
    """
    # 1. Check if the user's email already exists
    #    We use our new 'crud.py' helper function for this
    db_user = await CRUD.get_user_by_email(db, email=user.email)
    
    if db_user:
        # 2. If the user exists, raise a 400 Bad Request error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # 3. If email is unique, create the new user
    #    This also hashes the password
    new_user = await CRUD.create_user(db, user=user)
    
    # 4. Return the new user.
    #    Because we set 'response_model=schemas.User',
    #    FastAPI will automatically filter out the hashed_password!
    return new_user