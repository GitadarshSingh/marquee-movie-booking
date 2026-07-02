# 🎬 Marquee — Full Stack Movie Ticket Booking Platform

A production-style movie ticket booking platform (BookMyShow/District-style clone) built with **Spring Boot**, **React.js**, and **MySQL** — featuring real-time seat selection, secure payment integration, and concurrency-safe booking logic.

> ⚙️ **Status:** Feature-complete. AWS deployment (EC2 + RDS + S3) in progress.

---

## ✨ Features

- 🔐 **JWT-based Authentication** with Spring Security for secure user sessions
- 💺 **Real-time Seat Selection** with pessimistic locking (`PESSIMISTIC_WRITE`) to prevent double-booking under concurrent requests
- ⏱️ **Auto-release Scheduler** — automatically frees up seats locked but not confirmed within a time window
- 💳 **Razorpay Payment Integration** — order creation, signature verification, and payment status tracking
- 🎟️ **Tiered Seat Pricing** (GOLD / PREMIUM / NORMAL) across multiple theaters and screens
- 🎬 **Large-scale Seed Dataset** — 100+ movies, 15 theaters, 45 screens, and thousands of show-seat combinations
- 📧 Email confirmation flow after successful booking
- 🎨 Modern, responsive UI inspired by District's design language

---

## 🛠️ Tech Stack

**Backend**
- Java, Spring Boot, Spring Security, Spring Data JPA
- MySQL
- JWT Authentication
- Razorpay API

**Frontend**
- React.js (Vite)
- Axios
- CSS (custom, responsive design)

**Tools**
- Git, Postman, Maven

---

## 📁 Project Structure
marquee-movie-booking/
├── backend/          → Spring Boot REST API
│   ├── src/main/java/com/cfs/BOOKMYSHOW/
│   │   ├── controller/    → REST endpoints
│   │   ├── service/       → Business logic
│   │   ├── repository/    → Data access layer
│   │   ├── model/         → JPA entities
│   │   ├── dto/           → Data transfer objects
│   │   └── security/      → JWT & Spring Security config
│   └── pom.xml
├── frontend/         → React (Vite) client
│   ├── src/
│   │   ├── pages/         → App screens (Home, Booking, Payment, etc.)
│   │   ├── components/    → Reusable UI components
│   │   ├── services/      → API service layer
│   │   └── context/       → Auth & Theme context
│   └── package.json
└── README.md

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8+
- Maven

### Backend Setup
```bash
cd backend
# Configure your local application.properties with DB credentials
mvn clean install
mvn spring-boot:run
```
Backend runs on `http://localhost:8080`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

> ⚠️ **Note:** `application.properties` is gitignored for security. Create your own local copy with your MySQL credentials, JWT secret, and Razorpay API keys before running the backend.

---

## 🔒 Key Backend Highlights

- **Concurrency handling:** Seat booking uses `PESSIMISTIC_WRITE` locks at the database level to prevent race conditions when multiple users try to book the same seat simultaneously.
- **Layered architecture:** Clean separation across Controller → Service → Repository layers.
- **Secure payments:** Razorpay order creation and webhook signature verification implemented server-side to prevent payment tampering.

---

## 📌 Roadmap
- [ ] Deploy backend on AWS EC2
- [ ] Migrate database to AWS RDS
- [ ] Host frontend on AWS S3 + CloudFront
- [ ] Add CI/CD pipeline

---

## 👤 Author

**Adarsh Kumar Singh**
[GitHub](https://github.com/GitadarshSingh) | [LeetCode](https://leetcode.com/u/GitadarshSingh/)
