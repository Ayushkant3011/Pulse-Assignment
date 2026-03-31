# Pulse — Video Upload, Sensitivity Processing & Streaming Platform

A comprehensive full-stack application for uploading videos, processing them for content sensitivity analysis, and providing seamless video streaming with real-time progress tracking.

## Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Frontend  | React 18, Vite, React Router, Socket.io-client |
| Backend   | Node.js, Express.js, Socket.io              |
| Database  | MongoDB with Mongoose ODM                   |
| Auth      | JWT (JSON Web Tokens)                       |
| Uploads   | Multer (disk storage)                       |
| Streaming | HTTP Range Requests (206 Partial Content)   |

## Features

- **User Authentication** — Register / Login with JWT
- **Role-Based Access Control (RBAC)** — Viewer, Editor, Admin
- **Multi-Tenant Isolation** — Each user sees only their own data
- **Video Upload** — Drag-and-drop with real-time upload progress
- **Sensitivity Analysis** — Automated safe/flagged classification
- **Real-Time Updates** — Socket.io processing progress on dashboard
- **Video Streaming** — HTTP range request-based playback
- **Admin Panel** — User management with role editing
- **Filtering & Search** — By status, sensitivity, and keywords
- **Responsive UI** — Works on desktop and mobile

## Project Structure

```
Pulse Assignment/
├── backend/
│   ├── src/
│   │   ├── config/          # App config & DB connection
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, upload, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic (processing, analysis)
│   │   ├── socket/          # Socket.io setup
│   │   ├── scripts/         # Seed scripts
│   │   └── server.js        # Entry point
│   ├── .env
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Layout, reusable components
│   │   ├── context/         # AuthContext, SocketContext
│   │   ├── pages/           # Login, Register, Dashboard, Upload, Player, Users
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        # Complete design system
│   ├── index.html
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** v18+ (LTS)
- **MongoDB** running locally or a MongoDB Atlas cluster
- **npm** or **yarn**

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env` with your MongoDB URI:

```env
MONGODB_URI=mongodb://localhost:27017/pulse
JWT_SECRET=your_secret_key_here
```

### 3. Seed Admin User (Optional)

```bash
cd backend
npm run seed
# Creates: admin@pulse.com / admin123
```

### 4. Run the Application

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## API Endpoints

### Auth
| Method | Endpoint             | Description         | Auth |
|--------|----------------------|---------------------|------|
| POST   | `/api/auth/register` | Register new user   | No   |
| POST   | `/api/auth/login`    | Login               | No   |
| GET    | `/api/auth/profile`  | Get current profile | Yes  |

### Videos
| Method | Endpoint                  | Description          | Role          |
|--------|---------------------------|----------------------|---------------|
| POST   | `/api/videos/upload`      | Upload video         | Editor, Admin |
| GET    | `/api/videos`             | List videos          | All           |
| GET    | `/api/videos/:id`         | Get single video     | All           |
| GET    | `/api/videos/:id/stream`  | Stream video         | All           |
| DELETE | `/api/videos/:id`         | Delete video         | Editor, Admin |

### Users (Admin Only)
| Method | Endpoint               | Description     |
|--------|------------------------|-----------------|
| GET    | `/api/users`           | List all users  |
| PATCH  | `/api/users/:id/role`  | Update role     |
| DELETE | `/api/users/:id`       | Delete user     |

## Socket.io Events

| Event                      | Direction       | Description                     |
|----------------------------|-----------------|---------------------------------|
| `video:processing_started` | Server → Client | Processing has begun            |
| `video:processing_progress`| Server → Client | Progress update (0–100%)        |
| `video:processing_complete`| Server → Client | Done — includes safe/flagged    |
| `video:processing_failed`  | Server → Client | Processing error                |

## Roles

| Role   | Permissions                                      |
|--------|--------------------------------------------------|
| Viewer | View videos, stream content                      |
| Editor | Upload, delete own videos, plus Viewer access     |
| Admin  | Full access: manage users, delete any video       |

## Design Decisions

1. **Simulated Sensitivity Analysis** — Uses a randomized scoring system. In production, swap `sensitivityService.js` with Google Video Intelligence, AWS Rekognition, or Hive Moderation API.
2. **Local File Storage** — Videos are stored on disk via Multer. For production, switch to AWS S3 or Google Cloud Storage.
3. **Tenant Isolation** — Every query is scoped by `tenantId`. New users auto-generate a unique tenant ID.
4. **Socket Rooms** — Users join tenant-specific rooms so processing events are only broadcast to relevant users.

## License

MIT
