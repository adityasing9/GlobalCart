from flask import Blueprint, request, jsonify, session
from db import get_db

cart_bp = Blueprint('cart', __name__)

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Login required'}), 401
        return f(*args, **kwargs)
    return decorated

@cart_bp.route('/', methods=['GET'])
@login_required
def get_cart():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image_url
            FROM cart c JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
        """, (session['user_id'],))
        items = cursor.fetchall()
        for item in items:
            item['price'] = float(item['price'])
            item['subtotal'] = item['price'] * item['quantity']
        total = sum(i['subtotal'] for i in items)
        return jsonify({'items': items, 'total': round(total, 2), 'count': len(items)})
    finally:
        cursor.close()
        conn.close()

@cart_bp.route('/add', methods=['POST'])
@login_required
def add_to_cart():
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO cart (user_id, product_id, quantity)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE quantity = quantity + %s
        """, (session['user_id'], product_id, quantity, quantity))
        conn.commit()
        return jsonify({'message': 'Added to cart'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@cart_bp.route('/update', methods=['PUT'])
@login_required
def update_cart():
    data = request.get_json()
    cart_id = data.get('cart_id')
    quantity = data.get('quantity', 1)
    conn = get_db()
    cursor = conn.cursor()
    try:
        if quantity <= 0:
            cursor.execute("DELETE FROM cart WHERE id=%s AND user_id=%s", (cart_id, session['user_id']))
        else:
            cursor.execute("UPDATE cart SET quantity=%s WHERE id=%s AND user_id=%s",
                           (quantity, cart_id, session['user_id']))
        conn.commit()
        return jsonify({'message': 'Updated'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@cart_bp.route('/remove/<int:cart_id>', methods=['DELETE'])
@login_required
def remove_from_cart(cart_id):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM cart WHERE id=%s AND user_id=%s", (cart_id, session['user_id']))
        conn.commit()
        return jsonify({'message': 'Removed'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@cart_bp.route('/clear', methods=['DELETE'])
@login_required
def clear_cart():
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM cart WHERE user_id=%s", (session['user_id'],))
        conn.commit()
        return jsonify({'message': 'Cart cleared'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
