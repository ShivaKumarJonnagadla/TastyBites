# 🍛 Tasty Bites — Authentic Indian Food

> Finger licking homemade Indian food for Indian and Swedish food lovers in Malmö, Sweden.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tastybites)

---

## ✨ Features

### Customer Experience
- 🏠 Beautiful landing page with hero banner and animations
- 📋 Daily Menu & Friday Special Menu
- 🔍 Search, filter by category, vegetarian, spice level
- 🛒 Animated cart drawer with quantity management
- 💳 Checkout with Swish QR code or Cash payment
- 🎉 Confetti celebration on order confirmation
- 📱 Mobile-first PWA — installable on phones
- 🌐 English & Swedish language support

### Admin Panel (`/admin`)
- 📊 Dashboard with revenue stats and recent orders
- 🍽️ Full dish management (create/edit/delete/toggle)
- 📦 Order management with status tracking
- 📥 Excel export for orders and revenue reports
- 📱 WhatsApp promotional message generator
- 🎨 Friday menu preview card
- ⚙️ Business settings management

### Technical
- 🔒 JWT auth, bcrypt, Helmet, rate limiting, Zod validation
- 🗄️ PostgreSQL (Neon) + Prisma ORM with migrations
- 🖼️ Cloudinary image uploads with optimization
- 📧 Resend for transactional emails
- 🐳 Docker Compose for local development
- ☁️ Vercel deployment (free tier)

---

## 🏗️ Architecture

```
TastyBites/
├── apps/
│   ├── frontend/          # React + Vite + TypeScript + TailwindCSS
│   └── backend/           # Node.js + Express + TypeScript + Prisma
├── packages/
│   └── shared/            # Shared types, constants, validation
├── docker/                # Dockerfiles + nginx config
├── docker-compose.yml     # Local dev environment
└── README.md
```

**Free Hosting Stack:**
| Service | Provider | Plan |
|---------|----------|------|
| Frontend | Vercel | Free |
| Backend API | Vercel Serverless | Free |
| Database | Neon PostgreSQL | Free |
| Images | Cloudinary | Free |
| Emails | Resend | Free |
| Analytics | Plausible | Free |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm 9+

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/tastybites.git
cd tastybites
npm install
```

### 2. Set Up Environment Variables

**Backend** (`apps/backend/.env`):
```env
DATABASE_URL="postgresql://tastybites:tastybites123@localhost:5432/tastybites"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
RESEND_API_KEY="re_xxxx"
FRONTEND_URL="http://localhost:5173"
PORT=3001
NODE_ENV=development
```

**Frontend** (`apps/frontend/.env.local`):
```env
VITE_API_URL=""  # Empty = use Vite proxy to localhost:3001
```

### 3. Start with Docker
```bash
docker compose up
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API Health: http://localhost:3001/health

### 4. Or Start without Docker
```bash
# Start PostgreSQL separately, then:
cd apps/backend
npx prisma migrate dev
npx prisma db seed
npm run dev

# In another terminal:
cd apps/frontend
npm run dev
```

---

## 🗄️ Database Setup (Neon)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project: "tastybites"
3. Copy the connection string
4. Add to `DATABASE_URL` in `.env`
5. Run migrations:
```bash
cd apps/backend
npx prisma migrate deploy
npx prisma db seed
```

---

## 🖼️ Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Copy Cloud Name, API Key, API Secret
3. Add to backend `.env`

---

## 📧 Resend Setup

1. Create account at [resend.com](https://resend.com)
2. Create an API key
3. Add `RESEND_API_KEY` to backend `.env`

---

## ☁️ Vercel Deployment

### Deploy Backend
```bash
cd apps/backend
npx vercel --prod
```
Set environment variables in Vercel dashboard:
- `DATABASE_URL` (Neon connection string)
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `FRONTEND_URL` (your frontend Vercel URL)
- `NODE_ENV=production`

### Deploy Frontend
```bash
cd apps/frontend
npx vercel --prod
```
Set environment variables:
- `VITE_API_URL` (your backend Vercel URL + `/api`)

---

## 🔐 Admin Access

- **URL**: `/admin`
- **Username**: `admin`
- **Password**: `TastyBites@2024!`
- **Email**: shivatsastra@gmail.com

Change password via Settings → Change Password in the admin panel.

---

## 📊 Database Schema

```
AdminUsers    → Admin panel users
Dishes        → Food menu items (with soft delete)
Orders        → Customer orders (with order merging logic)
OrderItems    → Individual items in each order
Settings      → Key-value store for app configuration
PickupMessages → Configurable pickup instructions
```

**Key Business Logic:**
- If the same mobile number places an order on the same day, orders are **merged** (quantities combined)
- Dishes support **soft delete** (deletedAt field)
- All prices stored as `Decimal(10,2)` in SEK

---

## 🔌 API Reference

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dishes` | Get all dishes (filterable) |
| GET | `/api/dishes/:id` | Get single dish |
| POST | `/api/orders` | Place new order |
| GET | `/api/settings` | Get app settings |
| GET | `/api/settings/pickup-messages` | Get pickup messages |
| GET | `/health` | Health check |

### Admin Endpoints (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get current admin |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/dishes` | Create dish |
| PUT | `/api/dishes/:id` | Update dish |
| DELETE | `/api/dishes/:id` | Delete dish |
| PATCH | `/api/dishes/:id/availability` | Toggle availability |
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/stats` | Revenue stats |
| GET | `/api/orders/export` | Export to Excel |
| PATCH | `/api/orders/:id/status` | Update order status |
| GET | `/api/admin/whatsapp-message` | Generate WhatsApp promo |
| GET | `/api/admin/friday-menu-image` | Generate menu data |
| POST | `/api/upload` | Upload image to Cloudinary |

---

## 🌐 Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English | `en` | ✅ Full |
| Swedish | `sv` | ✅ Full |

Language auto-detected from browser, saved in localStorage.

---

## 📱 PWA Features

- Installable on iOS and Android
- Offline-capable (static assets cached)
- Cloudinary images cached for 7 days
- App icon and splash screen

---

## 🔒 Security

- JWT tokens (7 day expiry)
- bcrypt password hashing (12 rounds)
- Helmet security headers
- Rate limiting (100 req/15min general, 10 orders/hour)
- Zod input validation
- SQL injection prevention via Prisma
- CORS configured per environment
- Secure file upload (type + size validation)
- Soft deletes for data integrity

---

## 🐳 Docker Commands

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# View logs
docker compose logs -f backend

# Rebuild after changes
docker compose up --build

# Stop everything
docker compose down

# Remove volumes (reset database)
docker compose down -v
```

---

## 🌱 Seeding the Database

```bash
cd apps/backend
npx ts-node prisma/seed.ts
```

Seeds:
- Admin user (admin/admin123456)
- 8 sample dishes (biryani, curry, samosa, naan, etc.)
- Default pickup message
- Default app settings

---

## 📦 Tech Stack Details

**Frontend:**
- React 18 + Vite 5 + TypeScript
- TailwindCSS (custom spice/saffron/turmeric color palette)
- Framer Motion (animations)
- Zustand (cart + auth state)
- React Hook Form + Zod (form validation)
- React Router v6 (routing)
- i18next (EN/SV translations)
- canvas-confetti (order celebration)

**Backend:**
- Express.js + TypeScript
- Prisma ORM (PostgreSQL)
- JWT + bcrypt (auth)
- Multer + Cloudinary (image uploads)
- ExcelJS (order exports)
- Winston (logging)
- express-rate-limit + Helmet (security)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use for your own food business!

---

## 🙏 Made With Love

Made with ❤️ for Indian and Swedish food lovers in Malmö, Sweden.

*"Taste India in every bite"* 🌶️🍛
