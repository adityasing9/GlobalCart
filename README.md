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

## ⚡ Key Features

### 🔐 Secure Authentication & Authorization
- User registration and login with strictly hashed passwords (`Werkzeug`).
- Role-based access control (Customers vs. Admins).
- Secure, session-based REST API endpoints preventing unauthorized database access.

### 🛍️ Dynamic Product Catalog
- Products are fetched and rendered live from the MySQL database.
- Seamless single-page UI built with vanilla JavaScript (no page reloads).
- Advanced UI design featuring glassmorphism, soft shadows, and premium typography.

### 🛒 Real-time Cart Management
- Persistent cart storage in the database across user sessions.
- Dynamic addition, removal, and quantity adjustments.

### 💳 Transactional Checkout
- Secure order generation ensuring ACID properties.
- **Many-to-Many resolution** linking Orders to Products via an `order_items` table.
- Records the `price_at_time` to prevent historical data corruption if product prices change later.

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

## 🗄️ Database Architecture (E-R Design)

The backend relies on a strictly normalized relational database.

### Core Tables
1. **`users`**: Stores credentials securely (`id`, `username`, `email` (UNIQUE), `password_hash`, `role`).
2. **`products`**: Stores digital item metadata (`id`, `name`, `price`, `description`, `category`).
3. **`cart`**: Temporary storage (`id`, `user_id` (FK), `product_id` (FK), `quantity`).
4. **`orders`**: Tracks successful checkouts (`id`, `user_id` (FK), `total_amount`, `status`).
5. **`order_items`**: Resolves Many-to-Many relationships (`id`, `order_id` (FK), `product_id` (FK), `unit_price`).

### Key DBMS Concepts Implemented:
- **Primary Keys (PK) & Foreign Keys (FK):** Strict referential integrity.
- **Constraints:** `UNIQUE`, `NOT NULL`.
- **Cascading Deletes:** `ON DELETE CASCADE` prevents orphaned data when a user or product is removed.
- **Transactions:** Ensuring all order items are inserted successfully, or the entire checkout rolls back.

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

## 🔮 Future Enhancements
- [ ] **Database Triggers:** Automate inventory reduction and sales count updates directly at the database level.
- [ ] **Full-Text Search:** Implement SQL `FULLTEXT` indexing for extremely fast product searches.
- [ ] **Payment Gateway:** Integrate Stripe or Razorpay APIs to handle real-world transactions.

---

<div align="center">
  <p>Built with ❤️ by Team GlobalCart for DBMS Mini Project</p>
</div>
