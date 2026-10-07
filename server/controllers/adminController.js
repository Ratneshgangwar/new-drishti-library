const mongoose = require("mongoose");

const Student =
  require("../models/Student");

const Seat =
  require("../models/Seat");

const SeatRequest =
  require("../models/SeatRequest");

const {
  comparePassword,
  generateToken,
} = require("../utils/auth");

/*
 * =====================================================
 * ADMIN LOGIN
 * =====================================================
 */

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const admin = await Student.findOne({
      email: normalizedEmail,
      role: "admin",
    }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password.",
      });
    }

    if (!admin.password) {
      console.error(
        "ADMIN LOGIN ERROR: Password hash missing:",
        admin.email
      );

      return res.status(500).json({
        success: false,
        message:
          "Password data is missing for this admin account.",
      });
    }

    if (admin.accountStatus === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Admin account is blocked.",
      });
    }

    if (admin.accountStatus === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive.",
      });
    }

    const isPasswordValid = await comparePassword(
      password,
      admin.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password.",
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin);

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
      admin: {
        _id: admin._id,
        studentId: admin.studentId,
        fullName: admin.fullName,
        mobile: admin.mobile,
        email: admin.email,
        role: admin.role,
        accountStatus: admin.accountStatus,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error("Login Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Server error during admin login.",
    });
  }
};
/*
 * =====================================================
 * ADMIN PROFILE
 * =====================================================
 */

const getAdminProfile =
  async (req, res) => {
    try {
      const admin =
        await Student.findById(
          req.user.id,
        )
          .select("-password")
          .lean();

      if (
        !admin ||
        admin.role !== "admin"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Admin not found.",
        });
      }

      return res.status(200).json({
        success: true,
        admin,
      });
    } catch (error) {
      console.error(
        "Admin Profile Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch admin profile.",
        error: error.message,
      });
    }
  };

/*
 * =====================================================
 * DASHBOARD STATS
 * =====================================================
 */

const getDashboardStats =
  async (req, res) => {
    try {
      const [
        totalStudents,
        pendingStudents,
        activeStudents,
        blockedStudents,
        inactiveStudents,
        totalSeats,
        availableSeats,
        occupiedSeats,
        reservedSeats,
        blockedSeats,
        totalSeatRequests,
        pendingSeatRequests,
        approvedSeatRequests,
        rejectedSeatRequests,
        cancelledSeatRequests,
      ] = await Promise.all([
        Student.countDocuments({
          role: "student",
        }),

        Student.countDocuments({
          role: "student",
          accountStatus:
            "pending",
        }),

        Student.countDocuments({
          role: "student",
          accountStatus:
            "active",
        }),

        Student.countDocuments({
          role: "student",
          accountStatus:
            "blocked",
        }),

        Student.countDocuments({
          role: "student",
          accountStatus:
            "inactive",
        }),

        Seat.countDocuments(),

        Seat.countDocuments({
          status: "AVAILABLE",
        }),

        Seat.countDocuments({
          status: "OCCUPIED",
        }),

        Seat.countDocuments({
          status: "RESERVED",
        }),

        Seat.countDocuments({
          status: "BLOCKED",
        }),

        SeatRequest.countDocuments(),

        SeatRequest.countDocuments({
          status: "PENDING",
        }),

        SeatRequest.countDocuments({
          status: "APPROVED",
        }),

        SeatRequest.countDocuments({
          status: "REJECTED",
        }),

        SeatRequest.countDocuments({
          status: "CANCELLED",
        }),
      ]);

      const recentStudents =
        await Student.find({
          role: "student",
        })
          .select("-password")
          .populate(
            "seat",
            "seatNumber seatType status",
          )
          .sort({
            createdAt: -1,
          })
          .limit(5)
          .lean();

      const recentSeatRequests =
        await SeatRequest.find()
          .populate(
            "student",
            "studentId fullName email mobile accountStatus",
          )
          .populate(
            "seat",
            "seatNumber seatType status",
          )
          .sort({
            createdAt: -1,
          })
          .limit(5)
          .lean();

      return res.status(200).json({
        success: true,

        students: {
          total: totalStudents,
          pending:
            pendingStudents,
          active:
            activeStudents,
          blocked:
            blockedStudents,
          inactive:
            inactiveStudents,
        },

        seats: {
          total: totalSeats,
          available:
            availableSeats,
          occupied:
            occupiedSeats,
          reserved:
            reservedSeats,
          blocked:
            blockedSeats,
        },

        seatRequests: {
          total:
            totalSeatRequests,
          pending:
            pendingSeatRequests,
          approved:
            approvedSeatRequests,
          rejected:
            rejectedSeatRequests,
          cancelled:
            cancelledSeatRequests,
        },

        recentStudents,
        recentSeatRequests,
      });
    } catch (error) {
      console.error(
        "Get Dashboard Stats Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching dashboard statistics.",
        error: error.message,
      });
    }
  };

/*
 * =====================================================
 * GET ALL STUDENTS
 * =====================================================
 */

const getAllStudents =
  async (req, res) => {
    try {
      const {
        status,
        search,
      } = req.query;

      const filter = {
        role: "student",
      };

      if (
        status &&
        [
          "pending",
          "active",
          "blocked",
          "inactive",
        ].includes(
          status.toLowerCase(),
        )
      ) {
        filter.accountStatus =
          status.toLowerCase();
      }

      if (
        search &&
        search.trim()
      ) {
        const searchValue =
          search.trim();

        filter.$or = [
          {
            fullName: {
              $regex:
                searchValue,
              $options: "i",
            },
          },
          {
            studentId: {
              $regex:
                searchValue,
              $options: "i",
            },
          },
          {
            email: {
              $regex:
                searchValue,
              $options: "i",
            },
          },
          {
            mobile: {
              $regex:
                searchValue,
              $options: "i",
            },
          },
        ];
      }

      const students =
        await Student.find(filter)
          .select("-password")
          .populate(
            "seat",
            "seatNumber seatType status section floor",
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,
        count:
          students.length,
        students,
      });
    } catch (error) {
      console.error(
        "Get All Students Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching students.",
        error: error.message,
      });
    }
  };

/*
 * =====================================================
 * GET SINGLE STUDENT
 * =====================================================
 *
 * Admin can see:
 *
 * - Full name
 * - Student ID
 * - Mobile
 * - Email
 * - Father
 * - Mother
 * - Address
 * - Course
 * - Profile photo
 * - Aadhaar document
 * - Aadhaar verification
 * - Seat
 * - Seat type
 * - Seat status
 * - Section
 * - Floor
 * - Seat requests
 * - Account status
 * - Login information
 */

const getStudentById =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid student ID.",
        });
      }

      const student =
        await Student.findOne({
          _id: id,
          role: "student",
        })
          .select("-password")
          .populate(
            "seat",
            "seatNumber seatType status section floor blockedReason reservedFor notes",
          )
          .lean();

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "Student not found.",
        });
      }

      const seatRequests =
        await SeatRequest.find({
          student:
            student._id,
        })
          .populate(
            "seat",
            "seatNumber seatType status section floor",
          )
          .populate(
            "reviewedBy",
            "studentId fullName email",
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,

        student: {
          ...student,

          /*
           * Never return password.
           * Aadhaar number is not stored.
           */

          photo: {
            url:
              student.photo
                ?.url || "",
            publicId:
              student.photo
                ?.publicId || "",
          },

          aadhaarDocument: {
            url:
              student
                .aadhaarDocument
                ?.url || "",

            publicId:
              student
                .aadhaarDocument
                ?.publicId || "",

            verified:
              student
                .aadhaarDocument
                ?.verified ||
              false,
          },

          seat:
            student.seat || null,
        },

        seatRequests,
      });
    } catch (error) {
      console.error(
        "Get Student By ID Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching student.",
        error: error.message,
      });
    }
  };

/*
 * =====================================================
 * UPDATE STUDENT STATUS
 * =====================================================
 */

const updateStudentStatus =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        accountStatus,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid student ID.",
        });
      }

      const allowedStatuses = [
        "pending",
        "active",
        "blocked",
        "inactive",
      ];

      if (
        !allowedStatuses.includes(
          accountStatus,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid account status.",
        });
      }

      const student =
        await Student.findOne({
          _id: id,
          role: "student",
        });

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "Student not found.",
        });
      }

      student.accountStatus =
        accountStatus;

      await student.save();

      return res.status(200).json({
        success: true,
        message:
          "Student status updated successfully.",
        student,
      });
    } catch (error) {
      console.error(
        "Update Student Status Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update student status.",
        error: error.message,
      });
    }
  };

/*
 * =====================================================
 * VERIFY AADHAAR DOCUMENT
 * =====================================================
 */

const verifyStudentAadhaar =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { verified } =
        req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          id,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid student ID.",
        });
      }

      if (
        typeof verified !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "verified must be true or false.",
        });
      }

      const student =
        await Student.findOne({
          _id: id,
          role: "student",
        });

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "Student not found.",
        });
      }

      if (
        !student.aadhaarDocument
          ?.url
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Student has not uploaded an Aadhaar document.",
        });
      }

      student.aadhaarDocument.verified =
        verified;

      await student.save();

      return res.status(200).json({
        success: true,

        message: verified
          ? "Aadhaar verified successfully."
          : "Aadhaar verification removed.",

        student: {
          id: student._id,

          studentId:
            student.studentId,

          fullName:
            student.fullName,

          aadhaarDocument:
            student.aadhaarDocument,
        },
      });
    } catch (error) {
      console.error(
        "Verify Aadhaar Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while updating Aadhaar verification.",
        error: error.message,
      });
    }
  };

module.exports = {
  loginAdmin,
  getAdminProfile,
  getDashboardStats,
  getAllStudents,
  getStudentById,
  updateStudentStatus,
  verifyStudentAadhaar,
};