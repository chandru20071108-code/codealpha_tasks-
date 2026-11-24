# 🚀 CodeAlpha Web Development Internship Projects

This repository contains all three full-stack projects completed as part of the **CodeAlpha Web Development Internship**.

---

## 📁 Repository Overview

```
CodeAlpha/
├── 📂 Task 1 - URL Shortener/             # Python Flask + SQLite + Vanilla JS/CSS
├── 📂 Task 2 - Event Registration/        # Express.js (Node.js) + SQLite + Responsive UI
└── 📂 Task 3 - Restaurant Management/     # Express.js (Node.js) + SQLite + POS & Admin Panel
```

---

## 📌 Task 1: Simple URL Shortener (SnapLink)
* **Tech Stack:** Python Flask, SQLite, HTML5, CSS3, Vanilla JavaScript
* **Directory:** [`Task 1 - URL Shortener`](./Task%201%20-%20URL%20Shortener)
* **Features:**
  * Clean, responsive glassmorphism UI with gradient animations.
  * Enter any long URL and generate a unique 6-character alphanumeric short link.
  * Server-side URL validation & auto-prefixing `https://`.
  * Dynamic redirection route (`/<short_code>`) with 302 redirect.
  * Custom 404 page for nonexistent or expired links.
  * One-click clipboard copy button with visual feedback.
  * SQLite persistence (`urls.db`).
* **Quick Run:**
  ```bash
  cd "Task 1 - URL Shortener"
  pip install -r requirements.txt
  python app.py
  # Runs at http://localhost:5000
  ```

---

## 📌 Task 2: Event Registration System (EventHub)
* **Tech Stack:** Node.js, Express.js, SQLite, HTML5, CSS3, JavaScript
* **Directory:** [`Task 2 - Event Registration`](./Task%202%20-%20Event%20Registration)
* **Features:**
  * Browse upcoming events with live capacity indicators and progress bars.
  * Event details view showing organizer, venue, date, time, and available slots.
  * Instant registration form with input validation and duplicate email prevention.
  * "My Registrations" portal allowing attendees to search and view/cancel their registrations.
  * RESTful JSON APIs for events, registrations, and cancellations.
* **Quick Run:**
  ```bash
  cd "Task 2 - Event Registration"
  npm install
  node src/app.js
  # Runs at http://localhost:3000
  ```

---

## 📌 Task 3: Restaurant Management System (DineManager)
* **Tech Stack:** Node.js, Express.js, SQLite, HTML5, CSS3, JavaScript
* **Directory:** [`Task 3 - Restaurant Management`](./Task%203%20-%20Restaurant%20Management)
* **Features:**
  * **Interactive Menu:** Categorized food menu (Starters, Main Course, Beverages, etc.) with real-time stock levels.
  * **Order Processing:** Place multi-item orders for dine-in tables or takeaways, with automatic inventory deduction and order totals.
  * **Order Status Management:** Track and update orders (`Pending` → `Preparing` → `Ready` → `Served`).
  * **Table Management & Reservations:** View table availability (2-seater, 4-seater, 6-seater) and book reservations with conflict prevention.
  * **Reports & Alerts:** Daily revenue breakdown, total order counts, and automated low-stock warnings.
* **Quick Run:**
  ```bash
  cd "Task 3 - Restaurant Management"
  npm install
  node src/app.js
  # Runs at http://localhost:3001
  ```

---

## 👨‍💻 Author
* **Developer:** Chandru ([@chandru20071108-code](https://github.com/chandru20071108-code))
* **Internship:** CodeAlpha Web Development
