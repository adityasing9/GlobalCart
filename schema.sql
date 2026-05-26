-- GlobalCart Database Schema
CREATE DATABASE IF NOT EXISTS globalcart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE globalcart;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT '📦'
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    file_url VARCHAR(500),
    rating DECIMAL(3,2) DEFAULT 4.5,
    sales_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product-Category (many-to-many)
CREATE TABLE IF NOT EXISTS product_category (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Cart
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Cancelled') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    gateway ENUM('razorpay', 'khalti', 'card', 'crypto') NOT NULL,
    method VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'INR',
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Success', 'Failed') DEFAULT 'Pending',
    transaction_id VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Seed Categories
INSERT IGNORE INTO categories (name, slug, icon) VALUES
('Programming', 'programming', '💻'),
('College Notes', 'college-notes', '📚'),
('AI Resources', 'ai-resources', '🤖'),
('Career', 'career', '🚀');

-- Seed Admin User (password: admin123)
INSERT IGNORE INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@globalcart.com', 'pbkdf2:sha256:600000$admin123salt$hashedvalue', 'admin');

-- Seed Sample Products
INSERT IGNORE INTO products (name, description, price, image_url, file_url, rating, sales_count) VALUES
('Complete Python Mastery Bundle', 'From beginner to advanced Python. Covers data structures, OOP, decorators, async, and real project builds. 400+ pages.', 299.00, 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&q=80', '/downloads/python-mastery.pdf', 4.8, 1243),
('Machine Learning Crash Course', 'Hands-on ML with scikit-learn, pandas, and TensorFlow. Includes 10 complete projects with datasets.', 499.00, 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80', '/downloads/ml-course.pdf', 4.9, 892),
('GATE CS Notes 2025', 'Comprehensive GATE Computer Science notes. All subjects covered: DS, Algorithms, OS, DBMS, CN, TOC.', 199.00, 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80', '/downloads/gate-cs.pdf', 4.7, 2156),
('Ultimate Resume Template Pack', '15 ATS-friendly resume templates for tech roles. Includes cover letter templates and LinkedIn optimization guide.', 149.00, 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80', '/downloads/resume-pack.zip', 4.6, 3421),
('Prompt Engineering Bible', 'Master ChatGPT, Claude, and Gemini. 200+ proven prompts for coding, writing, analysis, and automation.', 349.00, 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=400&q=80', '/downloads/prompt-bible.pdf', 4.9, 567),
('Data Structures & Algorithms', 'Complete DSA guide for interviews. Arrays to graphs, sorting, DP — with Java, Python, and C++ code.', 399.00, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80', '/downloads/dsa-guide.pdf', 4.8, 1876),
('B.Tech Semester Notes Bundle', 'Complete notes for all 8 semesters — Electronics, CSE, and Mechanical branches. University exam focused.', 249.00, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80', '/downloads/btech-notes.pdf', 4.5, 4302),
('LangChain AI Agent Handbook', 'Build production-ready AI agents with LangChain, LangGraph, and OpenAI. Includes 5 complete agent projects.', 599.00, 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80', '/downloads/langchain-book.pdf', 4.9, 234),
('System Design Interview Guide', 'Crack FAANG system design rounds. Covers microservices, caching, load balancing, and real architectures.', 449.00, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80', '/downloads/system-design.pdf', 4.8, 1102),
('React + Next.js Masterclass', 'Build 5 production apps with React 18, Next.js 14, TypeScript, and Tailwind. Includes deployment guides.', 379.00, 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80', '/downloads/react-nextjs.pdf', 4.7, 789);

-- Link products to categories
INSERT IGNORE INTO product_category VALUES
(1,1),(2,3),(3,2),(4,4),(5,3),(6,1),(7,2),(8,3),(9,4),(10,1);
