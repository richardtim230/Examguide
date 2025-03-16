const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');  // Import SQLite connection

const app = express();
app.use(bodyParser.json());

// Helper function to validate input
const validateInput = (fullName, facultyCode, department, level) => {
    if (!fullName || !facultyCode || !department || !level) {
        return false;
    }
    return true;
};

// User Registration Endpoint
app.post('/register-user', async (req, res) => {
    const { fullName, facultyCode, faculty, department, level, userId } = req.body;

    // Validate input
    if (!validateInput(fullName, facultyCode, department, level)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        // Insert user into database
        db.run(`INSERT INTO users (fullName, facultyCode, faculty, department, level, userId) VALUES (?, ?, ?, ?, ?, ?)`, 
            [fullName, facultyCode, faculty, department, level, userId], function(err) {
            if (err) {
                return res.status(400).json({ error: 'Database error: ' + err.message });
            }
            res.json({ message: 'User registered successfully', userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
