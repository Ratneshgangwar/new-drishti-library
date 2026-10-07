const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

dotenv.config();

const connectDB = require("./config/db");

const studentRoutes = require("./routes/studentRoutes");
const seatRoutes = require("./routes/seatRoutes");
const seatRequestRoutes = require("./routes/seatRequestRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

/*
 * =====================================================
 * DATABASE
 * =====================================================
 */

connectDB();

/*
 * =====================================================
 * SECURITY
 * =====================================================
 *
 * IMPORTANT:
 * Frontend is running on:
 *
 * http://localhost:5173
 *
 * Uploaded files are served from:
 *
 * http://localhost:5000/uploads
 *
 * Therefore cross-origin resource loading is required
 * for student profile photos and documents.
 */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

/*
 * =====================================================
 * CORS
 * =====================================================
 */

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,
  }),
);

/*
 * =====================================================
 * BODY PARSERS
 * =====================================================
 */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

/*
 * =====================================================
 * LOGGER
 * =====================================================
 */

app.use(morgan("dev"));

/*
 * =====================================================
 * STATIC UPLOADS
 * =====================================================
 *
 * NEW CORRECT LOCATION:
 *
 * server/uploads
 *
 * uploadMiddleware.js bhi isi folder mein files save
 * karega.
 */

const serverUploadDirectory = path.join(
  __dirname,
  "uploads",
);

app.use(
  "/uploads",
  express.static(serverUploadDirectory),
);

/*
 * =====================================================
 * OLD UPLOAD DIRECTORY SUPPORT
 * =====================================================
 *
 * Agar purani files accidentally is location mein hain:
 *
 * project-root/uploads
 *
 * to unhe bhi continue serve karenge.
 *
 * Isse existing uploaded photos/documents break nahi honge.
 */

const legacyUploadDirectory = path.join(
  process.cwd(),
  "uploads",
);

if (
  path.resolve(legacyUploadDirectory) !==
  path.resolve(serverUploadDirectory)
) {
  app.use(
    "/uploads",
    express.static(legacyUploadDirectory),
  );
}

/*
 * =====================================================
 * API ROUTES
 * =====================================================
 */

/*
 * STUDENT
 */

app.use(
  "/api/students",
  studentRoutes,
);

/*
 * SEATS
 */

app.use(
  "/api/seats",
  seatRoutes,
);

/*
 * SEAT REQUESTS
 */

app.use(
  "/api/seat-requests",
  seatRequestRoutes,
);

/*
 * ADMIN
 */

app.use(
  "/api/admin",
  adminRoutes,
);

/*
 * =====================================================
 * HOME ROUTE
 * =====================================================
 */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,

    message:
      "Library Management System API is running",
  });
});

/*
 * =====================================================
 * 404 ROUTE
 * =====================================================
 */

app.use((req, res) => {
  res.status(404).json({
    success: false,

    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
 * =====================================================
 * GLOBAL ERROR HANDLER
 * =====================================================
 */

app.use((err, req, res, next) => {
  console.error(
    "GLOBAL ERROR:",
    err,
  );

  res.status(
    err.status || 500,
  ).json({
    success: false,

    message:
      err.message ||
      "Internal server error",
  });
});

/*
 * =====================================================
 * SERVER
 * =====================================================
 */

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    "=================================",
  );

  console.log(
    `Server running on http://localhost:${PORT}`,
  );

  console.log(
    `Uploads served from: ${serverUploadDirectory}`,
  );

  console.log(
    "Admin API:",
  );

  console.log(
    `http://localhost:${PORT}/api/admin`,
  );

  console.log(
    "=================================",
  );
});