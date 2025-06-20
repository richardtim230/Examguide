
// Use this:
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('mydb.sqlite');
// Open a database connection
let db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

// Create a table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Created users table.');
});

// Close the database connection
db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Closed the database connection.');
});
