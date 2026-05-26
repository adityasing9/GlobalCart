from flask import Blueprint, request, jsonify, session
from db import get_db
import uuid
import random
import string

orders_bp = Blueprint('orders', __name__)
payments_bp = Blueprint('payments', __name__)

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Login required'}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

# ── ORDERS ──────────────────────────────────────────────

@orders_bp.route('/', methods=['GET'])
@login_required
def get_orders():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        user_id = session['user_id']
        is_admin = session.get('role') == 'admin'
        if is_admin:
            cursor.execute("""
                SELECT o.*, u.username, u.email,
                       p.status as payment_status, p.gateway
                FROM orders o
                JOIN users u ON o.user_id = u.id
                LEFT JOIN payments p ON p.order_id = o.id
                ORDER BY o.created_at DESC
            """)
        else:
            cursor.execute("""
                SELECT o.*,
                       p.status as payment_status, p.gateway
                FROM orders o
                LEFT JOIN payments p ON p.order_id = o.id
                WHERE o.user_id = %s ORDER BY o.created_at DESC
            """, (user_id,))
        orders = cursor.fetchall()
        for order in orders:
            order['total_amount'] = float(order['total_amount'])
            cursor.execute("""
                SELECT oi.*, p.name, p.image_url, p.file_url
                FROM order_items oi JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
            """, (order['id'],))
            items = cursor.fetchall()
            for item in items:
                item['unit_price'] = float(item['unit_price'])
            order['items'] = items
        return jsonify({'orders': orders})
    finally:
        cursor.close()
        conn.close()

@orders_bp.route('/create', methods=['POST'])
@login_required
def create_order():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        user_id = session['user_id']
        cursor.execute("""
            SELECT c.quantity, p.id as product_id, p.price
            FROM cart c JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
        """, (user_id,))
        cart_items = cursor.fetchall()
        if not cart_items:
            return jsonify({'error': 'Cart is empty'}), 400

        total = sum(float(item['price']) * item['quantity'] for item in cart_items)
        cursor.execute(
            "INSERT INTO orders (user_id, total_amount) VALUES (%s, %s)",
            (user_id, total)
        )
        order_id = cursor.lastrowid
        for item in cart_items:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                VALUES (%s, %s, %s, %s)
            """, (order_id, item['product_id'], item['quantity'], float(item['price'])))
        conn.commit()
        return jsonify({'message': 'Order created', 'order_id': order_id, 'total': total})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ── PAYMENTS ─────────────────────────────────────────────

def gen_txn_id(prefix='TXN'):
    return prefix + '_' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))

@payments_bp.route('/initiate', methods=['POST'])
@login_required
def initiate_payment():
    data = request.get_json()
    order_id = data.get('order_id')
    gateway = data.get('gateway', 'card')
    currency = data.get('currency', 'INR')
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM orders WHERE id=%s AND user_id=%s",
                       (order_id, session['user_id']))
        order = cursor.fetchone()
        if not order:
            return jsonify({'error': 'Order not found'}), 404

        txn_id = gen_txn_id(gateway.upper()[:3])
        cursor.execute("""
            INSERT INTO payments (order_id, user_id, gateway, currency, amount, transaction_id, method)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (order_id, session['user_id'], gateway, currency,
              float(order['total_amount']), txn_id, gateway))
        payment_id = cursor.lastrowid
        conn.commit()

        # Razorpay: return a fake order_id for frontend
        razorpay_order_id = None
        if gateway == 'razorpay':
            razorpay_order_id = 'order_' + ''.join(random.choices(string.ascii_letters + string.digits, k=14))

        return jsonify({
            'payment_id': payment_id,
            'transaction_id': txn_id,
            'amount': float(order['total_amount']),
            'currency': currency,
            'gateway': gateway,
            'razorpay_order_id': razorpay_order_id
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@payments_bp.route('/confirm', methods=['POST'])
@login_required
def confirm_payment():
    data = request.get_json()
    payment_id = data.get('payment_id')
    txn_ref = data.get('transaction_id')
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM payments WHERE id=%s AND user_id=%s",
                       (payment_id, session['user_id']))
        payment = cursor.fetchone()
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404

        # Mark payment success
        cursor.execute("UPDATE payments SET status='Success' WHERE id=%s", (payment_id,))
        # Confirm order
        cursor.execute("UPDATE orders SET status='Confirmed' WHERE id=%s", (payment['order_id'],))
        # Clear cart
        cursor.execute("DELETE FROM cart WHERE user_id=%s", (session['user_id'],))
        # Increment sales count
        cursor.execute("""
            UPDATE products p
            JOIN order_items oi ON p.id = oi.product_id
            SET p.sales_count = p.sales_count + oi.quantity
            WHERE oi.order_id = %s
        """, (payment['order_id'],))
        conn.commit()

        # Fetch order items with file_url for delivery
        cursor.execute("""
            SELECT oi.*, p.name, p.file_url
            FROM order_items oi JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
        """, (payment['order_id'],))
        items = cursor.fetchall()
        for item in items:
            item['unit_price'] = float(item['unit_price'])

        return jsonify({
            'message': 'Payment confirmed',
            'order_id': payment['order_id'],
            'downloads': items
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
