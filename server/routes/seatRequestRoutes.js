const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  requestSeat,
  getMySeatRequests,
  getPendingSeatRequests,
  approveSeatRequest,
  rejectSeatRequest,
  cancelSeatRequest,
} = require("../controllers/seatRequestController");

const router = express.Router();

// ==========================================
// STUDENT ROUTES
// ==========================================

router.post(
  "/",
  authMiddleware,
  requestSeat
);

router.get(
  "/my",
  authMiddleware,
  getMySeatRequests
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  cancelSeatRequest
);

// ==========================================
// ADMIN ROUTES
// ==========================================

router.get(
  "/pending",
  authMiddleware,
  adminMiddleware,
  getPendingSeatRequests
);

router.patch(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  approveSeatRequest
);

router.patch(
  "/:id/reject",
  authMiddleware,
  adminMiddleware,
  rejectSeatRequest
);

module.exports = router;