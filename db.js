const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create users table if not exists
db.run(
    `CREATE TABLE IF NOT EXISTS users (
        userId INTEGER PRIMARY KEY, 
        fullName VARCHAR(255) NOT NULL,
        facultyCode VARCHAR(50) NOT NULL,
        faculty VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        level VARCHAR(10) NOT NULL
    )`,
    (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table is ready.');
        }
    }
);

// Close database connection properly on process exit
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

module.exports = db;
