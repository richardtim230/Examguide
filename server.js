const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const db = require('./db');  // Import SQLite connection

const app = express();
app.use(bodyParser.json());

// Helper function to validate input
const validateInput = (username, password) => {
    if (!username || !password) {
        return false;
    }
    // Additional validation logic (e.g., regex checks) can be added here
    return true;
};

// SIGNUP: Register a new user
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!validateInput(username, password)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into database
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'User already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'User registered successfully', userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// LOGIN: Authenticate user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!validateInput(username, password)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(400).json({ error: 'Invalid username or password' });
            }

            // Compare hashed password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            res.json({ message: 'Login successful', userId: user.id });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET USER INFO: Retrieve user by ID
app.get('/user/:id', (req, res) => {
    db.get(`SELECT id, username FROM users WHERE id = ?`, [req.params.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
