require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// User Schema
const User = mongoose.model('User', {
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

// Expense Schema
const Expense = mongoose.model('Expense', {
  userId: { type: mongoose.Types.ObjectId, required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now }
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Registration
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    
    res.json({ 
      success: true,
      message: 'User registered successfully'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + error.message 
    });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and password are required'
      });
    }
    
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    const match = await bcrypt.compare(password, user.password);
    
    if (match) {
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      res.json({ 
        success: true, 
        token,
        userId: user._id.toString(),
        username: user.username
      });
    } else {
      res.status(401).json({ 
        success: false,
        error: 'Invalid credentials'
      });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error: ' + error.message 
    });
  }
});

// Get Expenses (protected)
app.get('/expenses', authenticate, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.userId });
    res.json(expenses);
    
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Add Expense (protected)
app.post('/expenses', authenticate, async (req, res) => {
  try {
    const { name, amount } = req.body;
    
    if (!name || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid expense data' });
    }
    
    const expense = new Expense({
      userId: req.user.userId,
      name,
      amount,
      date: new Date()
    });
    
    await expense.save();
    res.json(expense);
    
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(400).json({ error: 'Bad request: ' + error.message });
  }
});

// Start Server
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));