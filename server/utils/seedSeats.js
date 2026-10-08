const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Seat = require("../models/Seat");
const path = require("path");

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const seedSeats = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not defined in server/.env"
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");
    console.log("Seeding 45 seats...");
    console.log("27 Normal + 18 Special\n");

    const seats = [];

    // 27 Normal Seats: A001 - A027
    for (let i = 1; i <= 27; i++) {
      seats.push({
        seatNumber: `A${String(i).padStart(3, "0")}`,
        seatType: "NORMAL",
        status: "AVAILABLE",
        section: "MAIN",
        floor: 1,
      });
    }

    // 18 Special Seats: S01 - S18
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

    const totalSeats = await Seat.countDocuments();

    console.log("=================================");
    console.log("SEAT SEEDING COMPLETED");
    console.log("=================================");
    console.log(`Required seats: 45`);
    console.log(`Normal seats: 27`);
    console.log(`Special seats: 18`);
    console.log(`New seats created: ${created}`);
    console.log(`Already existing: ${existing}`);
    console.log(`Total seats in database: ${totalSeats}`);
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