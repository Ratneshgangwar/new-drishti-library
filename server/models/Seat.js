const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    seatType: {
      type: String,
      enum: ["NORMAL", "SPECIAL"],
      required: true,
      default: "NORMAL",
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "BLOCKED", "RESERVED"],
      default: "AVAILABLE",
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    section: {
      type: String,
      default: "MAIN",
      trim: true,
    },

    floor: {
      type: Number,
      default: 1,
    },

    blockedReason: {
      type: String,
      default: "",
      trim: true,
    },

    reservedFor: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Seat = mongoose.model("Seat", seatSchema);

module.exports = Seat;