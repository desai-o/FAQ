const mongoose = require("mongoose");

let mongoAvailable = false;

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    mongoAvailable = true;
    console.log("MongoDB connected");
    console.log("Database name:", mongoose.connection.name);

    // Seed default admin in Mongo
    try {
      const User = require("../models/User");
      const adminExists = await User.findOne({ email: "admin@crowdfaq.com" });
      if (!adminExists) {
        const bcrypt = require("bcryptjs");
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash("adminpassword", salt);
        await User.create({
          name: "Admin",
          email: "admin@crowdfaq.com",
          password: hash,
          role: "admin"
        });
        console.log("Seeded MongoDB default admin user");
      } else if (adminExists.role !== "admin") {
        adminExists.role = "admin";
        await adminExists.save();
        console.log("Updated existing default admin user role to admin in MongoDB");
      }
    } catch (seedErr) {
      console.error("Failed to seed MongoDB default admin user:", seedErr.message);
    }

    mongoose.connection.on("disconnected", () => {
      mongoAvailable = false;
      console.warn("MongoDB disconnected. SQLite fallback active.");
    });

    mongoose.connection.on("reconnected", () => {
      mongoAvailable = true;
      console.log("MongoDB reconnected");
    });

    mongoose.connection.on("error", (error) => {
      mongoAvailable = false;
      console.error("MongoDB runtime error:", error.message);
    });
  } catch (error) {
    mongoAvailable = false;
    console.error("MongoDB connection failed. SQLite fallback active.");
    console.error(error.message);
  }
}

function isMongoAvailable() {
  return mongoAvailable && mongoose.connection.readyState === 1;
}

module.exports = {
  connectMongo,
  isMongoAvailable
};
