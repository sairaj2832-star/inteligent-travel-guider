import os 
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
DATABASE_URL = "sqlite+aiosqlite:///./travel_app.db"  #the url of database which store a file name in a same file named"travel_app.db"
engine = create_async_engine(DATABASE_URL, echo=True) # created the async engine 
async_session = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
)
Base = declarative_base()
async def init_db():
    """
    A function to initialize the database and create all tables.
    """
    async with engine.begin() as conn:
        # This command creates all tables defined by models that inherit from Base
        # await conn.run_sync(Base.metadata.drop_all) # Use this to drop tables first if needed
        await conn.run_sync(Base.metadata.create_all)