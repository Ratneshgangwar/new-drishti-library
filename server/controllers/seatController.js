const mongoose = require("mongoose");
const Seat = require("../models/Seat");
const Student = require("../models/Student");

// ==========================================
// GET ALL SEATS
// ==========================================

const getAllSeats = async (req, res) => {
  try {
    const seats = await Seat.find()
      .populate("student", "studentId fullName email mobile")
      .sort({ seatType: 1, seatNumber: 1 });

    return res.status(200).json({
      success: true,
      count: seats.length,
      seats,
    });
  } catch (error) {
    console.error("Get All Seats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching seats",
      error: error.message,
    });
  }
};

// ==========================================
// GET AVAILABLE SEATS
// ==========================================

const getAvailableSeats = async (req, res) => {
  try {
    const seats = await Seat.find({
      status: "AVAILABLE",
    }).sort({
      seatType: 1,
      seatNumber: 1,
    });

    return res.status(200).json({
      success: true,
      count: seats.length,
      seats,
    });
  } catch (error) {
    console.error("Get Available Seats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching available seats",
      error: error.message,
    });
  }
};

// ==========================================
// GET SPECIAL SEATS
// ==========================================

const getSpecialSeats = async (req, res) => {
  try {
    const seats = await Seat.find({
      seatType: "SPECIAL",
    })
      .populate("student", "studentId fullName email mobile")
      .sort({
        seatNumber: 1,
      });

    return res.status(200).json({
      success: true,
      count: seats.length,
      seats,
    });
  } catch (error) {
    console.error("Get Special Seats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching special seats",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE SEAT
// ==========================================

const getSeatById = async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id).populate(
      "student",
      "studentId fullName email mobile"
    );

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    return res.status(200).json({
      success: true,
      seat,
    });
  } catch (error) {
    console.error("Get Seat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching seat",
      error: error.message,
    });
  }
};

// ==========================================
// VACATE SEAT
// ==========================================

const vacateSeat = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const seatId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(seatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seat ID",
      });
    }

    session.startTransaction();

    const seat = await Seat.findById(seatId).session(session);

    if (!seat) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    if (seat.status !== "OCCUPIED" || !seat.student) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "This seat is not currently occupied",
      });
    }

    const studentId = seat.student;

    const student = await Student.findById(studentId).session(
      session
    );

    if (student && student.seat) {
      student.seat = null;

      await student.save({
        session,
      });
    }

    seat.status = "AVAILABLE";
    seat.student = null;

    await seat.save({
      session,
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Seat vacated successfully",
      seat: {
        id: seat._id,
        seatNumber: seat.seatNumber,
        status: seat.status,
      },
      studentId: studentId,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Vacate Seat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while vacating seat",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ==========================================
// CHANGE STUDENT SEAT
// ==========================================

const changeStudentSeat = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      studentId,
      newSeatId,
    } = req.body;

    if (!studentId || !newSeatId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and new seat ID are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(newSeatId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID or seat ID",
      });
    }

    session.startTransaction();

    const student = await Student.findById(studentId).session(
      session
    );

    if (!student) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!student.seat) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Student does not currently have a seat",
      });
    }

    if (
      String(student.seat) === String(newSeatId)
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Student already has this seat",
      });
    }

    const oldSeat = await Seat.findById(
      student.seat
    ).session(session);

    if (!oldSeat) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Current student seat not found",
      });
    }

    const newSeat = await Seat.findOneAndUpdate(
      {
        _id: newSeatId,
        status: "AVAILABLE",
        student: null,
      },
      {
        $set: {
          status: "OCCUPIED",
          student: student._id,
        },
      },
      {
        new: true,
        session,
      }
    );

    if (!newSeat) {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message: "New seat is not available",
      });
    }

    oldSeat.status = "AVAILABLE";
    oldSeat.student = null;

    await oldSeat.save({
      session,
    });

    student.seat = newSeat._id;

    await student.save({
      session,
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Student seat changed successfully",

      oldSeat: {
        id: oldSeat._id,
        seatNumber: oldSeat.seatNumber,
        status: oldSeat.status,
      },

      newSeat: {
        id: newSeat._id,
        seatNumber: newSeat.seatNumber,
        status: newSeat.status,
      },

      student: {
        id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Change Student Seat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while changing seat",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ==========================================
// BLOCK SEAT
// ==========================================

const blockSeat = async (req, res) => {
  try {
    const seatId = req.params.id;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(seatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seat ID",
      });
    }

    const seat = await Seat.findById(seatId);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    if (seat.status === "OCCUPIED") {
      return res.status(400).json({
        success: false,
        message: "Occupied seat cannot be blocked",
      });
    }

    if (seat.status === "BLOCKED") {
      return res.status(400).json({
        success: false,
        message: "Seat is already blocked",
      });
    }

    seat.status = "BLOCKED";
    seat.blockedReason =
      reason || "Blocked by administrator";

    await seat.save();

    return res.status(200).json({
      success: true,
      message: "Seat blocked successfully",
      seat,
    });
  } catch (error) {
    console.error("Block Seat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while blocking seat",
      error: error.message,
    });
  }
};

// ==========================================
// UNBLOCK SEAT
// ==========================================

const unblockSeat = async (req, res) => {
  try {
    const seatId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(seatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seat ID",
      });
    }

    const seat = await Seat.findById(seatId);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    if (seat.status !== "BLOCKED") {
      return res.status(400).json({
        success: false,
        message: "Seat is not blocked",
      });
    }

    seat.status = "AVAILABLE";
    seat.blockedReason = "";

    await seat.save();

    return res.status(200).json({
      success: true,
      message: "Seat unblocked successfully",
      seat,
    });
  } catch (error) {
    console.error("Unblock Seat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while unblocking seat",
      error: error.message,
    });
  }
};

// ==========================================
// RESERVE SEAT
// ==========================================

const reserveSeat = async (req, res) => {
  try {
    const seatId = req.params.id;
    const { reservedFor } = req.body;

    if (!mongoose.Types.ObjectId.isValid(seatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seat ID",
      });
    }

    const seat = await Seat.findById(seatId);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    if (seat.status !== "AVAILABLE") {
      return res.status(400).json({
        success: false,
        message: `Only available seats can be reserved. Current status: ${seat.status}`,
      });
    }

    seat.status = "RESERVED";
    seat.reservedFor =
      reservedFor || "Library Administration";

    await seat.save();

    return res.status(200).json({
      success: true,
      message: "Seat reserved successfully",
      seat,
    });
  } catch (error) {
    console.error("Reserve Seat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while reserving seat",
      error: error.message,
    });
  }
};

// ==========================================
// UNRESERVE SEAT
// ==========================================

const unreserveSeat = async (req, res) => {
  try {
    const seatId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(seatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seat ID",
      });
    }

    const seat = await Seat.findById(seatId);

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    if (seat.status !== "RESERVED") {
      return res.status(400).json({
        success: false,
        message: "Seat is not reserved",
      });
    }

    seat.status = "AVAILABLE";
    seat.reservedFor = "";

    await seat.save();

    return res.status(200).json({
      success: true,
      message: "Seat reservation removed successfully",
      seat,
    });
  } catch (error) {
    console.error("Unreserve Seat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while removing reservation",
      error: error.message,
    });
  }
};

module.exports = {
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
};