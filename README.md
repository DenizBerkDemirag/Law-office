# ⚖️ Law Office & Client Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.16-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![EJS](https://img.shields.io/badge/Template%20Engine-EJS-red.svg)](https://ejs.co/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

A modern, full-stack **Law Office Management System & Web Application**. Built with Node.js, Express, MongoDB, and EJS, this system empowers law firms and attorneys to efficiently manage cases, clients, appointments, document archives, and internal messaging while enabling clients to schedule appointments online, track case progress, and communicate with their lawyers.

---

## 🚀 Key Features

### 👨‍⚖️ Lawyer / Admin Dashboard
* **Profile Management:** Manage attorney bio, practice areas, contact info, and avatar uploads via Multer.
* **Appointment Scheduling:** Review, approve, or reject client appointment requests; configure blocked slots / non-working hours.
* **Case Management:** 
  * Create new legal case entries, set case tracking numbers, and update statuses (Active, Pending, Archived).
  * Assign clients to cases and track upcoming court hearing dates.
  * Case archiving and active case filtering.
* **Document & File Management:** Upload, download, and store case files (PDF, DOCX) in a centralized digital archive.
* **Internal Messaging:** Communicate directly with assigned clients through an in-app chat interface.

### 👤 Client / Member Dashboard
* **Online Appointment Booking:** Browse law firm attorneys, check availability, and book consultation time slots online.
* **Case & File Tracking:** View assigned cases, court dates, case statuses, and shared legal documents.
* **Direct Messaging:** Send inquiries to assigned attorneys and track replies in real-time.

### 🌐 Public Web Application
* **Firm Overview:** Highlight the law firm's vision, mission, and practice areas.
* **Team Showcase:** Showcase attorneys, credentials, and specialties dynamically.
* **Contact & Consult:** Online contact form, location details, and direct inquiry submission.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose ORM
* **Frontend Template Engine:** EJS (Embedded JavaScript)
* **Styling & Assets:** CSS3 (Custom Responsive Layout), FontAwesome Icon Set
* **Authentication & Security:** `express-session`, `cookie-parser`, `bcrypt` (Password Hashing)
* **File Uploads:** `multer`
* **Environment Management:** `dotenv`

---

## 📁 Project Directory Structure

```text
Law-office/
└── api/
    ├── bin/              # Application entry point (www)
    ├── config/           # Database and application configuration
    ├── db/               # MongoDB connection and Mongoose models
    │   └── models/       # User, Lawyer, Case, Document, Appointment, BlockedSlot, Message
    ├── middleware/       # Authentication and authorization middleware
    ├── public/           # Static assets (CSS, JS, Images)
    ├── routes/           # Express route handlers (auth, lawyer, member, messages, etc.)
    ├── uploads/          # Uploaded profile images and case documents
    ├── views/            # EJS template views (UI layouts)
    ├── app.js            # Main Express application file
    ├── package.json      # Dependencies and scripts
    └── .env.example      # Environment variables template
```

---

## ⚙️ Installation & Setup

Follow these steps to run the application locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* [MongoDB](https://www.mongodb.com/) (Local MongoDB Server or MongoDB Atlas cluster)

### Step-by-Step Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/Law-office.git
   cd Law-office/api
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file inside the `api` directory based on `.env.example`:
   ```env
   PORT=3000
   CONNECTION_STRING=mongodb://127.0.0.1:27017/law_office_db
   SESSION_SECRET=your_super_secret_session_key
   LOG_LEVEL=debug
   ```

4. **Start the Application:**
   ```bash
   npm start
   ```

5. **Access in Browser:**
   Navigate to `http://localhost:3000` in your web browser.

---

## 🔒 Security & Authorization

* **Password Hashing:** Passwords for all users and attorneys are securely salted and hashed using `bcrypt`.
* **Session Management:** Secure role-based session control (`express-session`) prevents unauthorized access to lawyer or client portals.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to modify and use it!
