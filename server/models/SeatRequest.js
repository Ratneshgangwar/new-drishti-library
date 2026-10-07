const mongoose = require("mongoose");

const seatRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },

    requestType: {
      type: String,
      enum: ["NEW", "CHANGE"],
      default: "NEW",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    reason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    adminRemark: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// CREATE MODEL
// ==========================================

const SeatRequest = mongoose.model(
  "SeatRequest",
  seatRequestSchema
);

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = SeatRequest;