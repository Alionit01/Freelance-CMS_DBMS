import sqlite3
import os

def init_database():
    db_path = os.path.join(os.path.dirname(__file__), 'freelance.db')
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')

    # IF the database already exists, delete it so we can start fresh
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Existing database deleted. Creating a new one...")

    connection = sqlite3.connect(db_path)

    with open(schema_path) as f:
        connection.executescript(f.read())

    connection.commit()
    connection.close()
    print("Database initialized successfully at:", db_path)

if __name__ == "__main__":
    init_database()