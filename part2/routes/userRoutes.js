const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM Users WHERE username = ? AND password_hash = ?',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid'); // remove session cookie
    res.json({ message: 'Logged out' });
  });
});


    // Store session
    req.session.user = {
      id: rows[0].user_id,
      username: rows[0].username,
      role: rows[0].role
    };

    res.json(req.session.user); // send role back to frontend
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});


module.exports = router;