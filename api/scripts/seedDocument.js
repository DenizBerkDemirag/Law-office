require("dotenv").config();

const mongoose = require("mongoose");

const User = require("../db/models/User");
const Case = require("../db/models/Case");
const Document = require("../db/models/Document");

async function seedDocument() {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);

    const member = await User.findOne({
      Email: "ali@gmail.com",
    });

    const caseData = await Case.findOne({
      FileNumber: "2026/001",
    });

    if (!member) {
      console.log("Üye bulunamadı.");
      process.exit();
    }

    if (!caseData) {
      console.log("Dava bulunamadı.");
      process.exit();
    }

    await Document.create({
      Member: member._id,
      Case: caseData._id,
      FileName: "Dilekce.pdf",
    });

    console.log("Belge başarıyla oluşturuldu.");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedDocument();
