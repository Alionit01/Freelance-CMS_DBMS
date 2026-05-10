from flask import Flask, jsonify, request
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
    # IMPORTANT: This line enables Foreign Key constraints for this connection!
    conn.execute('PRAGMA foreign_keys = ON;')
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


@app.route('/api/clients', methods=['POST'])
def add_client():
    # 1. Get the data from the frontend request
    data = request.get_json()

    # 2. Extract fields
    name = data.get('client_name')
    email = data.get('email')
    phone = data.get('phone')
    company = data.get('company_name')
    address = data.get('address')

    # 3. Basic validation (DBMS requirement: check for NOT NULL fields)
    if not name or not email:
        return jsonify({"error": "Name and Email are required"}), 400

    try:
        conn = get_db_connection()
        # 4. RAW SQL INSERT (Using '?' to prevent SQL Injection - very important!)
        query = '''
                INSERT INTO clients (client_name, email, phone, company_name, address)
                VALUES (?, ?, ?, ?, ?) \
                '''
        conn.execute(query, (name, email, phone, company, address))
        conn.commit()
        conn.close()

        return jsonify({"message": "Client added successfully!"}), 201

    except sqlite3.IntegrityError as e:
        # This catches things like duplicate emails or CHECK constraint failures
        return jsonify({"error": f"Database error: {str(e)}"}), 400


@app.route('/api/projects', methods=['GET'])
def get_projects():
    conn = get_db_connection()
    # Use LEFT JOIN so projects show up even if the client is missing (for debugging)
    query = '''
        SELECT p.*, c.client_name 
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.client_id
    '''
    projects = conn.execute(query).fetchall()
    conn.close()

    output = []
    for p in projects:
        output.append({
            "project_id": p['project_id'],    # Match the database name
            "project_name": p['project_name'],# Match the database name
            "client_id": p['client_id'],      # Match the database name
            "client_name": p['client_name'],  # Extra info for display
            "start_date": p['start_date'],
            "budget": p['budget'],
            "status": p['status'],
            "description": p['description']
        })
    return jsonify(output)


@app.route('/api/projects', methods=['POST'])
def add_project():
    data = request.get_json()

    # Extract data
    name = data.get('project_name')
    client_id = data.get('client_id')
    start_date = data.get('start_date')  # Format: YYYY-MM-DD
    budget = data.get('budget')
    description = data.get('description', '')

    if not name or not client_id or not start_date or not budget:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        query = '''
                INSERT INTO projects (project_name, client_id, start_date, budget, status, description)
                VALUES (?, ?, ?, ?, 'Pending', ?) \
                '''
        conn.execute(query, (name, client_id, start_date, budget, description))
        conn.commit()
        conn.close()
        return jsonify({"message": "Project created successfully!"}), 201

    except sqlite3.IntegrityError as e:
        # This will trigger if the client_id does not exist!
        return jsonify({"error": "Database Integrity Error: Check if Client ID exists"}), 400


# --- EMPLOYEES API ---

@app.route('/api/employees', methods=['GET'])
def get_employees():
    conn = get_db_connection()
    employees = conn.execute('SELECT * FROM employees').fetchall()
    conn.close()

    output = []
    for e in employees:
        output.append({
            "employee_id": e['employee_id'],
            "employee_name": e['employee_name'],
            "email": e['email'],
            "role": e['role'],
            "salary": e['salary'],
            "hire_date": e['hire_date']
        })
    return jsonify(output)


@app.route('/api/employees', methods=['POST'])
def add_employee():
    data = request.get_json()
    name = data.get('employee_name')
    email = data.get('email')
    role = data.get('role')
    salary = data.get('salary')
    phone = data.get('phone')

    if not name or not email or not role or not salary:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        query = '''
                INSERT INTO employees (employee_name, email, role, salary, phone)
                VALUES (?, ?, ?, ?, ?) \
                '''
        conn.execute(query, (name, email, role, salary, phone))
        conn.commit()
        conn.close()
        return jsonify({"message": "Employee added successfully!"}), 201
    except sqlite3.IntegrityError as e:
        # This catches: Duplicate Email OR Role not in ('Developer','Designer', etc) OR Salary < 0
        return jsonify({"error": f"Database Error: {str(e)}"}), 400

# --- TASKS API ---

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    conn = get_db_connection()
    # 3-TABLE JOIN: Get task info + Project Name + Employee Name
    query = '''
        SELECT t.*, p.project_name, e.employee_name 
        FROM tasks t
        JOIN projects p ON t.project_id = p.project_id
        JOIN employees e ON t.employee_id = e.employee_id
    '''
    tasks = conn.execute(query).fetchall()
    conn.close()

    output = []
    for t in tasks:
        output.append({
            "task_id": t['task_id'],
            "task_name": t['task_name'],
            "project_name": t['project_name'],
            "employee_name": t['employee_name'],
            "priority": t['priority'],
            "status": t['status'],
            "due_date": t['due_date']
        })
    return jsonify(output)

@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    name = data.get('task_name')
    project_id = data.get('project_id')
    employee_id = data.get('employee_id')
    priority = data.get('priority', 'Medium')
    due_date = data.get('due_date')

    if not name or not project_id or not employee_id:
        return jsonify({"error": "Task name, Project ID, and Employee ID are required"}), 400

    try:
        conn = get_db_connection()
        query = '''
            INSERT INTO tasks (task_name, project_id, employee_id, priority, status, due_date)
            VALUES (?, ?, ?, ?, 'Pending', ?)
        '''
        conn.execute(query, (name, project_id, employee_id, priority, due_date))
        conn.commit()
        conn.close()
        return jsonify({"message": "Task assigned successfully!"}), 201
    except sqlite3.IntegrityError as e:
        return jsonify({"error": "Database Error: Ensure Project and Employee IDs exist"}), 400

@app.route('/api/dashboard/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    # Complex queries for reports
    total_clients = conn.execute('SELECT COUNT(*) FROM clients').fetchone()[0]
    total_projects = conn.execute('SELECT COUNT(*) FROM projects').fetchone()[0]
    total_revenue = conn.execute('SELECT SUM(amount) FROM payments WHERE status="Paid"').fetchone()[0] or 0
    pending_tasks = conn.execute('SELECT COUNT(*) FROM tasks WHERE status="Pending"').fetchone()[0]

    conn.close()
    return jsonify({
        "clients": total_clients,
        "projects": total_projects,
        "revenue": total_revenue,
        "pending_tasks": pending_tasks
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)