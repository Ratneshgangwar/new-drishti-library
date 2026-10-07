const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    motherName: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * ==========================================
     * PROFILE PHOTO
     * ==========================================
     */

    photo: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },
    },

    /*
     * ==========================================
     * AADHAAR DOCUMENT
     *
     * Aadhaar NUMBER is not stored.
     * Only uploaded Aadhaar document is stored.
     * ==========================================
     */

    aadhaarDocument: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },

      verified: {
        type: Boolean,
        default: false,
      },
    },

    /*
     * ==========================================
     * ROLE
     * ==========================================
     */

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    /*
     * ==========================================
     * ACCOUNT STATUS
     * ==========================================
     */

    accountStatus: {
      type: String,
      enum: [
        "pending",
        "active",
        "blocked",
        "inactive",
      ],
      default: "pending",
    },

    /*
     * ==========================================
     * SEAT
     * ==========================================
     */

    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      default: null,
    },

    /*
     * ==========================================
     * MEMBERSHIP
     * ==========================================
     */

    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      default: null,
    },

    /*
     * ==========================================
     * LAST LOGIN
     * ==========================================
     */

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * ==========================================
 * CREATED AT INDEX
 * ==========================================
 */

studentSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model(
  "Student",
  studentSchema
);