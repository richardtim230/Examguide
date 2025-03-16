const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('users.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to SQLite database.');
});

// Create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
    userId INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL
)`);

module.exports = db;
