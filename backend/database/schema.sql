

PRAGMA foreign_keys = ON;

-- ---------- 1. CLIENTS ----------
CREATE TABLE clients (
    client_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name   TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    phone         TEXT    UNIQUE,
    company_name  TEXT,
    address       TEXT,
    created_date  DATE    NOT NULL DEFAULT CURRENT_DATE,
    CHECK (email LIKE '%_@_%._%')
);

-- ---------- 2. EMPLOYEES ----------
CREATE TABLE employees (
    employee_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    phone         TEXT    UNIQUE,
    role          TEXT    NOT NULL,
    hire_date     DATE    NOT NULL DEFAULT CURRENT_DATE,
    salary        REAL    NOT NULL,
    CHECK (salary > 0),
    CHECK (role IN ('Developer','Designer','Tester','Manager','Analyst'))
);

-- ---------- 3. PROJECTS (Added Priority) ----------
CREATE TABLE projects (
    project_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name  TEXT    NOT NULL,
    client_id     INTEGER NOT NULL,
    start_date    DATE    NOT NULL,
    end_date      DATE,
    budget        REAL    NOT NULL,
    priority      TEXT    NOT NULL DEFAULT 'Medium', -- Added this
    status        TEXT    NOT NULL DEFAULT 'Pending',
    description   TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    CHECK (budget >= 0),
    CHECK (priority IN ('Low','Medium','High')),      -- Added this
    CHECK (status IN ('Pending','Ongoing','Completed','Cancelled')),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ---------- 4. TASKS (Added created_at for auditing) ----------
CREATE TABLE tasks (
    task_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    task_name     TEXT    NOT NULL,
    project_id    INTEGER NOT NULL,
    employee_id   INTEGER NOT NULL,
    priority      TEXT    NOT NULL DEFAULT 'Medium',
    status        TEXT    NOT NULL DEFAULT 'Pending',
    due_date      DATE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Good for reporting
    description   TEXT,
    FOREIGN KEY (project_id)  REFERENCES projects(project_id)  ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
    CHECK (priority IN ('Low','Medium','High')),
    CHECK (status   IN ('Pending','In Progress','Completed'))
);

-- ---------- 5. PAYMENTS ----------
CREATE TABLE payments (
    payment_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id     INTEGER NOT NULL,
    amount         REAL    NOT NULL,
    payment_date   DATE    NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT    NOT NULL,
    status         TEXT    NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    CHECK (amount > 0),
    CHECK (payment_method IN ('Bank Transfer','Credit Card','PayPal','Cash','Cheque')),
    CHECK (status IN ('Pending','Paid','Failed','Refunded'))
);

CREATE VIEW project_financial_summary AS
SELECT
    p.project_id,
    p.project_name,
    p.budget,
    COALESCE(SUM(CASE WHEN pay.status = 'Paid' THEN pay.amount ELSE 0 END), 0) AS total_paid,
    p.budget - COALESCE(SUM(CASE WHEN pay.status = 'Paid' THEN pay.amount ELSE 0 END), 0) AS balance_due
FROM projects p
LEFT JOIN payments pay ON p.project_id = pay.project_id
GROUP BY p.project_id;

-- =========================================================
-- SAMPLE DATA
-- =========================================================

INSERT INTO clients (client_name,email,phone,company_name,address) VALUES
 ('Ali Raza',   'ali@brightco.com',  '03001234567','BrightCo',    'Karachi, PK'),
 ('Sara Khan',  'sara@novatech.com', '03017654321','NovaTech',    'Lahore, PK'),
 ('John Smith', 'john@acme.io',      '14155550100','Acme Corp',   'New York, USA');

INSERT INTO employees (employee_name,email,phone,role,salary) VALUES
 ('Hamza Sheikh','hamza@firm.com','03111111111','Developer', 90000),
 ('Ayesha Noor', 'ayesha@firm.com','03122222222','Designer', 75000),
 ('Bilal Ahmed', 'bilal@firm.com', '03133333333','Tester',   60000),
 ('Fatima Iqbal','fatima@firm.com','03144444444','Manager', 120000);

INSERT INTO projects (project_name,client_id,start_date,end_date,budget,status,description) VALUES
 ('E-Commerce Website',     1,'2026-01-10','2026-04-30',250000,'Ongoing',  'Online store with cart and payments'),
 ('Mobile Banking App',     2,'2026-02-01','2026-06-15',500000,'Ongoing',  'iOS + Android banking app'),
 ('Company Portfolio Site', 3,'2025-11-01','2026-01-15', 80000,'Completed','Static portfolio website'),
 ('Inventory Dashboard',    1,'2026-03-01',NULL,        150000,'Pending',  'Internal stock dashboard');

INSERT INTO tasks (task_name,project_id,employee_id,priority,status,due_date) VALUES
 ('Design Homepage UI',         1,2,'High',  'Completed', '2026-01-25'),
 ('Build Product Catalog API',  1,1,'High',  'In Progress','2026-03-10'),
 ('QA Testing - Cart Module',   1,3,'Medium','Pending',   '2026-04-05'),
 ('Wireframe Banking Screens',  2,2,'High',  'Completed', '2026-02-20'),
 ('Develop Login + OTP Flow',   2,1,'High',  'In Progress','2026-04-15'),
 ('Deploy Portfolio Site',      3,1,'Low',   'Completed', '2026-01-15'),
 ('Plan Inventory Schema',      4,4,'Medium','Pending',   '2026-03-20');

INSERT INTO payments (project_id,amount,payment_date,payment_method,status) VALUES
 (1, 50000,'2026-01-15','Bank Transfer','Paid'),
 (1, 75000,'2026-03-01','Bank Transfer','Paid'),
 (2,100000,'2026-02-10','Credit Card',  'Paid'),
 (2,150000,'2026-04-20','Credit Card',  'Pending'),
 (3, 80000,'2026-01-20','PayPal',       'Paid'),
 (4, 30000,'2026-03-05','Cash',         'Pending');

