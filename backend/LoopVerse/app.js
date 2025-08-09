var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var http = require("http");
require("dotenv").config();

// Import routes
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var authRouter = require("./routes/authRouter");
var aiRouter = require("./routes/aiRouter");
var uploadRouter = require("./routes/uploadRouter");
var bookingRouter = require("./routes/bookingRouter");
var searchRouter = require("./routes/searchRouter");
var notificationRouter = require("./routes/notificationRouter");
var learnerRouter = require("./routes/LeranerRouter");
var mentorRouter = require("./routes/MentorRouter");
var adminRouter = require("./routes/adminRouter");
var sessionRouter = require("./routes/sessionRouter");

var app = express();

// Connect to MongoDB using environment variable
const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse";
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/search", searchRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/learners", learnerRouter);
app.use("/api/mentors", mentorRouter);
app.use("/api/admin", adminRouter);
app.use("/api/sessions", sessionRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
const { initializeWebSocket } = require("./utils/websocket");
initializeWebSocket(server);

// Set port and listen for connections
const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`LoopVerse API available at http://localhost:${PORT}`);
  console.log(`WebSocket server initialized`);
});

module.exports = app;
