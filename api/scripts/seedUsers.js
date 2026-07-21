require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../db/models/User");

async function seedUsers() {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);

    const password = await bcrypt.hash("123456", 10);

    const users = [
      {
        Username: "Ali Yılmaz",
        Email: "ali@gmail.com",
        Password: password,
        Role: "member",
      },
      {
        Username: "Ayşe Demir",
        Email: "ayse@gmail.com",
        Password: password,
        Role: "member",
      },
      {
        Username: "Mehmet Kaya",
        Email: "mehmet@gmail.com",
        Password: password,
        Role: "member",
      },
    ];

    await User.insertMany(users);

    console.log("Örnek üyeler oluşturuldu.");

    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

seedUsers();
