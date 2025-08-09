var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
require('dotenv').config();

// Import routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var learnerRouter = require('./routes/LeranerRouter');
var mentorRouter = require('./routes/MentorRouter');
var adminRouter = require('./routes/adminRouter');
var sessionRouter = require('./routes/sessionRouter');

var app = express();

// Connect to MongoDB using environment variable
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loopverse';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-auth-token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/learners', learnerRouter);
app.use('/api/mentors', mentorRouter);
app.use('/api/admin', adminRouter);
app.use('/api/sessions', sessionRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Set port and listen for connections
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`LoopVerse API available at http://localhost:${PORT}`);
});

module.exports = app;
