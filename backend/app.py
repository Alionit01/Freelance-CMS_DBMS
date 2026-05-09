from flask import Flask, jsonify
from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)  # This allows your friend's frontend to talk to your backend


# Helper function to connect to the database
def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'freelance.db')
    conn = sqlite3.connect(db_path)
    # This allows us to access columns by name (like row['client_name'])
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/')
def home():
    return "Freelance System API is Running!"


# --- CLIENTS API ---

@app.route('/api/clients', methods=['GET'])
def get_clients():
    conn = get_db_connection()
    # RAW SQL QUERY
    clients = conn.execute('SELECT * FROM clients').fetchall()
    conn.close()

    # Convert the raw SQL rows into a list of dictionaries for JSON
    output = []
    for client in clients:
        output.append({
            "id": client['client_id'],
            "name": client['client_name'],
            "email": client['email'],
            "company": client['company_name']
        })

    return jsonify(output)


if __name__ == '__main__':
    app.run(debug=True, port=5000)