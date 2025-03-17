const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid'); // Secure user ID generation

const app = express();
app.use(bodyParser.json());

// Initialize database
const db = new sqlite3.Database('./database.db');

// Convert db.run to return a Promise
const runQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

// Validate Input
const validateInput = (fullName, facultyCode, department, level) => {
    return fullName && facultyCode && department && level;
};

// User Registration Endpoint
app.post('/register-user', async (req, res) => {
    try {
        console.log("Received request body:", req.body); // Debugging

        const { fullName, facultyCode, faculty, department, level } = req.body;

        if (!fullName || !facultyCode || !faculty || !department || !level) {
            return res.status(400).json({ error: 'Invalid input: All fields are required' });
        }

        const userId = Math.floor(100000 + Math.random() * 900000); // Generate a random user ID

        // Insert user into database
        db.run(
            `INSERT INTO users (userId, fullName, facultyCode, faculty, department, level) VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, fullName, facultyCode, faculty, department, level],
            function (err) {
                if (err) {
                    console.error("Database Error:", err.message);
                    return res.status(500).json({ error: 'Database error: ' + err.message });
                }

                console.log("User registered with ID:", userId);
                res.json({ message: 'User registered successfully', userId });
            }
        );
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
