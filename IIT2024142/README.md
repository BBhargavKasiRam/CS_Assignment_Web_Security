<div align="center">

<img src="https://img.shields.io/badge/BIDVORA-Luxury%20Auction%20Platform-C9A84C?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIj48cGF0aCBkPSJNMTQgMTJhMiAyIDAgMCAxLTIgMiAyIDIgMCAwIDEtMi0yIDIgMiAwIDAgMSAyLTIgMiAyIDAgMCAxIDIgMnoiLz48L3N2Zz4=" alt="Bidvora Banner"/>

# BIDVORA

### 🏛️ A Real-Time Luxury Auction Platform

*Bringing the prestige of Christie's & Sotheby's to the web — with live bidding, AI auto-bidding, and seller analytics.*

<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Aiven%20Cloud-4479A1?style=flat-square&logo=mysql)](https://aiven.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=flat-square&logo=cloudinary)](https://cloudinary.com/)

<br/>

[Live Demo](#) · [API Docs](#api-reference) · [Database Schema](#database-schema)

</div>

---

## 📌 Table of Contents

- [About The Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Networking Concepts Applied](#networking-concepts-applied)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Engineering Decisions](#key-engineering-decisions)

---

## About The Project

**Bidvora** is a full-stack, production-grade auction platform that enables live, competitive bidding on rare and luxury items. It replicates the core systems of high-end auction houses — real-time price discovery, automated bidding agents, fraud oversight via mediators, integrated payments, and seller performance analytics.

> **Built to demonstrate:** Full-stack architecture, real-time WebSocket systems, REST API design, JWT authentication, role-based access control, cloud integrations, and data-driven dashboards.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite | Component-based SPA |
| **Styling** | Tailwind CSS + Framer Motion | Responsive UI & animations |
| **Charts** | Recharts | Seller analytics visualizations |
| **Backend** | Node.js + Express.js | REST API server |
| **Real-time** | Socket.IO | WebSocket-based live bidding & chat |
| **Database** | MySQL (Aiven Cloud) | Relational data storage |
| **Auth** | JWT + bcrypt | Stateless authentication |
| **OAuth** | Firebase (Google Sign-In) | Third-party login |
| **Media** | Cloudinary CDN | Auction item & profile images |
| **Payments** | Stripe | Secure payment processing |
| **Email** | Nodemailer | Password reset, notifications |
| **Deployment** | Render (API) + Vercel (Frontend) | Cloud hosting |

---

## Core Features

### 🔴 1. Real-Time Live Auction Engine
The heart of Bidvora — every auction room is a **live WebSocket session**.

- **Instant bid broadcasting**: When any user places a bid, every participant in that auction room sees it within milliseconds — no page refresh needed.
- **Live countdown timer**: Synchronized across all connected clients.
- **Anti-Snipe Protection**: If a bid is placed in the **last 3 minutes**, the timer automatically extends by 3 minutes. This prevents last-second sniping and drives up final sale prices — a mechanism used by major auction houses.
- **Live viewer count**: Real-time count of how many users are currently watching.
- **Bid history**: Full chronological log of every bid placed, with timestamps and user names.

**Implementation:** Socket.IO rooms (`auction:${id}`), server-side timer extension logic, `JOIN`/`LEAVE` room events.

---

### 🤖 2. Automated Proxy Bidding (AI Auto-Bid)
Users set a **maximum price limit** — the system bids for them automatically.

- Buyers set their maximum once and leave — the system handles everything.
- Auto-bids in **$10 increments**, only bidding enough to stay in the lead.
- Caps exactly at the user's maximum — never exceeds it.
- **Auto-bid announcements** appear in the live chat: `"Auto-bid of $X placed for [Name]"`.
- Buyers can view or **revoke** their proxy bid at any time.

**Why this matters:** Maximizes final sale price for sellers and reduces buyer stress.

**Implementation:** After every manual bid, `bidController.js` queries `proxy_bids` table for competing proxies and fires counter-bids via Socket.IO.

---

### 📊 3. Seller Analytics Dashboard
A professional, data-driven dashboard for consignors.

| Metric | Description |
|---|---|
| Total Revenue | Sum of all final sale prices |
| Active Listings | Currently live auctions |
| Avg. Sale Price | Mean final price across completed auctions |
| Win Rate | % of auctions that received bids above starting price |
| Revenue Over Time | 6-month area chart (Recharts) |
| Auctions Per Month | Bar chart with current month highlighted |
| Top 5 Items | Highest-earning items ranked with sale price |
| Trust Score | Aggregate star rating from buyer reviews |

**Implementation:** 3-query SQL aggregation pipeline (summary stats → monthly revenue → top items), Recharts `AreaChart` and `BarChart`.

---

### ⭐ 4. Post-Auction Rating & Review System
A trust infrastructure for the marketplace.

- After winning and paying, buyers rate the seller **1–5 stars** + written review.
- Aggregate **"Trust Score"** calculated from all reviews.
- Displayed on:
  - Auction detail page (seller's "Curated By" section)
  - Gallery auction cards (star row under seller name)
  - Seller's profile page (badge + full review list)
  - Seller analytics dashboard

**Implementation:** `reviews` table with `reviewer_id` and `reviewee_id`, `ReviewModal` component with animated star selector, `GET /api/reviews/:userId` returns `{ averageRating, totalReviews, reviews[] }`.

---

### 🛡️ 5. Multi-Role Access Control
Four distinct roles with completely different dashboards and permissions.

| Role | Access |
|---|---|
| **Buyer** | Browse, bid, pay, track shipment, leave reviews |
| **Consignor** | Create auctions, analytics dashboard, manage listings |
| **Auctioneer** | Platform-wide management, assign mediators, oversee auctions |
| **Mediator** | Monitor live rooms, flag issues, accept/reject assignments |

**Implementation:** Role stored in JWT payload, checked in `authMiddleware` and on each protected route, reflected in conditional navbar rendering.

---

### 💬 6. Live Auction Chat
Every auction room has a persistent, real-time chat.

- Chat history loads from the database when you enter a room.
- New messages broadcast instantly via Socket.IO.
- **System messages** auto-post for key events: new bids, proxy bids, timer extensions.
- Each user gets a unique display color based on their user ID.
- Messages flagged with `is_system_message` for styled differentiation.

---

### 💳 7. Stripe Payment Integration
End-to-end payment flow for winning bidders.

- Winner receives **"Secure Payment"** prompt on Orders page.
- Stripe **PaymentIntent** created server-side.
- Payment confirmed client-side via `@stripe/stripe-js`.
- On success: `payment_status` updated to `'Paid'`, shipment tracking unlocks.

---

### 📦 8. Order Management System
Complete post-auction workflow.

- **Track Shipment**: Modal with shipment status timeline.
- **Download Invoice**: Auto-generated invoice with auction details, buyer/seller info, and final price.
- **Leave Review**: Unlocks after payment confirmed.
- **"Guaranteed by Bidvora"** trust badge on paid orders.

---

### 🔐 9. Secure Authentication System
- **Multi-step registration/login**: Email check → password entry (prevents enumeration on wrong step).
- **bcrypt** password hashing (salt rounds: 10).
- **JWT** tokens — stateless, signed with server secret, 24-hour expiry.
- **Google OAuth** via Firebase — single-click login.
- **Forgot Password** → Nodemailer sends reset link with signed token.
- **Reset Password** → token verified before allowing new password.
- **Profile update** with Cloudinary image upload.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        CLIENT                            │
│   React 18 + Vite │ TailwindCSS │ Framer Motion         │
│   Socket.IO Client │ Recharts │ Stripe.js │ Firebase     │
└──────────────┬───────────────────────────┬───────────────┘
               │  HTTP/REST (port 3000)    │ WebSocket
               ▼                           ▼
┌──────────────────────────────────────────────────────────┐
│                      SERVER (port 5000)                  │
│   Express.js  │  Socket.IO  │  JWT Middleware            │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Auth    │ │ Auctions │ │   Bids   │ │ Reviews  │   │
│  │ Routes   │ │  Routes  │ │  Routes  │ │  Routes  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Orders   │ │ Payments │ │  Chat    │ │Mediator  │   │
│  │ Routes   │ │  Routes  │ │  Routes  │ │  Routes  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└──────────────────────────┬───────────────────────────────┘
                           │
          ┌────────────────┼─────────────────┐
          ▼                ▼                 ▼
   ┌──────────┐    ┌──────────────┐   ┌───────────────┐
   │  MySQL   │    │  Cloudinary  │   │    Stripe     │
   │  Aiven   │    │     CDN      │   │   Payments    │
   └──────────┘    └──────────────┘   └───────────────┘
```

---

## Database Schema

```sql
-- Core Tables
users         (id, name, email, password, role, profile_image, rating, created_at)
auctions      (id, seller_id, title, description, starting_price, current_price,
               end_time, image, mediator_id, mediator_status, mediator_commission, status)
bids          (id, auction_id, user_id, amount, created_at)
proxy_bids    (id, auction_id, user_id, max_bid_amount, created_at)

-- Commerce
orders        (id, auction_id, buyer_id, seller_id, price, payment_status, won_at)
transactions  (id, auction_id, winner_id, final_price, created_at)

-- Trust
reviews       (id, auction_id, reviewer_id, reviewee_id, rating, comment, created_at)

-- Communication
chat_messages (id, auction_id, user_id, message, is_system_message, created_at)

-- Moderation
mediator_actions (id, auction_id, mediator_id, action_type, target_user_id, note)
muted_users      (id, auction_id, user_id, muted_by, created_at)
```

---

## API Reference

```
AUTH
  POST   /api/auth/register              Register a new user
  POST   /api/auth/login                 Login with email + password
  POST   /api/auth/google                Google OAuth login
  POST   /api/auth/check-login-email     Pre-check if email exists
  POST   /api/auth/forgot-password       Send password reset email
  POST   /api/auth/reset-password        Set new password via token
  PUT    /api/auth/profile               Update name / profile image

AUCTIONS
  GET    /api/auctions                   Get all active auctions
  POST   /api/auctions                   Create auction (consignor)
  GET    /api/auctions/:id               Get single auction details
  GET    /api/auctions/seller-analytics  Seller dashboard data (auth)
  PUT    /api/auctions/:id/mediator-status

BIDS
  POST   /api/bids                       Place a manual bid (auth)
  GET    /api/bids/:auctionId            Get bid history for an auction
  POST   /api/bids/proxy                 Set proxy/auto-bid (auth)
  GET    /api/bids/proxy/:auctionId      Get your current proxy bid (auth)
  DELETE /api/bids/proxy/:auctionId      Remove proxy bid (auth)

REVIEWS
  POST   /api/reviews                    Submit a review (auth, buyer)
  GET    /api/reviews/:userId            Get seller trust score + review list

ORDERS
  GET    /api/orders                     My won auctions (auth)
  PUT    /api/orders/:id/payment-status  Update payment status

PAYMENTS
  POST   /api/payments/create-intent     Create Stripe PaymentIntent
  POST   /api/payments/confirm           Confirm payment

CHAT
  GET    /api/chat/:auctionId            Load chat history for auction room

MEDIATOR
  GET    /api/mediator/auctions          Get auctions assigned to mediator (auth)
```

---

## Networking Concepts Applied

| CN Concept | Where Applied in Bidvora |
|---|---|
| **Client-Server Architecture** | React client ↔ Express server via HTTP |
| **TCP (Transport Layer)** | Reliable, ordered delivery of all bids and payments |
| **HTTP/HTTPS (Application Layer)** | All REST API calls — GET, POST, PUT, DELETE |
| **WebSockets (Full-Duplex)** | Live bidding, chat, viewer count via Socket.IO |
| **CORS** | Cross-origin policy configured between ports 3000 and 5000 |
| **JWT (Stateless Auth)** | Token sent in `Authorization` header on every request |
| **SSL/TLS Encryption** | Encrypted data in transit for payments (Stripe) |
| **DNS Resolution** | Domain mapping on Render and Vercel deployment |
| **Port Multiplexing** | Frontend: 3000 · Backend: 5000 · DB: Aiven remote port |
| **CDN (Edge Delivery)** | Cloudinary delivers images from nearest geographic edge server |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MySQL database (local or Aiven cloud)
- Cloudinary account
- Stripe account

### Installation

```bash
# Clone the repository
git clone https://github.com/Yasaswi292006/bidvora.git
cd bidvora

# Backend setup
cd backend
npm install
cp .env.example .env   # Fill in your credentials
npm start

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables (`backend/.env`)

```env
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=bidvora
DB_PORT=3306

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=your_stripe_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

FRONTEND_URL=http://localhost:3000
```

---

## Project Structure

```
bidvora/
├── backend/
│   ├── server.js                  # Express app + Socket.IO bootstrap
│   ├── config/db.js               # MySQL connection pool
│   ├── middleware/auth.js         # JWT verification middleware
│   ├── controllers/
│   │   ├── authController.js      # Register, login, OAuth, password reset
│   │   ├── auctionController.js   # CRUD + seller analytics queries
│   │   ├── bidController.js       # Manual bids + proxy auto-bid engine
│   │   ├── reviewController.js    # Submit & aggregate reviews
│   │   ├── chatController.js      # Chat message persistence
│   │   ├── mediatorController.js  # Mediator assignment & actions
│   │   └── proxyBidController.js  # Proxy bid CRUD
│   ├── routes/                    # 10 route files (auth, auctions, bids, ...)
│   └── sockets/                   # Socket.IO event handlers
│
└── frontend/src/
    ├── App.jsx                    # React Router root (15 routes)
    ├── context/AuthContext.jsx    # Global auth state (useContext + localStorage)
    ├── lib/
    │   ├── api.js                 # Centralized fetch wrapper with auth headers
    │   ├── socket.js              # Socket.IO singleton client
    │   └── firebase.js            # Google OAuth configuration
    ├── components/
    │   ├── Navbar.jsx             # Role-aware navigation
    │   ├── AuctionCard.jsx        # Gallery card with live timer + trust score
    │   ├── LiveChat.jsx           # Real-time chat panel
    │   ├── ReviewModal.jsx        # Animated star rating modal
    │   ├── PaymentModal.jsx       # Stripe payment flow
    │   ├── TrackingModal.jsx      # Shipment status tracker
    │   └── InvoiceModal.jsx       # Order invoice viewer
    └── pages/
        ├── LandingPage.jsx
        ├── LoginPage.jsx / RegisterPage.jsx
        ├── AuctionDetailPage.jsx  # Live auction room (core feature page)
        ├── SellerAnalyticsPage.jsx
        ├── OrdersPage.jsx
        ├── ProfilePage.jsx
        ├── MediatorDashboardPage.jsx
        └── AuctioneerDashboardPage.jsx
```

---

## Key Engineering Decisions

| Decision | Rationale |
|---|---|
| **Socket.IO over SSE/Long-Poll** | True bidirectional communication — server pushes bids AND receives chat in the same connection |
| **JWT over Sessions** | Stateless — backend can scale horizontally without a shared session store |
| **Proxy bid runs inside `bidController`** | Keeps auto-bid atomic with the manual bid — fires in the same request cycle, no race conditions |
| **Aiven MySQL over local DB** | Production-grade cloud DB with SSL; demonstrates deployment experience |
| **Recharts over Chart.js** | Native React integration, smaller bundle, simpler responsive config |
| **Cloudinary over S3** | Automatic image transformation (resize, compress, format); free tier sufficient for demo |
| **Multi-step login/register** | Email pre-check on step 1 prevents user enumeration; better UX than one long form |

---

