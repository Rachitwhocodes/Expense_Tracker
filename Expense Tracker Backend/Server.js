const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:3000', // or your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  };
  
  app.use(cors(corsOptions));

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://Expense_Tracker:Rachit2003@cluster0.l1u25qt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Add this before your routes
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!req.is('application/json')) {
        return res.status(400).json({ error: 'Content-Type must be application/json' });
      }
    }
    next();
  });
// User Schema
const User = mongoose.model('User', {
  username: String,
  password: String // Store hashed passwords in production
});

// Expense Schema
const Expense = mongoose.model('Expense', {
  userId: mongoose.Types.ObjectId,
  name: String,
  amount: Number,
  date: Date
});

// Registration Endpoint
const bcrypt = require('bcryptjs');
const saltRounds = 10;
app.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const user = new User({ username, password: hashedPassword });
      await user.save();
      res.json({ success: true, userId: user._id });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

// Login Endpoint
app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
      if (!user) return res.json({ success: false });
      
      const match = await bcrypt.compare(password, user.password);
      res.json(match ? { success: true, userId: user._id } : { success: false });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
// Expense Endpoints
app.get('/expenses/:userId', async (req, res) => {
    try {
      const expenses = await Expense.find({ userId: req.params.userId });
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/expenses', async (req, res) => {
    try {
      const expense = new Expense(req.body);
      await expense.save();
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  require('dotenv').config();
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  