# Pulse — Video Platform

A comprehensive full-stack application for uploading videos, processing them for content sensitivity analysis, and providing seamless video streaming with real-time progress tracking. Built with modern web technologies and a focus on security, scalability, and beautiful UI.

## 🚀 Live Demo & Links

- **Live Application:** [Insert Vercel/Netlify Link Here]
- **API Base URL:** [Insert Render/Heroku Link Here]
- **Demo Video:** [Insert Loom/YouTube Link Here]

---

## 🛠️ Technology Stack

**Frontend:**
- **React 18** + **Vite** (Lightning-fast build tool)
- **React Router v7** (Client-side routing with protected routes)
- **Socket.io-client** (Real-time bidirectional event listening)
- **Axios** (API requests with JWT interceptors)
- **Vanilla CSS (Catppuccin-inspired)** (Glassmorphism, CSS variables, fully responsive)

**Backend:**
- **Node.js** + **Express.js** (REST API architecture)
- **Socket.io** (Real-time progress broadcasting)
- **MongoDB** + **Mongoose** (NoSQL Database with ODM)
- **JWT (JSON Web Tokens)** (Stateless, secure authentication)
- **Multer** (Multipart/form-data handling for video uploads)
- **Fluent-FFmpeg** (Video optimization pipeline)

---

## ✨ Core Features & Requirements Met

### 1. Multi-Tenant Architecture & Data Segregation
- **True Tenant Isolation:** Every `User` and `Video` document securely stores a `tenantId`. All API queries natively filter by the requester's `tenantId`. A user in Organization A cannot see, stream, or delete videos from Organization B.
- **Socket Rooms:** Real-time processing events use Socket.io rooms named by `tenantId`. Progress updates are strictly broadcast only to authenticated users within that specific tenant.

### 2. Role-Based Access Control (RBAC)
- **Viewer:** Read-only access. Can browse the dashboard, search, filter, and stream videos. The UI dynamically hides the Upload buttons.
- **Editor:** Can upload new videos and delete their own uploaded videos, plus all Viewer capabilities.
- **Admin:** Full system access. Can view a dedicated User Management dashboard, change user roles on the fly, and delete any video or user in the system.

### 3. Video Processing Pipeline
1. **Upload Validation:** Handled by Multer. Rejects non-video MIME types and enforces a strict 100MB file size limit before the upload even finishes.
2. **Secure Storage:** Videos are saved with cryptographically secure UUIDs (`uuidv4`).
3. **FFmpeg Optimization:** Uploaded videos are passed through `fluent-ffmpeg` to standardize the format to H.264 video / AAC audio at 720p. The `+faststart` flag is applied, moving the `moov` atom to the front of the file to guarantee instant streaming without downloading the whole file first.
4. **Sensitivity Analysis:** A simulated AI-screening mechanism runs after optimization. It calculates a safety score, applies content flags (e.g., violence, adult_content), and determines if the video is `safe` or `flagged`.
5. **Real-Time Status:** The UI features a pulsing progress bar that updates in real-time as the Backend pushes Socket.io events detailing the exact optimization and analysis steps.

### 4. Advanced Video Streaming
- Instead of downloading massive files, the backend implements **HTTP Range Requests (206 Partial Content)**.
- The Node.js `fs.createReadStream` API dynamically chunks the video file on-the-fly based on the `<video>` player's exact second, allowing users to instantly skip to the middle of a 2-hour video without waiting.

---

## 🏗️ Project Structure

```text
Pulse-Assignment/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment variables & MongoDB connection
│   │   ├── controllers/     # Separation of concerns: Auth, User, Video handlers
│   │   ├── middleware/      # JWT guards, RBAC checking, global Error handler
│   │   ├── models/          # Mongoose Schemas with compound indexes
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # FFmpeg optimization & Sensitivity logic
│   │   ├── socket/          # Socket.io authentication & room joining
│   │   ├── scripts/         # npm run seed (Admin user generator)
│   │   └── server.js        # Main initialization
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/      # Responsive Sidebar & Layout wrap
    │   ├── context/         # React Context: AuthContext, SocketContext
    │   ├── pages/           # Login, Register, Dashboard, Upload, Player, Admin Users
    │   ├── services/        # Axios configurations
    │   ├── App.jsx          # Protected Routes wrap
    │   └── index.css        # Global design system
    └── package.json
```

---

## ⚙️ Local Development Guide

### Prerequisites
- Node.js (v18+ LTS)
- MongoDB (Running locally on port 27017, or a MongoDB Atlas URI)
- FFmpeg (Must be installed and added to your system PATH for video optimization to work)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory mapping your database:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pulse
JWT_SECRET=your_super_secret_jwt_key
MAX_FILE_SIZE=104857600
UPLOAD_DIR=uploads
CLIENT_URL=http://localhost:5173
```

*(Optional) Seed the testing database with an Admin user:*
```bash
npm run seed
# Creates: admin@pulse.com / admin123
```

Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📜 API Documentation

### Authentication `/api/auth`
- `POST /register`: Create a new user (accepts `username, email, password, role`).
- `POST /login`: Generate a JWT token.
- `GET /profile`: Return the authenticated user object.

### Videos `/api/videos`
- `POST /upload`: Upload `multipart/form-data` (requires `Editor` or `Admin`).
- `GET /`: List all videos for the user's `tenantId` (supports search, sort, pagination).
- `GET /:id`: Fetch metadata for a single video.
- `GET /:id/stream`: Stream the raw MP4 chunks via 206 Partial Content.
- `DELETE /:id`: Delete a video from DB and local disk.

### Users `/api/users` (Admin Only)
- `GET /`: List all users in the tenant.
- `PATCH /:id/role`: Instantly alter a user's RBAC role (`viewer | editor | admin`).
- `DELETE /:id`: Purge a user from the system.

---

## 🎨 Design Decisions & Assumptions
1. **Glassmorphism UI:** To create a "Wow" factor request from the assignment, the UI completely eschews basic templates. It uses a bespoke Dark Mode CSS architecture featuring blurred backgrounds, modern gradients, CSS animations, and strict flex-grid responsive layouts.
2. **Real-Time over Polling:** Instead of having the React frontend spam the backend every 3 seconds to check if a video is done processing via `setInterval`, I implemented Socket.io to keep the network requests to absolute zero. The server forcefully pushes the update to the client exactly when it happens.
3. **Simulated AI Processing:** True video sensitivity ML models take significant time to train or cost money to hit via AWS/GCP APIs. The `sensitivityService.js` perfectly simulates the exact latency, asynchronous chunking, and JSON response structure of a real API so it can be swapped out in production with a single line of code.

---
*Developed for the Full-Stack Video Platform Assignment.*
