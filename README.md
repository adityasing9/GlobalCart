# GlobalCart — Digital Products Marketplace

A full-stack e-commerce web app for selling digital products, built with Flask + MySQL + vanilla HTML/CSS/JS.

---

## Project Structure

```
globalcart/
├── app.py                    # Flask entry point
├── db.py                     # MySQL connection pool
├── requirements.txt
├── schema.sql                # DB schema + seed data
├── .env                      # Environment variables (edit this)
├── api/
│   ├── auth.py               # /api/auth routes
│   ├── products.py           # /api/products routes
│   ├── cart.py               # /api/cart routes
│   └── orders_payments.py    # /api/orders + /api/payments routes
├── static/
│   ├── css/main.css
│   └── js/app.js
└── templates/
    └── index.html
```

---

## Setup Instructions

### 1. Prerequisites
- Python 3.9+
- MySQL 8.0+ running locally
- pip

### 2. Create the database

```bash
mysql -u root -p < schema.sql
```

This creates the `globalcart` database, all tables, categories, sample products, and a default admin user.

### 3. Configure environment

Edit `.env`:
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_actual_mysql_password
MYSQL_DATABASE=globalcart
SECRET_KEY=any-random-secret-string
```

### 4. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the server

```bash
python app.py
```

The app will be available at: **http://localhost:5000**

---

## Demo Credentials

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@globalcart.com     | admin123  |

> **Note:** The default admin password in schema.sql is a placeholder hash. You should register a new admin account using the `/register` page, then update the role in MySQL:
> ```sql
> UPDATE users SET role='admin' WHERE email='youremail@example.com';
> ```

---

## Pages

| URL          | Description              |
|--------------|--------------------------|
| `/`          | Home with hero + products|
| `/products`  | All products + search + filter |
| `/product/1` | Product detail page      |
| `/cart`      | Shopping cart            |
| `/checkout`  | Payment gateway selection|
| `/orders`    | Order history + downloads|
| `/login`     | Login                    |
| `/register`  | Registration             |
| `/admin`     | Admin dashboard          |

---

## API Routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/products/?category=&search=
GET    /api/products/:id
POST   /api/products/          (admin only)
PUT    /api/products/:id       (admin only)
DELETE /api/products/:id       (admin only)
GET    /api/products/categories/all

GET    /api/cart/
POST   /api/cart/add
PUT    /api/cart/update
DELETE /api/cart/remove/:id
DELETE /api/cart/clear

POST   /api/orders/create
GET    /api/orders/

POST   /api/payments/initiate
POST   /api/payments/confirm
```

---

## Payment Gateways

| Gateway   | Region       | Mode      |
|-----------|--------------|-----------|
| Razorpay  | India        | Test/Simulated |
| Khalti    | Nepal        | Simulated |
| Card      | International| Simulated |
| Crypto    | Global       | Simulated |

For real Razorpay integration, add your keys to `.env` and install `razorpay` package.

---

## Tech Stack

- **Backend:** Python 3, Flask, MySQL (connection pooling)
- **Frontend:** HTML5, CSS3 (glassmorphism), Vanilla JS (SPA router)
- **Auth:** Session-based with Werkzeug password hashing
- **DB:** MySQL 8 with normalized schema (3NF), foreign keys, parameterized queries
- **Fonts:** Syne (display) + DM Sans (body) — Google Fonts
