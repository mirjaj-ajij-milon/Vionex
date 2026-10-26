# Vionex — Full-Stack Real-Time Video Calling & Collaboration Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express 5](https://img.shields.io/badge/Express-5-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101.svg?logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Mongoose-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deployment%20Ready-black.svg?logo=vercel&logoColor=white)](https://vercel.com/)

> **Repository:** [https://github.com/mirjaj-ajij-milon/Vionex](https://github.com/mirjaj-ajij-milon/Vionex)  
> **Architecture:** Unified Monorepo containing both **Frontend (React 19 + Vite)** and **Backend (Express 5 + Socket.IO + MongoDB)**.

---

## 📑 Table of Contents

1. [About Vionex](#-about-vionex)
2. [Monorepo Directory Structure](#-monorepo-directory-structure)
3. [Quick Start (Local Setup in 3 Steps)](#-quick-start-local-setup-in-3-steps)
4. [Environment Variables & Security (.env)](#-environment-variables--security-env)
5. [Deploying Backend to Vercel](#-deploying-backend-to-vercel)
6. [Deploying Frontend to Vercel or Netlify](#-deploying-frontend-to-vercel-or-netlify)
7. [Persistent WebRTC Signaling Server (Socket.IO Guide)](#-persistent-webrtc-signaling-server-socketio-guide)
8. [REST API Reference](#-rest-api-reference)
9. [Automated Testing & Verification](#-automated-testing--verification)
10. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 💡 About Vionex

**Vionex** is an ultra-modern, privacy-first video conferencing web application designed with a cyber-luxe obsidian aesthetic. It enables seamless real-time communication directly inside modern web browsers with zero downloads or plug-ins required.

### ✨ Key Features:
- 🎥 **Multi-Peer WebRTC Mesh Calling**: High-definition peer-to-peer audio and video mesh with adaptive ICE candidates.
- 🖥️ **Screen Sharing**: 1-click ultra-smooth presentation and screen streaming.
- 💬 **Live In-Meeting Chat**: Real-time room text chat with emoji reaction shortcuts.
- 🚪 **Guest Instant Meetings**: Anyone can generate a unique room code or join instantly without friction.
- 🔐 **Secure Authentication**: Hashed session tokens (SHA-256) and bcrypt password encryption.
- 📅 **Meeting Activity History**: Indexed MongoDB records of all meetings joined by authenticated users.
- 📱 **100% Mobile Responsive**: Dedicated spotlight speaker stage, "Peers in Sync" carousel, and floating touch docks for phones and tablets.

---

## 📂 Monorepo Directory Structure

Both frontend and backend are housed within this single repository for unified management, synchronized git versioning, and simplified development workflows:

```text
Vionex/
├── backend/                        # Node.js + Express + Socket.IO Backend
│   ├── api/
│   │   └── index.js                # Vercel serverless function entrypoint
│   ├── config/
│   │   ├── db.js                   # Cached MongoDB connection manager (Serverless-optimized)
│   │   └── index.js                # Environment configuration loader
│   ├── controlers/
│   │   ├── socketManager.js        # WebRTC signaling, room isolation & chat broker
│   │   └── user.controler.js       # Auth, session lifecycle, and meeting history
│   ├── middleware/
│   │   └── auth.middleware.js      # Strict Bearer token authorization guard
│   ├── models/
│   │   ├── Meeting.model.js        # Mongoose schema for user call records
│   │   └── user.model.js           # Mongoose schema for user accounts & sessions
│   ├── routes/
│   │   └── user.routs.js           # REST API routes with brute-force rate-limiting
│   ├── test/                       # Node native unit and integration tests
│   ├── .env.example                # Template for backend environment variables
│   ├── .gitignore                  # Backend-specific ignore rules
│   ├── index.js                    # Express app definition & HTTP/Socket server
│   ├── package.json                # Backend dependencies and scripts
│   └── vercel.json                 # Vercel deployment & URL rewrite configuration
│
├── frontend/                       # React 19 + Vite + Material UI Client
│   ├── public/                     # Static images, favicon, icons, and _redirects
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # User authentication and state provider
│   │   ├── pages/
│   │   │   ├── Authentication.jsx  # Sign In / Sign Up views
│   │   │   ├── History.jsx         # Meeting history dashboard
│   │   │   ├── Home.jsx            # Join/create call dashboard
│   │   │   ├── LandingPage.jsx     # Modern animated landing page
│   │   │   └── VideoMeet.jsx       # Real-time WebRTC calling room & in-call controls
│   │   ├── environment.js          # API & WebSocket backend URL resolver
│   │   ├── main.jsx                # Application root with lazy-loaded routes
│   │   └── index.css               # Global obsidian theme styling & tokens
│   ├── test/                       # Frontend unit tests
│   ├── .env.example                # Template for frontend environment variables
│   ├── .gitignore                  # Frontend-specific ignore rules
│   ├── index.html                  # HTML5 entry template
│   ├── package.json                # Frontend dependencies and scripts
│   └── vite.config.js              # Vite build setup with rollup chunk splitting
│
├── .env.example                    # Global environment variable reference
├── .gitignore                      # Monorepo root git ignore rules (Strict secret protection)
├── package.json                    # Monorepo root scripts (dev, test, install:all)
└── README.md                       # Main project documentation
```

---

## 🚀 Quick Start (Local Setup in 3 Steps)

### Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **MongoDB**: Local MongoDB community edition running on `mongodb://127.0.0.1:27017` OR a free [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI.

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/mirjaj-ajij-milon/Vionex.git
cd Vionex
```

---

### Step 2: Install Dependencies
You can install dependencies for both `backend` and `frontend` in a single command from the root:
```bash
npm run install:all
```
*(Or install individually: `cd backend && npm install` then `cd ../frontend && npm install`)*

---

### Step 3: Run the Development Servers

Open two terminal windows (or run commands from the root):

#### Terminal 1 — Start the Backend (Port 8080):
```bash
# From repository root:
npm run dev:backend

# Or directly in backend folder:
cd backend
npm run dev
```

#### Terminal 2 — Start the Frontend (Port 5173):
```bash
# From repository root:
npm run dev:frontend

# Or directly in frontend folder:
cd frontend
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**. You are ready to start video calling! 🎉

---

## 🔐 Environment Variables & Security (.env)

> [!IMPORTANT]
> **Security Notice**: Actual `.env`, `.env.development`, `.env.production`, and `.env.local` files contain confidential credentials and are **strictly ignored by git**. They are never committed to GitHub.
>
> Always use the provided `.env.example` templates to set up your environment!

### 1. Backend Environment Variables (`backend/.env`)

Create `backend/.env.development` for local work or configure these variables in your deployment dashboard (e.g. Vercel / Render):

| Variable | Required | Default (Dev) | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Environment mode (`development` or `production`) |
| `PORT` | Yes | `8080` | Port for local server (Render/Vercel sets this automatically) |
| `MONGO_URL` | Yes | `mongodb://127.0.0.1:27017/vionex` | MongoDB connection URI (use Atlas string in production) |
| `CLIENT_ORIGIN`| Yes | `http://localhost:5173` | Allowed frontend origin for CORS (e.g. `https://vionex.vercel.app`) |
| `TURN_URL` | No | *(Empty)* | Optional STUN/TURN server URL for strict mobile/firewall NAT traversal |
| `TURN_USERNAME`| No | *(Empty)* | Optional TURN username |
| `TURN_CREDENTIAL`| No| *(Empty)* | Optional TURN credential/secret |

### 2. Frontend Environment Variables (`frontend/.env`)

Create `frontend/.env.development` or configure in your hosting platform:

| Variable | Required | Default (Dev) | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | `http://localhost:8080` | Backend API URL (e.g. `https://vionex-backend.vercel.app`) |

---

## ⚡ Deploying Backend to Vercel

The Vionex backend is engineered to run seamlessly on **Vercel Serverless Functions**.

### How It Works:
- `backend/vercel.json` routes all incoming requests (`/(.*)`) to `backend/api/index.js`.
- `backend/api/index.js` exports the Express application.
- `backend/config/db.js` uses a global cached MongoDB connection pool so database connections stay warm across serverless invocations and never time out.
- Dynamic CORS supports Vercel preview domains (`*.vercel.app`) automatically.

---

### Step-by-Step Vercel Deployment:

#### Option A: Deploy via Vercel Web Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com/) and click **"Add New..."** -> **"Project"**.
2. Select your repository: **`mirjaj-ajij-milon/Vionex`**.
3. Under **Project Settings**:
   - **Framework Preset**: Choose **`Other`**.
   - **Root Directory**: Click **"Edit"** and select **`backend`**.
4. Expand **Environment Variables** and add the following:
   - `NODE_ENV` = `production`
   - `MONGO_URL` = Your production MongoDB Atlas connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/vionex?retryWrites=true&w=majority`)
   - `CLIENT_ORIGIN` = Your production frontend URL (e.g. `https://vionex.vercel.app` or `https://vionex.netlify.app`)
5. Click **"Deploy"**.
6. When deployment finishes, your backend REST API is live at `https://your-backend-project.vercel.app`!
   - Test it by opening `https://your-backend-project.vercel.app/` or `https://your-backend-project.vercel.app/health` in your browser.

---

#### Option B: Deploy via Vercel CLI

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to the backend directory
cd backend

# 3. Deploy to production
vercel --prod
```
During CLI setup:
- Select the project settings or accept defaults.
- Add your environment variables with `vercel env add MONGO_URL`.

---

## 🌐 Deploying Frontend to Vercel or Netlify

### Deploying Frontend on Vercel:
1. In Vercel, click **"Add New Project"** and select the same **`Vionex`** repository.
2. Under **Root Directory**: Click **"Edit"** and choose **`frontend`**.
3. Framework Preset will be automatically detected as **`Vite`**.
4. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-backend-project.vercel.app` (or your backend server URL)
5. Click **"Deploy"**.

### Deploying Frontend on Netlify:
1. In Netlify, import the GitHub repo **`Vionex`**.
2. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-project.vercel.app`
4. Click **"Deploy"**. (A `frontend/public/_redirects` file is pre-configured to handle SPA routing).

---

## 🔄 Persistent WebRTC Signaling Server (Socket.IO Guide)

### Understanding Serverless vs WebSockets:
- **REST APIs on Vercel**: Authentication, login, signup, user meeting history, and health checks run with zero cold-delay and global caching on Vercel Serverless.
- **WebRTC Signaling via WebSockets**: Vercel Serverless Functions execute per request (with a 10–15 second max duration) and do not support long-lived, continuous bidirectional TCP WebSocket connections.
- For local development, `npm run dev` in `backend` runs both Express REST and Socket.IO signaling together on `http://localhost:8080`.
- For production WebRTC video calling with Socket.IO, keep your real-time signaling server on a persistent hosting platform (such as **Render**, **Railway**, **Fly.io**, or an **Ubuntu VPS**):

### 1-Click Deploy Signaling Server to Render:
1. Go to [render.com](https://render.com) and create a **Web Service**.
2. Connect `https://github.com/mirjaj-ajij-milon/Vionex`.
3. Set **Root Directory** to `backend`.
4. Set **Build Command**: `npm install`.
5. Set **Start Command**: `npm start`.
6. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `MONGO_URL` = your MongoDB connection string
   - `CLIENT_ORIGIN` = your deployed frontend URL
7. Click **"Create Web Service"**. Render will provide a 24/7 persistent WebSocket endpoint (e.g. `https://vionex-backend.onrender.com`).

---

## 📡 REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` HTTP header.

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | No | API status, version information, and documentation links |
| `GET` | `/health` | No | Service health check with MongoDB connection status |
| `POST` | `/api/users/register` | No | Creates a new user account with bcrypt encrypted password |
| `POST` | `/api/users/login` | No | Validates credentials and returns a 30-day session token |
| `POST` | `/api/users/logout` | Yes | Revokes and destroys active session token |
| `GET` | `/api/users/get_all_activity` | Yes | Returns paginated list of user's past meetings |
| `POST` | `/api/users/add_to_activity` | Yes | Saves a meeting code to user's history |
| `GET` | `/api/users/ice_config` | No | Returns dynamic STUN & TURN server configurations |

---

## 🧪 Automated Testing & Verification

Vionex includes zero-external-dependency automated test suites using the Node.js native test runner (`node:test`).

### Run All Tests (Root Monorepo):
```bash
npm test
```

### Run Backend Tests:
```bash
npm run test:backend
# or:
cd backend && npm test
```

### Run Frontend Tests:
```bash
npm run test:frontend
# or:
cd frontend && npm test
```

### Frontend Code Quality & Build Verification:
```bash
cd frontend
npm run lint    # ESLint verification (0 errors)
npm run build   # Production bundle verification with chunk splitting
```

---

## ❓ Troubleshooting & FAQs

### Q1: My Vercel backend deployment shows `Database connection failed`.
- **Solution**: Ensure you have added the `MONGO_URL` environment variable in your Vercel Project Settings (`Settings` -> `Environment Variables`). Ensure your MongoDB Atlas cluster has IP whitelist set to allow all IPs (`0.0.0.0/0`) since Vercel serverless uses dynamic cloud IP addresses.

### Q2: Why are `.env` files not appearing in GitHub?
- **Solution**: This is by design! `.gitignore` explicitly prevents sensitive database passwords and tokens from being exposed publicly. Copy `.env.example` to configure your local or deployment settings.

### Q3: How do I invite someone to a meeting?
- **Solution**: Once inside a meeting or on the "Ready to Join" lobby, click the **"Copy Meeting Link"** or share the 6-character room code. The other participant can simply paste the URL or enter the room code on the landing page.

---

## 📄 License & Author

- **Author**: Mirjaj Ajij Milon ([GitHub](https://github.com/mirjaj-ajij-milon))
- **Repository**: [https://github.com/mirjaj-ajij-milon/Vionex](https://github.com/mirjaj-ajij-milon/Vionex)
- **License**: ISC License — open for personal and commercial usage.
