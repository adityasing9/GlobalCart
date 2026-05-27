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

## ❓ Frequently Asked Questions (DBMS Viva / Defense)

**1. How are passwords secured?**
Passwords are never stored in plain text. They are securely hashed using `Werkzeug`'s PBKDF2 with SHA-256 before being stored in the database.

**2. Why use a relational database instead of NoSQL?**
E-commerce requires strict data integrity, ACID transactions (especially during checkout), and complex relationships (Users to Orders to Products). A relational database (MySQL) naturally enforces these rules.

**3. How is data consistency maintained?**
Through Normalization, Foreign Key constraints (ensuring relationships are valid), and Database Transactions (ensuring an entire checkout succeeds or completely rolls back if an error occurs).

**4. How are orders connected to users?**
Through a Foreign Key. The `orders` table has a `user_id` column that directly references the `id` column in the `users` table.

**5. Why is normalization important?**
It eliminates data redundancy (e.g., not storing user details inside every single order row) and prevents data anomalies (insert/update/delete anomalies), keeping the database clean and efficient.

**6. How are many-to-many relationships handled?**
Relational databases cannot handle Many-to-Many directly. We use a junction (or mapping) table called `order_items` that contains Foreign Keys to both the `orders` table and the `products` table.

**7. What happens if foreign keys are removed?**
The database loses referential integrity. You could accidentally delete a user but leave their orders stranded (orphaned records), or add an item to the cart that doesn't actually exist in the products table.

**8. How does the checkout flow work?**
It operates inside a single atomic transaction: (1) Calculate the total amount. (2) `INSERT` into `orders` to generate an `order_id`. (3) `INSERT` cart items into `order_items` using that `order_id`. (4) `DELETE` the user's items from the `cart`. (5) Commit transaction.

**9. How are admin and user roles separated?**
The `users` table has a `role` ENUM column (either 'user' or 'admin'). The Flask backend checks this role during session validation to restrict access to admin-only API endpoints.

**10. Why use hashed passwords?**
If the database is ever compromised or leaked, hackers cannot see the actual passwords. Hashing is a one-way mathematical function and cannot be reversed.

**11. How does cart management work?**
The `cart` table temporarily links a `user_id` to a `product_id` with a `quantity`. Because it is stored in the database (not just local cookies), the cart persists even if the user logs in from a different device.

**12. What SQL queries are most used?**
`SELECT` with `JOIN`s (to fetch carts with product details), `INSERT` (for adding to cart and checkout), `DELETE` (removing from cart), and aggregation queries like `SUM()` and `COUNT()` for the admin dashboard.

**13. How does authentication work?**
Users submit their credentials. The backend hashes the password and compares it to the database hash using `check_password_hash`. If valid, a secure session token is generated and stored in the browser.

**14. How is payment data stored?**
Currently, the system records the payment `gateway` (e.g., razorpay, card), `status`, and `transaction_id` in a `payments` table. We do NOT store sensitive credit card numbers; we rely on external gateways for PCI compliance.

**15. How can scalability be improved?**
By implementing database indexing on frequently searched columns, adding a caching layer (like Redis) for the product catalog, and horizontally scaling the Flask backend behind a load balancer.

**16. Why is MySQL better for this project?**
MySQL is highly reliable, ACID compliant, and perfectly suited for structured transactional data like financial ledgers and e-commerce orders.

**17. How is database integrity maintained?**
By strictly enforcing Primary Keys (ensuring uniqueness), Foreign Keys (ensuring relationships), and Column Constraints (`UNIQUE`, `NOT NULL`, `DEFAULT`).

**18. What security measures are implemented?**
Password hashing, connection pooling (prevents connection exhaustion), parameterized queries (prevents SQL injection), and role-based access control (RBAC).

**19. What are the advantages of relational databases?**
Strict schema enforcement, powerful `JOIN` capabilities, ACID compliance for safe transactions, and a standardized querying language (SQL).

**20. How are relationships implemented between tables?**
By taking the Primary Key (`id`) of the parent table and placing it as a Foreign Key in the child table (e.g., placing `user_id` in the `orders` table).

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
