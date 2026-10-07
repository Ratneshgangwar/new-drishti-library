const mongoose = require("mongoose");

const SeatRequest = require("../models/SeatRequest");
const Seat = require("../models/Seat");
const Student = require("../models/Student");

// ==========================================
// STUDENT REQUEST A SEAT
// ==========================================

const requestSeat = async (req, res) => {
  try {
    const { seatId, reason } = req.body;

    if (!seatId) {
      return res.status(400).json({
        success: false,
        message: "Seat ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(seatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid seat ID",
      });
    }

    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.accountStatus === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Blocked students cannot request a seat",
      });
    }

    // Student already has a seat
    if (student.seat) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a seat. Please request a seat change instead.",
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
        message: `Seat is currently ${seat.status.toLowerCase()}`,
      });
    }

    // Check existing pending request
    const existingRequest = await SeatRequest.findOne({
      student: student._id,
      status: "PENDING",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending seat request",
      });
    }

    const seatRequest = await SeatRequest.create({
      student: student._id,
      seat: seat._id,
      requestType: "NEW",
      status: "PENDING",
      reason: reason || "",
    });

    await seatRequest.populate([
      {
        path: "seat",
      },
      {
        path: "student",
        select: "studentId fullName email mobile",
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "Seat request submitted successfully",
      request: seatRequest,
    });
  } catch (error) {
    console.error("Request Seat Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while requesting seat",
      error: error.message,
    });
  }
};

// ==========================================
// STUDENT GET MY REQUESTS
// ==========================================

const getMySeatRequests = async (req, res) => {
  try {
    const requests = await SeatRequest.find({
      student: req.user.id,
    })
      .populate("seat")
      .populate(
        "reviewedBy",
        "studentId fullName email"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get My Seat Requests Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching seat requests",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN GET PENDING REQUESTS
// ==========================================

const getPendingSeatRequests = async (req, res) => {
  try {
    const requests = await SeatRequest.find({
      status: "PENDING",
    })
      .populate(
        "student",
        "studentId fullName email mobile accountStatus"
      )
      .populate("seat")
      .sort({
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error(
      "Get Pending Seat Requests Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching pending requests",
      error: error.message,
    });
  }
};

// ==========================================
// ADMIN APPROVE REQUEST
// ==========================================

const approveSeatRequest = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const requestId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    session.startTransaction();

    const seatRequest = await SeatRequest.findById(
      requestId
    ).session(session);

    if (!seatRequest) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Seat request not found",
      });
    }

    if (seatRequest.status !== "PENDING") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "This seat request has already been processed",
      });
    }

    const student = await Student.findById(
      seatRequest.student
    ).session(session);

    if (!student) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Student already has a seat
    if (student.seat) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Student already has an allocated seat",
      });
    }

    // Atomically reserve only if still AVAILABLE
    const seat = await Seat.findOneAndUpdate(
      {
        _id: seatRequest.seat,
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

    if (!seat) {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message:
          "This seat is no longer available",
      });
    }

    student.seat = seat._id;

    await student.save({
      session,
    });

    seatRequest.status = "APPROVED";
    seatRequest.reviewedBy = req.user.id;
    seatRequest.reviewedAt = new Date();

    await seatRequest.save({
      session,
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Seat request approved successfully",
      seat: {
        id: seat._id,
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        status: seat.status,
      },
      student: {
        id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
      },
      request: {
        id: seatRequest._id,
        status: seatRequest.status,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error(
      "Approve Seat Request Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while approving seat request",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ==========================================
// ADMIN REJECT REQUEST
// ==========================================

const rejectSeatRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    const { adminRemark } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    const seatRequest = await SeatRequest.findById(
      requestId
    );

    if (!seatRequest) {
      return res.status(404).json({
        success: false,
        message: "Seat request not found",
      });
    }

    if (seatRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message:
          "This seat request has already been processed",
      });
    }

    seatRequest.status = "REJECTED";
    seatRequest.adminRemark =
      adminRemark || "Request rejected by admin";
    seatRequest.reviewedBy = req.user.id;
    seatRequest.reviewedAt = new Date();

    await seatRequest.save();

    return res.status(200).json({
      success: true,
      message: "Seat request rejected successfully",
      request: seatRequest,
    });
  } catch (error) {
    console.error(
      "Reject Seat Request Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while rejecting seat request",
      error: error.message,
    });
  }
};

// ==========================================
// STUDENT CANCEL REQUEST
// ==========================================

const cancelSeatRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    const seatRequest = await SeatRequest.findOne({
      _id: requestId,
      student: req.user.id,
    });

    if (!seatRequest) {
      return res.status(404).json({
        success: false,
        message: "Seat request not found",
      });
    }

    if (seatRequest.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending requests can be cancelled",
      });
    }

    seatRequest.status = "CANCELLED";

    await seatRequest.save();

    return res.status(200).json({
      success: true,
      message: "Seat request cancelled successfully",
      request: seatRequest,
    });
  } catch (error) {
    console.error(
      "Cancel Seat Request Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while cancelling seat request",
      error: error.message,
    });
  }
};

module.exports = {
  requestSeat,
  getMySeatRequests,
  getPendingSeatRequests,
  approveSeatRequest,
  rejectSeatRequest,
  cancelSeatRequest,
};