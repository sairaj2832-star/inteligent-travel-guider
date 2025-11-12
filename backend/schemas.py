from pydantic import BaseModel, EmailStr

# --- User Schemas (from before) ---

class UserBase(BaseModel):
    """
    This is the base schema. It's not used directly.
    """
    email: EmailStr # A special type from Pydantic that validates the email format.

class UserCreate(UserBase):
    """
    This is the schema for *creating* a user.
    It expects an email and a password.
    """
    password: str

class User(UserBase):
    """
    This is the schema for *returning* a user from the API.
    It includes the ID and email, but securely hides the password.
    """
    id: int

    class Config:
        from_attributes = True

# --- NEW: Token Schemas (Moved to the correct file) ---

class Token(BaseModel):
    """
    This is the schema for the token response.
    It's what we send back to the user when they log in.
    """
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """
    This is the schema for the data *inside* the token.
    We will just store the user's email.
    """
    email: str | None = None