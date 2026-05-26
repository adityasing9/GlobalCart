from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'All fields required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    pw_hash = generate_password_hash(password)
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)",
            (username, email, pw_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        session['user_id'] = user_id
        session['username'] = username
        session['role'] = 'user'
        return jsonify({'message': 'Registered successfully', 'user': {'id': user_id, 'username': username, 'role': 'user'}}), 201
    except Exception as e:
        conn.rollback()
        if 'Duplicate' in str(e):
            return jsonify({'error': 'Username or email already exists'}), 409
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({'message': 'Login successful', 'user': {
            'id': user['id'], 'username': user['username'], 'role': user['role']
        }})
    finally:
        cursor.close()
        conn.close()

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})

@auth_bp.route('/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({'user': None})
    return jsonify({'user': {
        'id': session['user_id'],
        'username': session['username'],
        'role': session['role']
    }})
