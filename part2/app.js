const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Add session sup
const session = require('express-session');

app.use(session({
  secret: 'dog-secret',
  resave: false,
  saveUninitialized: true
}));


// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;

app.use