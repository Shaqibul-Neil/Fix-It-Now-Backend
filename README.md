<div align="center">

# 🔧 FixItNow — Home Services Marketplace API

**A production-grade REST API for booking on-demand home service technicians — plumbing, electrical, cleaning, painting, and more.**

Customers browse services and book qualified technicians. Technicians publish service profiles, manage availability, and handle jobs. Admins oversee the platform, moderate content, and manage users.

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Zod](https://img.shields.io/badge/Zod-4.x-3E67B1?logo=zod&logoColor=white)](https://zod.dev)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](#-license)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [NPM Scripts](#-npm-scripts)
- [Authentication & Authorization](#-authentication--authorization)
- [Response Format](#-response-format)
- [API Reference](#-api-reference)
- [Deployment](#-deployment-vercel)
- [License](#-license)

---

## 🧭 Overview

FixItNow is a multi-role home-services marketplace backend. It exposes a versioned REST API mounted under `/api`, backed by PostgreSQL via Prisma, secured with JWT access/refresh tokens, and fully validated with Zod. Interactive API docs are served through Swagger UI.

| | |
|---|---|
| **Base URL (local)** | `http://localhost:3000` |
| **API Prefix** | `/api` |
| **API Docs (Swagger)** | `GET /api/docs` |
| **Health / Welcome** | `GET /` |
| **Auth** | JWT (access + refresh), HTTP-only cookies |
| **Roles** | `CUSTOMER`, `TECHNICIAN`, `ADMIN` |

---

## ✨ Key Features

### 👤 Customer
- Register, log in, refresh session, view profile
- Browse technicians, services, and categories (public)
- Create bookings, cancel bookings, view booking history & details
- Pay for bookings via SSLCommerz gateway; view payment history
- Leave, edit, and delete reviews; view own reviews
- Manage a personal profile (address, city, area, avatar)

### 🛠️ Technician
- Create & update a service profile (bio, hourly rate, location, experience)
- Publish, update, and delete services under categories
- Set weekly availability slots (per day, start/end time)
- View incoming bookings and update their status (accept / decline / progress / complete)

### 🛡️ Admin
- Manage service categories (create / update / delete)
- List & moderate all users (ban / activate)
- View all bookings and all payments across the platform
- Moderate reviews (publish / hide / reject)

### ⚙️ Platform
- Layered, modular architecture (route → controller → service)
- Centralized error handling (Zod, Prisma, custom `AppError`)
- Request validation on every mutating endpoint
- Role-based access control middleware
- Pagination & filtering on list endpoints
- OpenAPI 3 documentation via Swagger UI

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (ESM) |
| **Language** | TypeScript 6 (strict) |
| **Framework** | Express 5 |
| **ORM** | Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) |
| **Database** | PostgreSQL |
| **Validation** | Zod 4 |
| **Auth** | jsonwebtoken, bcryptjs, cookie-parser |
| **Payments** | SSLCommerz (via `axios`) |
| **Docs** | swagger-ui-express (OpenAPI 3) |
| **Dev Tooling** | tsx, tsup, dotenv |

---

## 🏗️ Architecture

Each feature is a self-contained **module**. A declarative route registry mounts every module under `/api`.

```
Request
  │
  ▼
CORS → JSON/urlencoded parser → cookie-parser
  │
  ▼
Router (/api)  ──►  Route module  ──►  [authenticate] ──► [authorize(role)] ──► [validateRequest(zod)] ──► Controller
                                                                                                              │
                                                                                                              ▼
                                                                                                          Service (business logic)
                                                                                                              │
                                                                                                              ▼
                                                                                                          Prisma  ──►  PostgreSQL
  │
  ▼
notFound handler → globalErrorHandler → JSON response
```

**Request pipeline per protected route:** `authenticate` → `authorize(...roles)` → `validateRequest(schema)` → `controller` → `service`.

---

## 📂 Project Structure

```
fix-it-now-backend/
├── prisma/
│   ├── schema/                  # Multi-file Prisma schema
│   │   ├── schema.prisma        # generator + datasource
│   │   ├── enums.prisma
│   │   ├── user.prisma
│   │   ├── customerProfile.prisma
│   │   ├── technicianProfile.prisma
│   │   ├── category.prisma
│   │   ├── service.prisma
│   │   ├── availabilitySlot.prisma
│   │   ├── booking.prisma
│   │   ├── bookingStatusHistory.prisma
│   │   ├── payment.prisma
│   │   └── review.prisma
│   └── seed.ts                  # Development seed data
├── src/
│   ├── app.ts                   # Express app (middleware + routes)
│   ├── server.ts                # Bootstraps server (local)
│   ├── config/                  # Env config
│   ├── lib/prisma.ts            # Prisma client + pg adapter
│   ├── middlewares/             # auth, authorize, validate, error handlers
│   ├── utils/                   # sendResponse, appError, jwt, cookie, asyncHandler
│   ├── docs/                    # OpenAPI schemas & paths (Swagger)
│   └── app/
│       ├── routes/              # Route registry & builder
│       └── modules/             # Feature modules
│           ├── auth/
│           ├── user/            # (admin: users)
│           ├── customer/
│           ├── technician/
│           ├── category/
│           ├── service/
│           ├── availabilitySlot/
│           ├── booking/
│           ├── payment/
│           └── review/
├── api/index.ts                 # Serverless entry (re-exports app)
├── vercel.json
├── tsconfig.json
└── package.json
```

Each module typically contains: `*.route.ts`, `*.controller.ts`, `*.service.ts`, `*.validation.ts`, plus optional `*.include.ts`, `*.mapper.ts`, `*.utils.ts`, `*.constants.ts`.

---

## 🗄️ Database Schema

**10 tables**, all UUID primary keys, `snake_case` columns, timestamps on every entity.

### Entity Relationships

```
User 1──1 CustomerProfile ──┐
User 1──1 TechnicianProfile ┤
                            │
CustomerProfile 1──* Booking *──1 TechnicianProfile
Category 1──* Service *──1 TechnicianProfile
Service 1──* Booking
Booking 1──1 Payment
Booking 1──1 Review
Booking 1──* BookingStatusHistory
TechnicianProfile 1──* AvailabilitySlot
CustomerProfile 1──* Review *──1 TechnicianProfile
```

### Tables

<details open>
<summary><b><code>users</code></b> — Root identity for every role</summary>

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `first_name` | VARCHAR(50) | |
| `last_name` | VARCHAR(50) | |
| `email` | VARCHAR(255) | Unique |
| `password_hash` | TEXT | bcrypt |
| `role` | `TRole` | Default `CUSTOMER` |
| `status` | `TUserStatus` | Default `ACTIVE` |
| `last_login_at` | TIMESTAMP | Nullable |
| `created_at` / `updated_at` | TIMESTAMP | |

</details>

<details>
<summary><b><code>customer_profiles</code></b> — Customer-specific data (1:1 with user)</summary>

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | Unique, FK → users (cascade) |
| `phone` | VARCHAR(20) | Unique, nullable |
| `avatar` | TEXT | Nullable |
| `default_address` | TEXT | Nullable |
| `city` / `area` | VARCHAR(100) | Nullable |
| `postal_code` | VARCHAR(20) | Nullable |
| `created_at` / `updated_at` | TIMESTAMP | |

</details>

<details>
<summary><b><code>technician_profiles</code></b> — Technician-specific data (1:1 with user)</summary>

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | Unique, FK → users (cascade) |
| `phone` | VARCHAR(20) | Unique |
| `avatar` | TEXT | Nullable |
| `bio` | TEXT | |
| `experience_years` | INT | |
| `hourly_rate` | DECIMAL(10,2) | |
| `address` | TEXT | |
| `city` / `area` | VARCHAR(100) | Indexed `(city, area)` |
| `is_profile_complete` | BOOLEAN | Default `false` |
| `service_radius` | INT | Nullable |
| `average_rating` | DECIMAL(3,2) | Default `0` |
| `total_reviews` | INT | Default `0` |
| `is_available` | BOOLEAN | Default `true` |
| `is_approved` | BOOLEAN | Default `false` |
| `created_at` / `updated_at` | TIMESTAMP | |

</details>

<details>
<summary><b><code>categories</code></b> — Service categories (admin-managed)</summary>

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(100) | Unique |
| `slug` | VARCHAR(120) | Unique |
| `description` | TEXT | Nullable |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` / `updated_at` | TIMESTAMP | |

</details>

<details>
<summary><b><code>services</code></b> — Services offered by technicians</summary>

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `technician_id` | UUID | FK → technician_profiles (cascade), indexed |
| `category_id` | UUID | FK → categories (restrict), indexed |
| `title` | VARCHAR(150) | |
| `description` | TEXT | Nullable |
| `price` | DECIMAL(10,2) | |
| `estimated_duration` | INT | Minutes, nullable |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` / `updated_at` | TIMESTAMP | |

</details>

<details>
<summary><b><code>availability_slots</code></b> — Technician weekly availability</summary>

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `technician_id` | UUID | FK → technician_profiles (cascade), indexed |
| `day_of_week` | `TDayOfWeek` | |
| `start_time` | VARCHAR(5) | `HH:MM` |
| `end_time` | VARCHAR(5) | `HH:MM` |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` / `updated_at` | TIMESTAMP | Unique `(technician_id, day_of_week, start_time, end_time)` |

</details>

<details>
<summary><b><code>bookings</code></b> — Core job bookings</summary>

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `customer_id` | UUID | FK → customer_profiles (cascade), indexed |
| `technician_id` | UUID | FK → technician_profiles (cascade), indexed |
| `service_id` | UUID | FK → services (restrict), indexed |
| `status` | `TBookingStatus` | Default `REQUESTED`, indexed |
| `address` | TEXT | |
| `city` / `area` | VARCHAR(100) | Nullable |
| `notes` | TEXT | Nullable |
| `amount` | DECIMAL(10,2) | |
| `scheduled_at` | TIMESTAMP | |
| `accepted_at` / `completed_at` / `cancelled_at` | TIMESTAMP | Nullable |
| `created_at` / `updated_at` | TIMESTAMP | |

</details>

<details>
<summary><b><code>booking_status_history</code></b> — Audit trail of status changes</summary>

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `booking_id` | UUID | FK → bookings (cascade), indexed |
| `status` | `TBookingStatus` | |
| `note` | TEXT | e.g. decline reason |
| `changed_by_id` | UUID | User who triggered, nullable |
| `created_at` | TIMESTAMP | |

</details>

<details>
<summary><b><code>payments</code></b> — Booking payments (SSLCommerz)</summary>

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `booking_id` | UUID | Unique, FK → bookings (cascade) |
| `customer_id` | UUID | FK → customer_profiles (cascade), indexed |
| `amount` | DECIMAL(10,2) | |
| `provider` | `TPaymentProvider` | Default `SSLCOMMERZ` |
| `status` | `TPaymentStatus` | Default `PENDING`, indexed |
| `transaction_id` | TEXT | Unique |
| `val_id` | TEXT | Gateway validation id, nullable |
| `method` | VARCHAR(50) | Nullable |
| `paid_at` | TIMESTAMP | Nullable |
| `created_at` / `updated_at` | TIMESTAMP | |

</details>

<details>
<summary><b><code>reviews</code></b> — Customer reviews of completed jobs</summary>

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `booking_id` | UUID | Unique, FK → bookings (cascade) |
| `customer_id` | UUID | FK → customer_profiles (cascade) |
| `technician_id` | UUID | FK → technician_profiles (cascade), indexed |
| `service_id` | UUID | FK → services (cascade), indexed |
| `rating` | SMALLINT | 1–5 |
| `comment` | TEXT | Nullable |
| `status` | `TReviewStatus` | Default `PENDING`, indexed |
| `created_at` / `updated_at` | TIMESTAMP | |

</details>

### Enums

| Enum | Values |
|---|---|
| `TRole` | `CUSTOMER`, `TECHNICIAN`, `ADMIN` |
| `TUserStatus` | `ACTIVE`, `BANNED` |
| `TBookingStatus` | `REQUESTED`, `ACCEPTED`, `DECLINED`, `PAID`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `TPaymentStatus` | `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED` |
| `TPaymentProvider` | `SSLCOMMERZ`, `STRIPE` |
| `TDayOfWeek` | `MONDAY` … `SUNDAY` |
| `TReviewStatus` | `PENDING`, `PUBLISHED`, `HIDDEN`, `REJECTED` |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 14+ (local or hosted — Neon / Supabase / Railway)

### Installation

```bash
# 1. Clone
git clone <your-repo-url>
cd fix-it-now-backend

# 2. Install dependencies (also runs prisma generate)
npm install

# 3. Configure environment
cp .env.example .env
#   → fill in DATABASE_URL, JWT secrets, SSL store creds

# 4. Apply the schema to your database
npx prisma db push
#   (or: npx prisma migrate dev)

# 5. Generate the Prisma client (if not already generated)
npx prisma generate

# 6. Seed development data (optional)
npm run seed

# 7. Start the dev server
npm run dev
```

Server runs at **http://localhost:3000** · Docs at **http://localhost:3000/api/docs**.

---

## 🔐 Environment Variables

Create `.env` from `.env.example`:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `PORT` | Server port | `3000` |
| `BASE_URL` | Public API URL (CORS allowlist) | `http://localhost:3000` |
| `LOCAL_URL` | Local URL (CORS allowlist) | `http://localhost:3000` |
| `APP_URL` | Frontend URL (CORS allowlist) | `http://localhost:5000` |
| `NODE_ENV` | Runtime environment | `development` / `production` |
| `JWT_ACCESS_TOKEN_SECRET` | Access token signing secret | `super-secret-access` |
| `JWT_REFRESH_TOKEN_SECRET` | Refresh token signing secret | `super-secret-refresh` |
| `JWT_ACCESS_EXPIRY` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL | `30d` |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost factor | `10` |
| `SSL_STORE_ID` | SSLCommerz store ID | `your-store-id` |
| `SSL_STORE_PASSWORD` | SSLCommerz store password | `your-store-pass` |

> ⚠️ Never commit `.env`. It is git-ignored.

---

## 📜 NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `tsx watch src/server.ts` | Start dev server with hot reload |
| `npm run build` | `tsup` | Bundle to `dist/` for production |
| `npm start` | `node dist/server.js` | Run the compiled build |
| `npm run seed` | `tsx prisma/seed.ts` | Seed the database |

---

## 🔑 Authentication & Authorization

- **Register / Login** issue a JWT **access token** and a **refresh token** (HTTP-only cookie).
- Protected routes require a valid access token: send `Authorization: Bearer <accessToken>`.
- **`/api/auth/refresh-token`** issues a new access token from the refresh cookie.
- **Role gate:** endpoints are guarded by `authorize(...roles)`. A mismatched role returns `403 Forbidden`.

| Guard | Meaning |
|---|---|
| 🌐 **Public** | No token required |
| 🔒 **Authenticated** | Any logged-in user |
| 👤 **Customer** | `CUSTOMER` role |
| 🛠️ **Technician** | `TECHNICIAN` role |
| 🛡️ **Admin** | `ADMIN` role |

---

## 📦 Response Format

### Success
```json
{
  "success": true,
  "message": "Resource fetched successfully",
  "data": { },
  "meta": { "page": 1, "limit": 10, "total": 42 }
}
```
> `meta` is present only on paginated list endpoints.

### Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errorDetails": [
    { "field": "body.email", "message": "Invalid email address" }
  ],
  "path": "/api/auth/register",
  "timestamp": "2026-07-09T12:00:00.000Z"
}
```
Errors are normalized centrally for **Zod** (validation), **Prisma** (DB constraints), custom **`AppError`**, and unknown errors.

---

## 📡 API Reference

Base path: **`/api`** · Full docs (try-it-out): **`GET /api/docs`**

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | 🌐 Public | Register a customer or technician |
| `POST` | `/api/auth/login` | 🌐 Public | Log in, receive tokens |
| `POST` | `/api/auth/refresh-token` | 🌐 Public | Refresh access token (cookie) |
| `GET` | `/api/auth/me` | 🔒 Authenticated | Get the current user |

### 👤 Customer — `/api/customer`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/customer/profile/me` | 👤 Customer | Get own customer profile |
| `PATCH` | `/api/customer/profile` | 👤 Customer | Update own customer profile |

### 🛠️ Technicians — `/api/technicians`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/technicians/profile` | 🛠️ Technician | Create technician profile |
| `PATCH` | `/api/technicians/profile` | 🛠️ Technician | Update technician profile |
| `GET` | `/api/technicians/profile/me` | 🛠️ Technician | Get own technician profile |
| `GET` | `/api/technicians` | 🌐 Public | List technicians (filter + paginate) |
| `GET` | `/api/technicians/:id` | 🌐 Public | Get a technician by ID |

### 🕒 Availability — `/api/technician/availability`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `PUT` | `/api/technician/availability` | 🛠️ Technician | Set weekly availability slots |
| `GET` | `/api/technician/availability` | 🛠️ Technician | Get own availability |

### 🗂️ Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | 🌐 Public | List categories |
| `POST` | `/api/admin/categories` | 🛡️ Admin | Create a category |
| `PATCH` | `/api/admin/categories/:id` | 🛡️ Admin | Update a category |
| `DELETE` | `/api/admin/categories/:id` | 🛡️ Admin | Delete a category |

### 🧰 Services

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/services` | 🌐 Public | List services (filter + paginate) |
| `GET` | `/api/technician/services/my-services` | 🛠️ Technician | List own services |
| `POST` | `/api/services` | 🛠️ Technician | Create a service |
| `PATCH` | `/api/services/:id` | 🛠️ Technician | Update own service |
| `DELETE` | `/api/services/:id` | 🛠️ Technician / 🛡️ Admin | Delete a service |

### 📅 Bookings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/bookings` | 👤 Customer | Create a booking |
| `GET` | `/api/bookings` | 👤 Customer | List own bookings |
| `PATCH` | `/api/bookings/:id/cancel` | 👤 Customer | Cancel a booking |
| `GET` | `/api/bookings/:id` | 🔒 Authenticated | Get booking details |
| `GET` | `/api/technician/bookings` | 🛠️ Technician | List technician's bookings |
| `PATCH` | `/api/technician/bookings/:id` | 🛠️ Technician | Update booking status |
| `GET` | `/api/admin/bookings` | 🛡️ Admin | List all bookings |

### 💳 Payments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/payments/create` | 👤 Customer | Initiate payment for a booking |
| `GET` | `/api/payments/my-payments` | 👤 Customer | List own payments |
| `GET` | `/api/payments/:id` | 👤 Customer / 🛡️ Admin | Get payment details |
| `GET` | `/api/admin/payments` | 🛡️ Admin | List all payments |
| `POST` | `/api/payments/success` | 🌐 Gateway | SSLCommerz success callback |
| `POST` | `/api/payments/fail` | 🌐 Gateway | SSLCommerz failure callback |
| `POST` | `/api/payments/cancel` | 🌐 Gateway | SSLCommerz cancel callback |

### ⭐ Reviews

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/reviews/my-reviews` | 👤 Customer | List own reviews |
| `POST` | `/api/reviews` | 👤 Customer | Create a review |
| `PATCH` | `/api/reviews/:id` | 👤 Customer | Update own review |
| `DELETE` | `/api/reviews/:id` | 👤 Customer / 🛡️ Admin | Delete a review |
| `GET` | `/api/technicians/:id/reviews` | 🌐 Public | List a technician's reviews |
| `GET` | `/api/admin/reviews` | 🛡️ Admin | List all reviews |
| `PATCH` | `/api/admin/reviews/:id/status` | 🛡️ Admin | Moderate a review (status) |

### 🛡️ Admin — Users — `/api/admin`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | 🛡️ Admin | List all users (filter + paginate) |
| `PATCH` | `/api/admin/users/:id` | 🛡️ Admin | Update a user's status (ban / activate) |

---

## ☁️ Deployment (Vercel)

This project deploys to Vercel as a serverless function.

1. **Push** the repo to GitHub.
2. On Vercel → **Add New → Project** → import the repo.
3. Add all [environment variables](#-environment-variables) under **Settings → Environment Variables**.
4. Set `DATABASE_URL` to a **pooled** Postgres connection (e.g. Neon/Supabase pooler) to avoid serverless connection exhaustion.
5. Deploy — the Prisma client is generated during the build.

> After deploy, set `BASE_URL` and `APP_URL` to your production URLs so CORS allows your frontend.

---

## 📄 License

**ISC** © [Md. Shaqibul Islam](mailto:shaqib.developer@gmail.com)

<div align="center">

**Built with ❤️ using TypeScript, Express & Prisma**

</div>
