from passlib.context import CryptContext

# Create a 'CryptContext' instance.
# We tell it that 'bcrypt' is the default hashing algorithm.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against a hashed password.
    Returns True if they match, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hashes a plain password.
    Returns the hash.
    """
    return pwd_context.hash(password)