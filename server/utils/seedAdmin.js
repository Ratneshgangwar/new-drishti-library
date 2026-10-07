const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Student = require("../models/Student");
const { hashPassword } = require("./auth");

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log("=================================");
    console.log("Starting admin seed...");
    console.log("=================================");

    // ==========================================
    // CHECK ENV
    // ==========================================

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL is missing in .env");
    }

    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD is missing in .env");
    }

    console.log("Admin email:", adminEmail);
    console.log("Admin password exists:", !!adminPassword);

    // ==========================================
    // CONNECT MONGODB
    // ==========================================

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected for admin seeding");

    // ==========================================
    // CHECK EXISTING ADMIN
    // ==========================================

    const existingAdmin = await Student.findOne({
      email: adminEmail.toLowerCase(),
      role: "admin",
    });

    if (existingAdmin) {
      console.log("=================================");
      console.log("Admin account already exists.");
      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      console.log("=================================");

      await mongoose.connection.close();

      process.exit(0);
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await hashPassword(
      adminPassword
    );

    // ==========================================
    // CREATE ADMIN
    // ==========================================

    const admin = await Student.create({
      studentId: `ADMIN${Date.now()}`,

      fullName: "Library Administrator",

      mobile: "6394468584",

      email: adminEmail.toLowerCase(),

      password: hashedPassword,

      fatherName: "Library Administration",

      motherName: "",

      address: "Drishti Library",

      course: "Administration",

      role: "admin",

      accountStatus: "active",
    });

    console.log("=================================");
    console.log("Admin account created successfully");
    console.log("=================================");
    console.log("Admin ID:", admin.studentId);
    console.log("Admin Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("Account Status:", admin.accountStatus);
    console.log("=================================");

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("=================================");
    console.error("ADMIN SEED ERROR");
    console.error("=================================");
    console.error(error);
    console.error("=================================");

    try {
      await mongoose.connection.close();
    } catch (closeError) {
      // Ignore connection close error
    }

    process.exit(1);
  }
};

// ==========================================
// START SEEDER
// ==========================================

seedAdmin();