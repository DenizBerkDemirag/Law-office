require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../db/models/User");

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);

    const exists = await User.findOne({
      Email: "admin@lawoffice.com",
    });

    if (exists) {
      console.log("Admin zaten mevcut.");
      process.exit();
    }

    const password = await bcrypt.hash("123456", 10);

    await User.create({
      Username: "Admin",
      Email: "admin@lawoffice.com",
      Password: password,
      Role: "lawyer",
    });

    console.log("Admin başarıyla oluşturuldu.");

    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

seedAdmin();
