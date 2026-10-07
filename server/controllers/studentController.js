const Student = require("../models/Student");

const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/auth");

/*
 * =====================================================
 * GENERATE STUDENT ID
 * =====================================================
 */

const generateStudentId =
  async () => {
    const count =
      await Student.countDocuments();

    return `LIB${String(
      count + 1,
    ).padStart(5, "0")}`;
  };

/*
 * =====================================================
 * REGISTER STUDENT
 * =====================================================
 */

const registerStudent =
  async (req, res) => {
    try {
      console.log(
        "REGISTER BODY:",
        req.body,
      );

      console.log(
        "REGISTER FILES:",
        req.files,
      );

      const {
        fullName,
        mobile,
        email,
        password,
        fatherName,
        motherName,
        address,
        course,
      } = req.body;

      /*
       * -----------------------------------------------
       * FILES
       * -----------------------------------------------
       */

      const photoFile =
        req.files?.photo?.[0] ||
        null;

      const aadhaarFile =
        req.files?.aadhaarDocument?.[0] ||
        null;

      /*
       * -----------------------------------------------
       * REQUIRED FIELDS
       * -----------------------------------------------
       */

      if (
        !fullName?.trim() ||
        !mobile?.trim() ||
        !email?.trim() ||
        !password ||
        !fatherName?.trim() ||
        !address?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please fill all required fields.",
        });
      }

      /*
       * -----------------------------------------------
       * PROFILE PHOTO
       * -----------------------------------------------
       */

      if (!photoFile) {
        return res.status(400).json({
          success: false,
          message:
            "Profile photo is required. Please upload your photo.",
        });
      }

      /*
       * -----------------------------------------------
       * AADHAAR DOCUMENT
       * -----------------------------------------------
       */

      if (!aadhaarFile) {
        return res.status(400).json({
          success: false,
          message:
            "Aadhaar document is required. Please upload your Aadhaar card.",
        });
      }

      /*
       * -----------------------------------------------
       * PASSWORD
       * -----------------------------------------------
       */

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      /*
       * -----------------------------------------------
       * MOBILE
       * -----------------------------------------------
       */

      const cleanMobile =
        mobile.trim();

      if (
        !/^[0-9]{10}$/.test(
          cleanMobile,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Mobile number must contain exactly 10 digits.",
        });
      }

      /*
       * -----------------------------------------------
       * EMAIL
       * -----------------------------------------------
       */

      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      /*
       * -----------------------------------------------
       * CHECK EXISTING STUDENT
       * -----------------------------------------------
       */

      const existingStudent =
        await Student.findOne({
          $or: [
            {
              email: cleanEmail,
            },
            {
              mobile: cleanMobile,
            },
          ],
        });

      if (existingStudent) {
        let message =
          "Student already exists.";

        if (
          existingStudent.email ===
          cleanEmail
        ) {
          message =
            "Student with this email already exists.";
        } else if (
          existingStudent.mobile ===
          cleanMobile
        ) {
          message =
            "Student with this mobile number already exists.";
        }

        return res.status(409).json({
          success: false,
          message,
        });
      }

      /*
       * -----------------------------------------------
       * PASSWORD HASH
       * -----------------------------------------------
       */

      const hashedPassword =
        await hashPassword(
          password,
        );

      /*
       * -----------------------------------------------
       * STUDENT ID
       * -----------------------------------------------
       */

      const studentId =
        await generateStudentId();

      /*
       * -----------------------------------------------
       * FILE URL
       * -----------------------------------------------
       */

      const baseUrl =
        `${req.protocol}://${req.get(
          "host",
        )}`;

      const photoUrl =
        `${baseUrl}/uploads/${photoFile.filename}`;

      const aadhaarUrl =
        `${baseUrl}/uploads/${aadhaarFile.filename}`;

      /*
       * -----------------------------------------------
       * CREATE STUDENT
       * -----------------------------------------------
       */

      const student =
        await Student.create({
          studentId,

          fullName:
            fullName.trim(),

          mobile:
            cleanMobile,

          email:
            cleanEmail,

          password:
            hashedPassword,

          fatherName:
            fatherName.trim(),

          motherName:
            motherName
              ? motherName.trim()
              : "",

          address:
            address.trim(),

          course:
            course
              ? course.trim()
              : "",

          /*
           * PROFILE PHOTO
           */

          photo: {
            url: photoUrl,
            publicId:
              photoFile.filename,
          },

          /*
           * AADHAAR DOCUMENT ONLY
           *
           * Aadhaar number is NOT stored.
           */

          aadhaarDocument: {
            url: aadhaarUrl,
            publicId:
              aadhaarFile.filename,
            verified: false,
          },

          role: "student",

          accountStatus:
            "pending",
        });

      /*
       * -----------------------------------------------
       * TOKEN
       * -----------------------------------------------
       */

      const token =
        generateToken(student);

      /*
       * -----------------------------------------------
       * RESPONSE
       * -----------------------------------------------
       */

      return res.status(201).json({
        success: true,

        message:
          "Student registered successfully.",

        token,

        student: {
          id: student._id,

          studentId:
            student.studentId,

          fullName:
            student.fullName,

          email:
            student.email,

          mobile:
            student.mobile,

          fatherName:
            student.fatherName,

          motherName:
            student.motherName,

          address:
            student.address,

          course:
            student.course,

          photo:
            student.photo,

          aadhaarDocument: {
            url:
              student
                .aadhaarDocument
                ?.url || "",

            verified:
              student
                .aadhaarDocument
                ?.verified ||
              false,
          },

          role:
            student.role,

          accountStatus:
            student.accountStatus,
        },
      });
    } catch (error) {
      console.error(
        "Register Student Error:",
        error,
      );

      if (
        error.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A student with this information already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Server error during registration.",
        error: error.message,
      });
    }
  };

/*
 * =====================================================
 * LOGIN STUDENT
 * =====================================================
 */

const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    /* ================================
       VALIDATION
    ================================= */

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    /* ================================
       FIND STUDENT

       IMPORTANT:
       password ko explicitly select
       karna zaroori hai because Student
       model me password: { select: false }
       hai.
    ================================= */

    const student = await Student.findOne({
      email: normalizedEmail,
      role: "student",
    }).select("+password");

    /* ================================
       STUDENT NOT FOUND
    ================================= */

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    /* ================================
       PASSWORD EXISTENCE CHECK
    ================================= */

    if (!student.password) {
      console.error(
        "LOGIN ERROR: Password hash missing for student:",
        student.email,
      );

      return res.status(500).json({
        success: false,
        message:
          "Password data is missing for this account. Please register again.",
      });
    }

    /* ================================
       CHECK ACCOUNT STATUS
    ================================= */

    if (
      student.accountStatus === "blocked"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked. Please contact the library administrator.",
      });
    }

    if (
      student.accountStatus === "inactive"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive. Please contact the library administrator.",
      });
    }

    /* ================================
       PASSWORD COMPARE
    ================================= */

    const isPasswordValid =
      await comparePassword(
        password,
        student.password,
      );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    /* ================================
       UPDATE LAST LOGIN
    ================================= */

    student.lastLogin = new Date();

    await student.save();

    /* ================================
       GENERATE TOKEN
    ================================= */

    const token = generateToken(student);

    /* ================================
       RESPONSE
    ================================= */

    return res.status(200).json({
      success: true,
      message: "Login successful.",

      token,

      student: {
        _id: student._id,
        studentId: student.studentId,
        fullName: student.fullName,
        mobile: student.mobile,
        email: student.email,
        fatherName: student.fatherName,
        motherName: student.motherName,
        address: student.address,
        course: student.course,

        photo: student.photo || {
          url: "",
          publicId: "",
        },

        aadhaarDocument:
          student.aadhaarDocument || {
            url: "",
            publicId: "",
            verified: false,
          },

        role: student.role,

        accountStatus:
          student.accountStatus,

        seat: student.seat || null,

        membership:
          student.membership || null,

        lastLogin:
          student.lastLogin,

        createdAt:
          student.createdAt,

        updatedAt:
          student.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Login Student Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to login student.",
    });
  }
};
/*
 * =====================================================
 * GET CURRENT STUDENT PROFILE
 * =====================================================
 */

const getStudentProfile =
  async (req, res) => {
    try {
      const Seat =
        require("../models/Seat");

      const student =
        await Student.findById(
          req.user.id,
        )
          .select("-password")
          .lean();

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "Student not found.",
        });
      }

      let assignedSeat =
        null;

      /*
       * First: Student.seat
       */

      if (student.seat) {
        assignedSeat =
          await Seat.findById(
            student.seat,
          )
            .select(
              "seatNumber seatType status section floor blockedReason reservedFor notes",
            )
            .lean();
      }

      /*
       * Second: Seat.student
       */

      if (!assignedSeat) {
        assignedSeat =
          await Seat.findOne({
            student:
              student._id,
            status: "OCCUPIED",
          })
            .select(
              "seatNumber seatType status section floor blockedReason reservedFor notes",
            )
            .lean();
      }

      /*
       * Third fallback
       */

      if (!assignedSeat) {
        assignedSeat =
          await Seat.findOne({
            student:
              student._id,
          })
            .select(
              "seatNumber seatType status section floor blockedReason reservedFor notes",
            )
            .lean();
      }

      /*
       * Repair relationship
       */

      if (assignedSeat) {
        if (
          !student.seat ||
          String(student.seat) !==
            String(
              assignedSeat._id,
            )
        ) {
          await Student.findByIdAndUpdate(
            student._id,
            {
              $set: {
                seat:
                  assignedSeat._id,
              },
            },
          );
        }

        student.seat =
          assignedSeat;
      } else {
        student.seat = null;
      }

      return res.status(200).json({
        success: true,
        student,
      });
    } catch (error) {
      console.error(
        "Get Student Profile Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch student profile.",
        error: error.message,
      });
    }
  };

/*
 * =====================================================
 * CHANGE PROFILE PHOTO
 * =====================================================
 */

const updateProfilePhoto =
  async (req, res) => {
    try {
      const photoFile =
        req.file || null;

      if (!photoFile) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a profile photo.",
        });
      }

      const student =
        await Student.findById(
          req.user.id,
        );

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "Student not found.",
        });
      }

      const baseUrl =
        `${req.protocol}://${req.get(
          "host",
        )}`;

      const photoUrl =
        `${baseUrl}/uploads/${photoFile.filename}`;

      student.photo = {
        url: photoUrl,
        publicId:
          photoFile.filename,
      };

      await student.save();

      return res.status(200).json({
        success: true,

        message:
          "Profile photo updated successfully.",

        student: {
          id: student._id,

          studentId:
            student.studentId,

          fullName:
            student.fullName,

          email:
            student.email,

          mobile:
            student.mobile,

          fatherName:
            student.fatherName,

          motherName:
            student.motherName,

          address:
            student.address,

          course:
            student.course,

          photo:
            student.photo,

          aadhaarDocument:
            student.aadhaarDocument,

          role:
            student.role,

          accountStatus:
            student.accountStatus,
        },
      });
    } catch (error) {
      console.error(
        "Update Profile Photo Error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update profile photo.",
        error: error.message,
      });
    }
  };

module.exports = {
  registerStudent,
  loginStudent,
  getStudentProfile,
  updateProfilePhoto,
};