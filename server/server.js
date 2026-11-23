const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");

dotenv.config();

const connectDB = require("./config/db");

const studentRoutes = require("./routes/studentRoutes");
const seatRoutes = require("./routes/seatRoutes");
const seatRequestRoutes = require("./routes/seatRequestRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// DATABASE
connectDB();

// SECURITY
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://new-drishti-library.gangwarratnesh124.workers.dev",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("CORS blocked request from:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// BODY PARSERS
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

// LOGGER
app.use(morgan("dev"));

// R2 CONFIG CHECK (never print secret values)
console.log("R2 CONFIG CHECK:", {
  accountId: Boolean(process.env.R2_ACCOUNT_ID),
  accessKey: Boolean(process.env.R2_ACCESS_KEY_ID),
  secretKey: Boolean(process.env.R2_SECRET_ACCESS_KEY),
  bucket: Boolean(process.env.R2_BUCKET_NAME),
  endpoint: Boolean(process.env.R2_ENDPOINT),
});

// API ROUTES
app.use("/api/students", studentRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/seat-requests", seatRequestRoutes);
app.use("/api/admin", adminRoutes);

// HOME ROUTE
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Library Management System API is running",
  });
});

// 404 ROUTE
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log(`Server running on port ${PORT}`);
  console.log("Cloudflare R2 storage enabled");
  console.log("=================================");
});
