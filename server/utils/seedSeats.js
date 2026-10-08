const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Seat = require("../models/Seat");

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const seedSeats = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in server/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");
    console.log("Seeding 225 seats...");
    console.log("207 Normal + 18 Special\n");

    const seats = [];

    // ==========================================
    // 207 NORMAL SEATS
    // A001 - A207
    // ==========================================
    for (let i = 1; i <= 207; i++) {
      seats.push({
        seatNumber: `A${String(i).padStart(3, "0")}`,
        seatType: "NORMAL",
        status: "AVAILABLE",
        section: "MAIN",
        floor: 1,
      });
    }

    // ==========================================
    // 18 SPECIAL SEATS
    // S01 - S18
    // ==========================================
    for (let i = 1; i <= 18; i++) {
      seats.push({
        seatNumber: `S${String(i).padStart(2, "0")}`,
        seatType: "SPECIAL",
        status: "AVAILABLE",
        section: "SPECIAL",
        floor: 1,
      });
    }

    let created = 0;
    let existing = 0;

    // ==========================================
    // CREATE ONLY MISSING SEATS
    // ==========================================
    for (const seat of seats) {
      const alreadyExists = await Seat.findOne({
        seatNumber: seat.seatNumber,
      });

      if (alreadyExists) {
        existing++;
        continue;
      }

      await Seat.create(seat);
      created++;
    }

    const normalCount = await Seat.countDocuments({
      seatType: "NORMAL",
    });

    const specialCount = await Seat.countDocuments({
      seatType: "SPECIAL",
    });

    const totalSeats = await Seat.countDocuments();

    console.log("=================================");
    console.log("SEAT SEEDING COMPLETED");
    console.log("=================================");
    console.log(`Required Normal Seats : 207`);
    console.log(`Required Special Seats: 18`);
    console.log(`Required Total Seats  : 225`);
    console.log("---------------------------------");
    console.log(`New seats created     : ${created}`);
    console.log(`Already existing      : ${existing}`);
    console.log("---------------------------------");
    console.log(`Normal seats in DB    : ${normalCount}`);
    console.log(`Special seats in DB   : ${specialCount}`);
    console.log(`Total seats in DB     : ${totalSeats}`);
    console.log("=================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding seats:");
    console.error(error);

    try {
      await mongoose.connection.close();
    } catch {}

    process.exit(1);
  }
};

seedSeats();