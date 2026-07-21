require("dotenv").config();

const mongoose = require("mongoose");

const User = require("../db/models/User");
const Case = require("../db/models/Case");

async function seedCases() {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);

    const member = await User.findOne({
      Email: "ali@gmail.com",
    });

    if (!member) {
      console.log("Üye bulunamadı.");
      process.exit();
    }

    await Case.create({
      Member: member._id,
      FileNumber: "2026/001",
      Subject: "İşe İade Davası",
    });

    console.log("Örnek dava oluşturuldu.");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedCases();
