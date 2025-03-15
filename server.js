const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const uri = 'mongodb+srv://Richard:<Glorifiedbby1$>@oauife.klbem.mongodb.net/?retryWrites=true&w=majority&appName=OAUife'; // Replace with your MongoDB connection string
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db;
client.connect(err => {
  if (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
  db = client.db('examguide');
  console.log('Connected to MongoDB');
});

// Endpoint to register a new user
app.post('/register', async (req, res) => {
  const { fullName, department, level, faculty } = req.body;
  const userId = generateUserId(); // Implement this function to generate a unique user ID
  const newUser = { fullName, department, level, faculty, userId, scores: [] };

  try {
    await db.collection('users').insertOne(newUser);
    console.log('User registered successfully:', newUser);
    res.status(201).send({ userId });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send({ error: 'Failed to register user' });
  }
});

// Endpoint to save test score
app.post('/saveScore', async (req, res) => {
  const { userId, score } = req.body;

  try {
    await db.collection('users').updateOne(
      { userId },
      { $push: { scores: score } }
    );
    console.log('Score saved successfully for user:', userId);
    res.status(200).send({ message: 'Score saved successfully' });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).send({ error: 'Failed to save score' });
  }
});

// Endpoint to get user details and progress
app.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await db.collection('users').findOne({ userId });
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send({ error: 'Failed to fetch user data' });
  }
});

function generateUserId() {
  return 'U' + Math.floor(Math.random() * 1000000); // Simple user ID generation logic
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
