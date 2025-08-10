const mongoose = require("mongoose");
const MentorAvailability = require("../Models/mentorAvailability");
require("dotenv").config();

async function addSampleAvailability() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/loopverse"
    );
    console.log("Connected to MongoDB");

    const mentorId = "6898c03bc9ff637b489f15dc"; // Test Mentor's ID

    // Create availability for the next 7 days
    const availabilityDates = [];
    const today = new Date();

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Add some time slots for each day
      const timeSlots = [
        {
          startTime: "09:00",
          endTime: "10:00",
          isBooked: false,
        },
        {
          startTime: "11:00",
          endTime: "12:00",
          isBooked: false,
        },
        {
          startTime: "14:00",
          endTime: "15:00",
          isBooked: false,
        },
        {
          startTime: "16:00",
          endTime: "17:00",
          isBooked: false,
        },
      ];

      availabilityDates.push({
        date: date,
        timeSlots: timeSlots,
      });
    }

    // Delete existing availability for this mentor
    await MentorAvailability.deleteOne({ mentor: mentorId });

    // Create new availability
    const mentorAvailability = new MentorAvailability({
      mentor: mentorId,
      availabilityDates: availabilityDates,
      isActive: true,
    });

    await mentorAvailability.save();

    console.log("✅ Sample availability created successfully!");
    console.log(`Created availability for mentor: ${mentorId}`);
    console.log(`Number of dates: ${availabilityDates.length}`);
    console.log(`Time slots per day: ${availabilityDates[0].timeSlots.length}`);

    // Show the created availability
    availabilityDates.forEach((dateObj, index) => {
      console.log(`\nDay ${index + 1}: ${dateObj.date.toDateString()}`);
      dateObj.timeSlots.forEach((slot) => {
        console.log(`  - ${slot.startTime} - ${slot.endTime}`);
      });
    });

    mongoose.disconnect();
    console.log("\nDatabase connection closed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

addSampleAvailability();
