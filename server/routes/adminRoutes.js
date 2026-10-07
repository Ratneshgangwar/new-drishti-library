const express = require("express");

const {
  loginAdmin,
  getAdminProfile,
  getDashboardStats,
  getAllStudents,
  getStudentById,
  updateStudentStatus,
  verifyStudentAadhaar,
} = require("../controllers/adminController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router =
  express.Router();

/*
 * =====================================================
 * ADMIN LOGIN
 * =====================================================
 */

router.post(
  "/login",
  loginAdmin,
);

/*
 * =====================================================
 * ADMIN PROFILE
 * =====================================================
 */

router.get(
  "/profile",
  authMiddleware,
  adminMiddleware,
  getAdminProfile,
);

/*
 * =====================================================
 * DASHBOARD
 * =====================================================
 */

router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  getDashboardStats,
);

/*
 * =====================================================
 * ALL STUDENTS
 * =====================================================
 */

router.get(
  "/students",
  authMiddleware,
  adminMiddleware,
  getAllStudents,
);

/*
 * =====================================================
 * SINGLE STUDENT
 * =====================================================
 */

router.get(
  "/students/:id",
  authMiddleware,
  adminMiddleware,
  getStudentById,
);

/*
 * =====================================================
 * STUDENT STATUS
 * =====================================================
 */

router.patch(
  "/students/:id/status",
  authMiddleware,
  adminMiddleware,
  updateStudentStatus,
);

/*
 * =====================================================
 * AADHAAR VERIFICATION
 * =====================================================
 */

router.patch(
  "/students/:id/aadhaar",
  authMiddleware,
  adminMiddleware,
  verifyStudentAadhaar,
);

module.exports = router;