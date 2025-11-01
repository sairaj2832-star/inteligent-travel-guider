from sqlalchemy import Column, Integer, String, Boolean
from database import Base # Import the Base class from our database.py file

class User(Base):
    """
    This is the User model, which defines the 'users' table in our database.
    """
    __tablename__ = "users"
    # Define the columns for the 'users' table
    id = Column(Integer, primary_key=True, index=True, nullable= False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # We can add more fields here later, like:
    # is_active = Column(Boolean, default=True)
    # first_name = Column(String, index=True)
    # last_name = Column(String, index=True)