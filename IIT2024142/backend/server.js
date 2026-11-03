require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path"); // Added for reliable file paths
const { Server } = require("socket.io");
const db = require("./config/db"); // For socket DB queries
const { globalErrorHandler } = require("./middleware/errorMiddleware");

const app = express();
const server = http.createServer(app);

// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:5173",
  "http://localhost:5174",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};
app.use(express.json());

// Firebase Popup Support
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors(corsOptions));

// FIXED: Serving static files using absolute path to ensure images show up
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── ROUTES ─────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const bidRoutes = require("./routes/bidRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const chatRoutes = require("./routes/chatRoutes");
const mediatorRoutes = require("./routes/mediatorRoutes");
const userRoutes = require("./routes/userRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// Initialize IO for controllers
const bidController = require("./controllers/bidController");
bidController.setIo(io);


app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

app.use("/api/chat", chatRoutes);
app.use("/api/mediator", mediatorRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);

// ─── SERVER TIME ENDPOINT (UTC clock sync for fair countdowns) ──────────────
app.get("/api/time", (req, res) => {
  res.json({ utc: Date.now() });
});

// Global Error Handler - MUST BE LAST
app.use(globalErrorHandler);

// ─── SOCKET.IO: REAL-TIME BIDDING + WEBRTC SIGNALING ────────────────────────
const socketHandler = require("./sockets");
socketHandler(io);

// ─── START SERVER ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});