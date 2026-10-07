const multer = require("multer");
const path = require("path");
const fs = require("fs");

/*
 * =====================================================
 * UPLOAD DIRECTORY
 * =====================================================
 *
 * IMPORTANT:
 * Files must always be saved inside:
 *
 * D:\Drishti Library\server\uploads
 *
 * This uses __dirname so it does not matter from where
 * you start Node.js.
 */

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

/*
 * =====================================================
 * STORAGE
 * =====================================================
 */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    let safeFieldName = "upload";

    if (file.fieldname === "photo") {
      safeFieldName = "student-photo";
    }

    if (file.fieldname === "aadhaarDocument") {
      safeFieldName = "aadhaar";
    }

    const uniqueName =
      `${safeFieldName}-${Date.now()}-${Math.round(
        Math.random() * 1e9,
      )}${extension}`;

    cb(null, uniqueName);
  },
});

/*
 * =====================================================
 * FILE FILTER
 * =====================================================
 */

const fileFilter = (req, file, cb) => {
  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const aadhaarTypes = [
    ...imageTypes,
    "application/pdf",
  ];

  /*
   * ===================================================
   * STUDENT PHOTO
   * ===================================================
   */

  if (file.fieldname === "photo") {
    if (imageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Profile photo must be JPG, JPEG, PNG or WEBP.",
      ),
      false,
    );
  }

  /*
   * ===================================================
   * AADHAAR DOCUMENT
   * ===================================================
   */

  if (file.fieldname === "aadhaarDocument") {
    if (aadhaarTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Aadhaar document must be JPG, JPEG, PNG, WEBP or PDF.",
      ),
      false,
    );
  }

  return cb(
    new Error("Unsupported upload field."),
    false,
  );
};

/*
 * =====================================================
 * MULTER
 * =====================================================
 */

const upload = multer({
  storage,

  fileFilter,

  limits: {
    /*
     * Maximum size per uploaded file:
     * 5 MB
     */
    fileSize: 5 * 1024 * 1024,

    /*
     * Maximum number of files in one request.
     *
     * photo
     * aadhaarDocument
     */
    files: 2,
  },
});

module.exports = upload;