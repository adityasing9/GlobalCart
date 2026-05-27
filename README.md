# 🛒 GlobalCart - Digital Products Marketplace

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Flask-2.x-black.svg?logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/MySQL-8.0+-4479A1.svg?logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Frontend-HTML/CSS/JS-E34F26.svg?logo=html5&logoColor=white" alt="Frontend">
  <br>
  <i>A robust, database-driven Single Page Application (SPA) designed for instant delivery of digital products.</i>
</div>

---

## 📖 About the Project
**GlobalCart** is a modern e-commerce platform built exclusively for digital goods such as e-books, software, notes, and courses. 
Unlike traditional e-commerce stores optimized for physical shipping, this platform is engineered for **instant digital delivery**, utilizing a highly normalized MySQL relational database to handle users, products, carts, and transactions securely.

This project was built as a comprehensive **Database Management Systems (DBMS) Mini-Project** to demonstrate practical applications of advanced database concepts including relational schemas, referential integrity (foreign keys), connection pooling, and transactional safety.

---

## 🧠 Deep Dive: Database Design & Data Flow

This project is built heavily around relational database principles. Below is a detailed explanation of how the data flows, how the tables are connected, and how advanced DBMS concepts are implemented.

### 1. The Project Data Flow
1. **User Registration:** A user signs up. The backend hashes their password and `INSERT`s a new row into the `users` table. The `email` and `username` columns have `UNIQUE` constraints to prevent duplicates.
2. **Browsing Products:** When the user opens the homepage, the backend runs a `SELECT * FROM products` query. The frontend dynamically renders these products.
3. **Adding to Cart:** When the user clicks "Add to Cart", an `INSERT` statement is executed on the `cart` table. This table acts as a bridge, linking the `user_id` and the `product_id`.
4. **Checkout (Transactions):** During checkout, a highly complex **Database Transaction** occurs:
   - The system calculates the total cart value.
   - An `INSERT` is made into the `orders` table to generate a unique `order_id`.
   - The system then iterates through the user's cart and `INSERT`s multiple rows into the `order_items` table.
   - Finally, a `DELETE` query empties the user's cart.
   - *Crucially*, all of these steps happen inside a single transaction. If any step fails, the entire transaction **Rolls Back** to ensure the database doesn't end up in a corrupted state (e.g., paying for an order but the cart doesn't empty).

### 2. How Foreign Keys & Table Connections Work
Foreign Keys (FK) are used to maintain **Referential Integrity**. They ensure that you cannot have a record in one table that points to a non-existent record in another table.

* **`cart` Table Connections:**
  The `cart` table connects a User to a Product. 
  - `user_id (FK)` references `users(id)`.
  - `product_id (FK)` references `products(id)`.
  *This means you cannot add an item to the cart for a user that doesn't exist, nor can you add a product that doesn't exist.*

* **Resolving Many-to-Many Relationships (`order_items`):**
  An Order can contain many Products, and a Product can belong to many Orders. Databases cannot handle Many-to-Many relationships directly. Therefore, we use a **Junction Table** called `order_items`.
  - It contains `order_id (FK)` referencing `orders(id)`.
  - It contains `product_id (FK)` referencing `products(id)`.
  This perfectly normalizes the data.

### 3. Key DBMS Concepts Implemented
* **ON DELETE CASCADE:**
  If an Admin deletes a Product from the store, what happens to the carts of users who had that product? Because our Foreign Keys are set to `ON DELETE CASCADE`, MySQL automatically searches the `cart` table and deletes any rows containing that `product_id`. This prevents "Orphaned Records" and keeps the database perfectly clean.
  
* **Historical Data Preservation (`price_at_time`):**
  In the `order_items` table, we store the `unit_price`. Why? Because if an admin changes the price of a product in the `products` table *tomorrow*, we do not want past orders to suddenly reflect the new price. Storing the price at the exact moment of the transaction inside the junction table is a critical database design best practice.

* **Connection Pooling:**
  Every time a user clicks a button, we need to talk to the database. Instead of opening and closing a new connection every single time (which is slow and crashes servers), the backend uses `mysql.connector.pooling`. This keeps a "pool" of 10 active database connections open at all times, making the app incredibly fast and capable of handling multiple users simultaneously.

---

## ⚡ Key Features

### 🔐 Secure Authentication & Authorization
- User registration and login with strictly hashed passwords (`Werkzeug`).
- Role-based access control (Customers vs. Admins).
- Secure, session-based REST API endpoints preventing unauthorized database access.

### 🛍️ Dynamic Product Catalog
- Products are fetched and rendered live from the MySQL database.
- Seamless single-page UI built with vanilla JavaScript (no page reloads).
- Advanced UI design featuring glassmorphism, soft shadows, and premium typography.

### 📊 Admin Dashboard
- Live database aggregation queries (`COUNT`, `SUM`) to display total sales, active users, and recent order history.

---

## 🏗️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla JavaScript, Custom CSS (Glassmorphism, CSS Variables) |
| **Backend API** | Python, Flask, Flask-Session |
| **Database** | MySQL (with `mysql.connector.pooling`) |
| **Security** | JSON Web Tokens (JWT) / Server-side Sessions, SHA-256 Hashing |

---

## 📂 Folder Structure

```text
GlobalCart/
│
├── api/                    # Flask Blueprints (REST API Endpoints)
│   ├── auth.py             # Login, Register, Session Management
│   ├── products.py         # Product fetching and catalog
│   ├── cart.py             # Cart operations (Add, Remove, Update)
│   └── orders_payments.py  # Checkout logic and transactional inserts
│
├── static/                 # Static Assets
│   ├── css/main.css        # Premium Glassmorphism styling
│   └── js/app.js           # Vanilla JS SPA routing and API fetching
│
├── templates/              # HTML Views
│   └── index.html          # Main SPA entry point
│
├── .env                    # Environment variables (Database credentials)
├── .gitignore              # Git ignore file (Secures .env & pycache)
├── app.py                  # Main Flask application entry point
├── db.py                   # MySQL Connection Pooling configuration
├── requirements.txt        # Python dependencies
└── schema.sql              # Database schema and seed data
```

---

## 🚀 Installation & Setup

Follow these steps to run the project locally on your machine.

### Prerequisites
1. **Python 3.10+** installed.
2. **MySQL Server** installed and running (via XAMPP, WAMP, or standalone).

### Step 1: Clone the Repository
```bash
git clone https://github.com/adityasing9/GlobalCart.git
cd GlobalCart
```

### Step 2: Configure the Database
1. Open your MySQL client (e.g., MySQL Workbench, phpMyAdmin).
2. Execute the entire SQL script located in `schema.sql`. This will create the `globalcart` database, build all the necessary tables, and insert sample products.

### Step 3: Set up Environment Variables
1. Create a file named `.env` in the root directory.
2. Add your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=globalcart
SECRET_KEY=your_super_secret_flask_key
```

### Step 4: Install Dependencies & Run
```bash
# It is highly recommended to use a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install required Python packages
pip install -r requirements.txt

# Run the Flask Server
python app.py
```
**Access the app:** Open your web browser and go to `http://127.0.0.1:5000`.

---

<div align="center">
  <p>Built with ❤️ by Team GlobalCart for DBMS Mini Project</p>
</div>
