import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv
import logging

load_dotenv()

MOCK_MODE = False
pool = None

try:
    # If VERCEL environment variable is set, instantly enter mock mode
    if os.getenv("VERCEL"):
        raise Exception("Skipping DB connection on Vercel to avoid TCP timeout")
    
    pool = pooling.MySQLConnectionPool(
        pool_name="globalcart_pool",
        pool_size=1,
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", 3306)),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "globalcart"),
        autocommit=False
    )
except Exception as e:
    logging.warning(f"Database connection failed: {e}. Starting in MOCK_MODE.")
    MOCK_MODE = True

def get_db():
    if MOCK_MODE:
        return None
    return pool.get_connection()
