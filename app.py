import os
from flask import Flask, send_from_directory, session
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.getenv('SECRET_KEY', 'globalcart-dev-secret')
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

from api.auth import auth_bp
from api.products import products_bp
from api.cart import cart_bp
from api.orders_payments import orders_bp, payments_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(products_bp, url_prefix='/api/products')
app.register_blueprint(cart_bp, url_prefix='/api/cart')
app.register_blueprint(orders_bp, url_prefix='/api/orders')
app.register_blueprint(payments_bp, url_prefix='/api/payments')

# Serve frontend pages
@app.route('/')
@app.route('/products')
@app.route('/cart')
@app.route('/checkout')
@app.route('/orders')
@app.route('/login')
@app.route('/register')
@app.route('/admin')
@app.route('/product/<int:product_id>')
def frontend(product_id=None):
    return send_from_directory('templates', 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
