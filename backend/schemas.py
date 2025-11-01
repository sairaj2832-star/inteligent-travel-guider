from pydantic import BaseModel, EmailStr

# --- User Schemas ---

class UserBase(BaseModel):
    """
    This is the base schema for a User.
    It includes fields that are common for both creating a user
    and for representing a user that already exists.
    """
    email: EmailStr # A special type from Pydantic that validates the email format.

class UserCreate(UserBase):
    """
    This schema is used ONLY when creating a new user.
    It inherits 'email' from UserBase and adds a 'password'.
    This is the model our /register endpoint will expect.
    """
    password: str

class UserInDBBase(UserBase):
    """
    This is the base schema for a User that is already in the database.
    It includes the 'id' and 'email'.
    """
    id: int

    class Config:
        """
        This tells Pydantic to be compatible with our database models.
        It allows it to read data from an ORM object (like our User model).
        """
        from_attributes = True

class User(UserInDBBase):
    """
    This is the main schema we will use for representing a User
    in our API responses. We will NOT include the hashed_password.
    """
    pass # For now, it's the same as UserInDBBase.