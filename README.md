# 🐝 TaskHive — Freelance Micro-Task Marketplace for Students

A full-stack MERN application where students can post micro-tasks, bid on projects, complete work, and manage earnings through a built-in wallet system.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts, Socket.IO Client |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Realtime | Socket.IO |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## ✨ Features

### 🔐 Authentication
- JWT-based login/register/logout
- Role-based access: `student` and `admin`
- Protected routes on both frontend and backend
- Password hashing with bcryptjs

### 🧾 Task Management
- Create, edit, delete tasks
- Filter by category, budget, skills, deadline, status
- Task statuses: Open → In Progress → Completed / Cancelled
- Full-text search

### 💰 Bidding System
- Place bids with amount, message, delivery days
- Task owner accepts one bid → escrow locked, task moves to In Progress
- Withdraw pending bids
- Real-time bid notifications via Socket.IO

### 💳 Wallet & Escrow
- Every user starts with $100 welcome balance
- Escrow: funds locked on bid acceptance, released on completion
- Deposit / withdraw (mock payment)
- Full transaction history with references

### ⭐ Reviews & Ratings
- Post-completion: both parties can rate each other (1–5 stars)
- Average rating stored and displayed on profiles

### 🧠 Smart Recommendations
- Skill-based task matching
- Category-based suggestions from past work
- Trending/popular fallback

### 💬 Real-time Chat
- Socket.IO messaging between users
- Typing indicators
- Conversation list with unread counts

### 📊 Dashboard & Analytics
- Earnings area chart (Recharts)
- Task status donut chart
- Active bids, posted tasks, wallet summary

### 🛡️ Admin Panel
- Platform stats overview with charts
- User management (view, ban/unban)
- Task monitoring (view, delete)
- Transaction ledger

---

## 📁 Project Structure

```
taskhive/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Business logic
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   ├── bidController.js
│   │   ├── walletController.js
│   │   ├── reviewController.js
│   │   ├── messageController.js
│   │   ├── adminController.js
│   │   ├── recommendationController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT protect/adminOnly
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Bid.js
│   │   ├── Transaction.js
│   │   ├── Review.js
│   │   └── Message.js
│   ├── routes/          # RESTful route definitions
│   ├── utils/
│   │   ├── seed.js      # Database seeder
│   │   └── socket.js    # Socket.IO setup
│   ├── .env.example
│   ├── render.yaml      # Render deployment config
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/Navbar.js
│   │   ├── context/
│   │   │   ├── AuthContext.js   # Global auth state
│   │   │   └── SocketContext.js # Socket.IO context
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── TaskList.js
│   │   │   ├── TaskDetail.js
│   │   │   ├── CreateTask.js
│   │   │   ├── EditTask.js
│   │   │   ├── Profile.js
│   │   │   ├── WalletPage.js
│   │   │   ├── ChatPage.js
│   │   │   └── AdminPanel.js
│   │   ├── utils/api.js         # Axios instance + interceptors
│   │   ├── App.js               # Router + protected routes
│   │   └── index.css            # Global design system
│   ├── .env.example
│   └── vercel.json
│
├── package.json         # Root scripts (dev, seed, build)
└── README.md
```

---

## ⚡ Quick Start (Local)

### 1. Clone & Install

```bash
git clone https://github.com/yourname/taskhive.git
cd taskhive
npm install          # installs concurrently
npm run install:all  # installs backend + frontend deps
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env:
#   MONGO_URI=mongodb://localhost:27017/taskhive   (or Atlas URI)
#   JWT_SECRET=your_random_secret_here
#   CLIENT_URL=http://localhost:3000

# Frontend
cp frontend/.env.example frontend/.env
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Seed the Database

```bash
npm run seed
```

This creates 6 users, 10 tasks, 5 bids, reviews and transactions.

**Demo Login Credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@taskhive.com | Admin@123456 |
| Student | alex@student.edu | password123 |
| Student | sara@student.edu | password123 |
| Student | raj@student.edu | password123 |

### 4. Run Development Servers

```bash
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

---

## 🌍 Deployment

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo → set **Root Directory** to `backend`
4. **Build command:** `npm install`
5. **Start command:** `npm start`
6. Add environment variables:
   - `MONGO_URI` → your Atlas URI
   - `JWT_SECRET` → random string (32+ chars)
   - `CLIENT_URL` → your Vercel frontend URL
   - `NODE_ENV` → `production`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import repo → set **Root Directory** to `frontend`
3. Add environment variables:
   - `REACT_APP_API_URL` → `https://your-backend.onrender.com/api`
   - `REACT_APP_SOCKET_URL` → `https://your-backend.onrender.com`
4. Deploy!

### Database → MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
2. Add a database user
3. Whitelist IP `0.0.0.0/0` (allow all for Render)
4. Get your connection string and paste into `MONGO_URI`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks (filters) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get single task + bids |
| PUT | `/api/tasks/:id` | Edit task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/:id/complete` | Mark complete, release escrow |
| PATCH | `/api/tasks/:id/cancel` | Cancel task |

### Bids
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bids` | Place bid |
| GET | `/api/bids/my` | My bids |
| PATCH | `/api/bids/:id/accept` | Accept bid + lock escrow |
| DELETE | `/api/bids/:id` | Withdraw bid |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet` | Balance + transactions |
| POST | `/api/wallet/deposit` | Add funds |
| POST | `/api/wallet/withdraw` | Withdraw funds |

### Other
- `GET /api/recommendations` — Smart task recommendations
- `POST /api/reviews` — Submit review
- `GET /api/messages/conversations` — All conversations
- `GET/POST /api/messages/:userId` — Get/send messages
- `GET /api/admin/stats` — Admin dashboard (admin only)

---

## 🎨 Design System

- Dark theme with CSS variables
- Accent color: `#7c6af7` (purple)
- Status colors: green (open), amber (in progress), blue (completed), red (cancelled)
- Font: Inter (system fallback)

---

## 📝 License

MIT — Free to use and modify.
