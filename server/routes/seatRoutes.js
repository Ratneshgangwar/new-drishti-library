const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAllSeats,
  getAvailableSeats,
  getSpecialSeats,
  getSeatById,
  vacateSeat,
  changeStudentSeat,
  blockSeat,
  unblockSeat,
  reserveSeat,
  unreserveSeat,
} = require("../controllers/seatController");

const router = express.Router();

// ==========================================
// READ ROUTES
// ==========================================

router.get("/", getAllSeats);

router.get("/available", getAvailableSeats);

router.get("/special", getSpecialSeats);

// ==========================================
// ADMIN MANAGEMENT ROUTES
// ==========================================

router.patch(
  "/change",
  authMiddleware,
  adminMiddleware,
  changeStudentSeat
);

router.patch(
  "/:id/vacate",
  authMiddleware,
  adminMiddleware,
  vacateSeat
);

router.patch(
  "/:id/block",
  authMiddleware,
  adminMiddleware,
  blockSeat
);

router.patch(
  "/:id/unblock",
  authMiddleware,
  adminMiddleware,
  unblockSeat
);

router.patch(
  "/:id/reserve",
  authMiddleware,
  adminMiddleware,
  reserveSeat
);

router.patch(
  "/:id/unreserve",
  authMiddleware,
  adminMiddleware,
  unreserveSeat
);

// ==========================================
// SINGLE SEAT
// ==========================================

router.get("/:id", getSeatById);

module.exports = router;