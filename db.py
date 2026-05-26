import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv

load_dotenv()

pool = pooling.MySQLConnectionPool(
    pool_name="globalcart_pool",
    pool_size=10,
    host=os.getenv("MYSQL_HOST", "localhost"),
    port=int(os.getenv("MYSQL_PORT", 3306)),
    user=os.getenv("MYSQL_USER", "root"),
    password=os.getenv("MYSQL_PASSWORD", ""),
    database=os.getenv("MYSQL_DATABASE", "globalcart"),
    autocommit=False
)

def get_db():
    return pool.get_connection()
