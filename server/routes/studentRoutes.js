const express = require("express");

const {
  registerStudent,
  loginStudent,
  getStudentProfile,
  updateProfilePhoto,
} = require("../controllers/studentController");

const authMiddleware =
  require("../middleware/authMiddleware");

const upload =
  require("../middleware/uploadMiddleware");

const router =
  express.Router();

/*
 * =====================================================
 * REGISTER
 * =====================================================
 *
 * IMPORTANT:
 * Registration needs TWO files.
 *
 * photo
 * aadhaarDocument
 */

router.post(
  "/register",
  upload.fields([
    {
      name: "photo",
      maxCount: 1,
    },
    {
      name: "aadhaarDocument",
      maxCount: 1,
    },
  ]),
  registerStudent,
);

/*
 * =====================================================
 * LOGIN
 * =====================================================
 */

router.post(
  "/login",
  loginStudent,
);

/*
 * =====================================================
 * PROFILE
 * =====================================================
 */

router.get(
  "/profile",
  authMiddleware,
  getStudentProfile,
);

/*
 * =====================================================
 * UPDATE PROFILE PHOTO
 * =====================================================
 */

router.put(
  "/profile/photo",
  authMiddleware,
  upload.single("photo"),
  updateProfilePhoto,
);

module.exports = router;