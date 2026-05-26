from flask import Blueprint, request, jsonify, session
from db import get_db

products_bp = Blueprint('products', __name__)

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

@products_bp.route('/', methods=['GET'])
def get_products():
    category = request.args.get('category', '')
    search = request.args.get('search', '')
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT p.*, GROUP_CONCAT(c.name) as categories, GROUP_CONCAT(c.slug) as category_slugs
            FROM products p
            LEFT JOIN product_category pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
        """
        params = []
        where = []
        if category:
            where.append("c.slug = %s")
            params.append(category)
        if search:
            where.append("(p.name LIKE %s OR p.description LIKE %s)")
            params.extend([f'%{search}%', f'%{search}%'])
        if where:
            query += " WHERE " + " AND ".join(where)
        query += " GROUP BY p.id ORDER BY p.sales_count DESC"
        cursor.execute(query, params)
        products = cursor.fetchall()
        for p in products:
            p['price'] = float(p['price'])
            p['rating'] = float(p['rating']) if p['rating'] else 4.5
            p['categories'] = p['categories'].split(',') if p['categories'] else []
            p['category_slugs'] = p['category_slugs'].split(',') if p['category_slugs'] else []
        return jsonify({'products': products})
    finally:
        cursor.close()
        conn.close()

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT p.*, GROUP_CONCAT(c.name) as categories
            FROM products p
            LEFT JOIN product_category pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE p.id = %s GROUP BY p.id
        """, (product_id,))
        p = cursor.fetchone()
        if not p:
            return jsonify({'error': 'Product not found'}), 404
        p['price'] = float(p['price'])
        p['rating'] = float(p['rating']) if p['rating'] else 4.5
        p['categories'] = p['categories'].split(',') if p['categories'] else []
        return jsonify({'product': p})
    finally:
        cursor.close()
        conn.close()

@products_bp.route('/', methods=['POST'])
@admin_required
def create_product():
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT INTO products (name, description, price, image_url, file_url, rating)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (data['name'], data['description'], data['price'],
              data.get('image_url',''), data.get('file_url',''), data.get('rating', 4.5)))
        product_id = cursor.lastrowid
        if data.get('category_ids'):
            for cid in data['category_ids']:
                cursor.execute("INSERT IGNORE INTO product_category VALUES (%s, %s)", (product_id, cid))
        conn.commit()
        return jsonify({'message': 'Product created', 'id': product_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@products_bp.route('/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE products SET name=%s, description=%s, price=%s, image_url=%s, file_url=%s
            WHERE id=%s
        """, (data['name'], data['description'], data['price'],
              data.get('image_url',''), data.get('file_url',''), product_id))
        conn.commit()
        return jsonify({'message': 'Updated'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM products WHERE id=%s", (product_id,))
        conn.commit()
        return jsonify({'message': 'Deleted'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@products_bp.route('/categories/all', methods=['GET'])
def get_categories():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM categories")
        cats = cursor.fetchall()
        return jsonify({'categories': cats})
    finally:
        cursor.close()
        conn.close()
