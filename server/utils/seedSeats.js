const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Seat = require("./models/Seat");

dotenv.config();

const checkExtraSeats = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");
    console.log("Checking extra seats...\n");

    const extraSeatNumbers = [
      "A208",

      "S19",
      "S20",
      "S21",
      "S22",
      "S23",
      "S24",
      "S25",
      "S26",
      "S27",
      "S28",
      "S29",
      "S30",
      "S31",
      "S32",
      "S33",
      "S34",
      "S35",
      "S36",
      "S37",
      "S38",
      "S39",
      "S40",
      "S41",
      "S42",
    ];

    const seats = await Seat.find({
      seatNumber: {
        $in: extraSeatNumbers,
      },
    }).select(
      "seatNumber status student reservedFor"
    );

    console.log("=================================");
    console.log("EXTRA SEATS FOUND");
    console.log("=================================");

    if (seats.length === 0) {
      console.log("No extra seats found.");
    } else {
      seats.forEach((seat) => {
        console.log({
          seatNumber: seat.seatNumber,
          status: seat.status,
          student: seat.student,
          reservedFor: seat.reservedFor,
        });
      });
    }

    console.log("=================================");
    console.log(`Total extra seats found: ${seats.length}`);
    console.log("=================================");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error checking seats:");
    console.error(error);

    try {
      await mongoose.connection.close();
    } catch {}

    process.exit(1);
  }
};

checkExtraSeats();