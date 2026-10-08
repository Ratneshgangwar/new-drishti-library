const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");

const Student = require("../models/Student");

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const seedAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not defined in server/.env"
      );
    }

    if (!process.env.ADMIN_EMAIL) {
      throw new Error(
        "ADMIN_EMAIL is not defined in server/.env"
      );
    }

    if (!process.env.ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_PASSWORD is not defined in server/.env"
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");
    console.log("Checking admin account...\n");

    const email = process.env.ADMIN_EMAIL
      .trim()
      .toLowerCase();

    const existingAdmin = await Student.findOne({
      email,
      role: "admin",
    });

    if (existingAdmin) {
      console.log("=================================");
      console.log("ADMIN ALREADY EXISTS");
      console.log("=================================");
      console.log(`Email: ${email}`);
      console.log(`Student ID: ${existingAdmin.studentId}`);
      console.log("Role: admin");
      console.log("=================================");

      await mongoose.connection.close();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      12
    );

    const admin = await Student.create({
      studentId: "ADMIN001",
      fullName: "Library Administrator",
      email,
      password: hashedPassword,
      mobile: "9999999999",
      fatherName: "Library Administration",
      address: "New Drishti Library",
      role: "admin",
    });

    console.log("=================================");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log(`Name: ${admin.fullName}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Student ID: ${admin.studentId}`);
    console.log("Role: admin");
    console.log("=================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:");
    console.error(error);

    try {
      await mongoose.connection.close();
    } catch {}

    process.exit(1);
  }
};

seedAdmin();