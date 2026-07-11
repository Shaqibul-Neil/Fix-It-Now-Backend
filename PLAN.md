# 🚀 FixItNow — Future Roadmap

Forward-looking plan for turning FixItNow from a solid CRUD marketplace backend into a **portfolio-defining, interview-winning** project. Each item lists **what**, **why it matters**, **where it plugs into the current code**, and a rough **effort** rating.

> **How to read this:** items are grouped by theme and each theme is ordered *highest leverage first*. The 🎯 **Interview Edge** callouts flag the features an interviewer will actually stop and ask about. Don't build everything — build the top of each section and be able to talk about the rest.

**Current stack (baseline):** Express 5 · Prisma 7 · PostgreSQL · Zod 4 · JWT (access + refresh) · bcrypt · SSLCommerz · Swagger/OpenAPI 3 · 11 feature modules · in-app notification system.

---

## 1. 🔐 Authentication & Account Security

The single most impressive area for a backend interview. Current auth is register / login / refresh / current-user. Everything below is a natural extension of the existing `auth` module.

| Feature | Why it gives an edge | Plugs into | Effort |
|---|---|---|---|
| **Forgot password** | Table-stakes for any real product; shows you understand secure token flows (hashed, single-use, expiring reset tokens — never email the raw token or store it plaintext). | `auth.service.ts` + new `PasswordResetToken` model + email/OTP delivery | 🟢 Low |
| **Reset password** | Pairs with forgot-password; demonstrates token invalidation + forced refresh-token revocation after reset. | same as above | 🟢 Low |
| **Email verification** | Gates unverified accounts from booking/payment; classic "verify before act" flow. | new `emailVerifiedAt` on `User` + verification token | 🟢 Low |
| **OTP (email / SMS)** | 🎯 One-time codes for login or sensitive actions. Talk about rate-limiting OTP requests, hashing stored codes, short TTL, attempt lockout. | new `Otp` model (or Redis TTL keys) | 🟡 Medium |
| **Passwordless / magic-link login** | 🎯 Modern, memorable. "Click the link in your email to log in." Shows you can design auth beyond passwords. | signed short-lived JWT in link → exchanged for session | 🟡 Medium |
| **2-Step Verification (2FA / TOTP)** | 🎯 **Biggest single flex.** TOTP (Google Authenticator / `otplib`) + backup recovery codes. Interviewers love the shared-secret + time-window discussion. | `twoFactorSecret`, `twoFactorEnabled` on `User` | 🟡 Medium |
| **OAuth / social login** | 🎯 Google / GitHub sign-in via OAuth 2.0 + PKCE. Shows you understand third-party identity, account linking, and "sign in with X." | new `OAuthAccount` model linked to `User` | 🟠 High |
| **Refresh-token rotation + reuse detection** | Senior-level detail. Rotate refresh tokens on every use; if an old one is replayed, revoke the whole family (token theft detection). | extend refresh flow + `RefreshToken`/session table | 🟡 Medium |
| **Session management** | "Log out of all devices," list active sessions with device/IP. Builds directly on a token/session table. | `Session` model | 🟡 Medium |
| **Account lockout + brute-force protection** | Lock after N failed logins; exponential backoff. Security-minded signal. | login counter (Redis or DB) | 🟢 Low |

> **Suggested build order:** Forgot/Reset password → Email verification → OTP infra → 2FA → OAuth. Each reuses the token/delivery plumbing of the previous one, so you compound the work instead of repeating it.

---

## 2. 📊 Analytics, Stats & Dashboards

Turns raw tables into insight. Every admin panel needs this, and aggregation queries show SQL/Prisma depth.

| Feature | Why it gives an edge | Plugs into | Effort |
|---|---|---|---|
| **Admin stats dashboard** | 🎯 Totals + trends: users, technicians, bookings by status, revenue, top categories, avg rating. Show off Prisma `groupBy` / `aggregate` / raw SQL for time-series. | new `stats` (or `analytics`) module reading across all tables | 🟡 Medium |
| **Technician earnings dashboard** | Per-technician revenue, completed jobs, rating trend, repeat-customer rate. | `stats` module scoped by `technicianId` | 🟡 Medium |
| **Customer activity summary** | Spend history, most-booked categories, upcoming bookings. | `stats` module scoped by `customerId` | 🟢 Low |
| **Revenue reports (time-bucketed)** | Daily/weekly/monthly revenue with date-range filters; foundation for charts on the frontend. | aggregation over `payment` | 🟡 Medium |
| **Platform KPIs** | Booking conversion rate, cancellation rate, avg time-to-accept, technician utilization. Product-thinking signal. | derived queries + cached results | 🟠 High |
| **CSV / PDF export** | "Download report." Streams and file generation are a nice practical touch. | export util on `stats` endpoints | 🟢 Low |

> These pair perfectly with the notification system you just built — the same admin who receives activity notifications gets the aggregated view of that activity.

---

## 3. ⚡ Real-Time & Notifications (build on what exists)

You already have a persisted in-app notification system. The obvious, high-impact next step is **live delivery**.

| Feature | Why it gives an edge | Plugs into | Effort |
|---|---|---|---|
| **WebSocket / SSE live notifications** | 🎯 Notifications pop instantly instead of on refresh. Socket.IO or native SSE. Great story: "persisted for history, pushed for immediacy." | emit alongside `tryNotifyUser` / `tryNotifyMany` in `notification.emit.ts` | 🟡 Medium |
| **Email notifications** | Mirror key in-app events (booking confirmed, payment receipt) to email via Nodemailer/Resend + templates. | hook into existing notification events | 🟢 Low |
| **Push notifications (web/mobile)** | Web Push (VAPID) or FCM for out-of-app reach. | subscription table + emit hook | 🟠 High |
| **Notification preferences** | Per-user channel toggles (in-app / email / push per event type). Shows respect for user control + fan-out design. | `NotificationPreference` model consulted before emit | 🟡 Medium |
| **Live booking status feed** | Technician/customer watch status changes in real time (accepted → in-progress → completed). | reuse socket layer + booking status events | 🟡 Medium |

> **Why this is the smartest next build:** it's incremental (the hard part — event catalog + persistence — is done), it's *visually* impressive in a demo, and it gives you a clean "sync vs async delivery" talking point.

---

## 4. 🤖 AI Integration

The current differentiator in interviews. Pick one or two done *well* rather than many bolted on. Use the Claude API (or an AI-gateway pattern) so provider swaps are trivial.

| Feature | Why it gives an edge | Plugs into | Effort |
|---|---|---|---|
| **Smart service search (semantic)** | 🎯 "My sink is leaking and the floor is wet" → returns plumbers. Embeddings + `pgvector` for semantic matching instead of keyword LIKE. Shows vector-DB literacy. | new `search` module + `pgvector` on `service` descriptions | 🟠 High |
| **AI booking assistant (chat)** | 🎯 Natural-language booking: chat → structured booking intent (category, time, budget) via tool/function calling. The single most "wow" feature. | new `assistant` module orchestrating `service` + `booking` | 🟠 High |
| **Review sentiment analysis + auto-moderation** | Auto-flag toxic/spam reviews and score sentiment on submit; feeds the existing review moderation queue. | hook into `review.service.ts` create flow | 🟡 Medium |
| **AI-generated service descriptions** | Technician enters a few keywords → polished listing copy + suggested price range. Practical, low-risk AI. | `service.service.ts` create/update assist endpoint | 🟢 Low |
| **Smart technician recommendations** | Rank technicians for a request by rating, proximity, availability, price, past success. Starts rule-based, upgrades to ML. | recommendation query in `technician`/`booking` | 🟡 Medium |
| **Support chatbot (RAG over docs)** | Answer "how do I cancel?" from your own docs/FAQ via retrieval-augmented generation. | new `support` module + doc embeddings | 🟠 High |

> **Interview framing:** whichever you pick, be ready to discuss cost control (caching, token budgets), prompt-injection safety, graceful degradation when the model is down, and *why AI vs. a deterministic rule* for that feature.

---

## 5. 🏗️ Engineering Quality & Production-Readiness

Less flashy, but this is what separates "bootcamp project" from "would hire." A senior interviewer weights this heavily.

| Feature | Why it gives an edge | Plugs into | Effort |
|---|---|---|---|
| **Automated tests** | 🎯 **Biggest credibility jump.** Vitest/Jest unit tests + Supertest integration tests on services/routes. `test` script is currently a stub — that's a visible gap. | whole codebase; start with `auth`, `booking`, `payment` | 🟠 High |
| **Rate limiting** | Protect auth + payment + OTP endpoints. `express-rate-limit` (or Redis-backed for multi-instance). Security signal. | global middleware + per-route tightening | 🟢 Low |
| **Redis caching** | Cache hot reads (service listings, technician profiles, stats) + back OTP/rate-limit/sessions. Shows caching-strategy awareness (TTL, invalidation). | cache layer in read-heavy services | 🟡 Medium |
| **Background jobs / queue** | BullMQ (Redis) for email sending, AI calls, report generation — anything slow moves off the request path. Async-architecture signal. | worker for notification email + AI tasks | 🟡 Medium |
| **File uploads** | Avatars, technician certifications, job photos via S3/Cloudinary (presigned uploads, not proxied through the API). | new upload util + `technician`/`review` | 🟡 Medium |
| **Structured logging + request tracing** | Pino/Winston with request IDs; correlate a request across logs. Observability basics. | middleware + logger util | 🟢 Low |
| **Error monitoring** | Sentry for exceptions in prod. | global error handler hook | 🟢 Low |
| **Health checks + metrics** | `/health` (liveness/readiness) + Prometheus `/metrics`. Ops-readiness signal. | new `health` route | 🟢 Low |
| **CI/CD pipeline** | GitHub Actions: lint → typecheck → test → build → deploy. Green badge on the README is a strong first impression. | `.github/workflows` | 🟡 Medium |
| **Dockerization** | `Dockerfile` + `docker-compose` (API + Postgres + Redis) for one-command local spin-up. Reproducibility signal. | repo root | 🟢 Low |
| **API versioning** | `/api/v1` prefix so future breaking changes don't break clients. | `route.registry.ts` | 🟢 Low |
| **Audit logs** | Immutable trail of sensitive admin/security actions (ban, role change, refunds). Complements the notification "audit sink" idea. | new `AuditLog` model + emit hook | 🟡 Medium |

---

## 6. 🌟 Domain Features (marketplace depth)

Product features that make FixItNow feel like a real business, not a schema demo.

| Feature | Why it gives an edge | Plugs into | Effort |
|---|---|---|---|
| **Geolocation & proximity search** | "Technicians near me" via PostGIS or lat/lng + Haversine. Location-aware querying is a standout for a services marketplace. | `service`/`technician` + address coords | 🟠 High |
| **Real-time technician availability** | Live "available now" state + conflict-free slot booking (prevent double-booking with transactions/locks). | `availabilitySlot` + `booking` transaction | 🟡 Medium |
| **Coupons / discounts / promo codes** | Percentage/fixed discounts with usage caps + expiry, applied at payment. Commerce logic depth. | new `Coupon` model + `payment` | 🟡 Medium |
| **Refunds & cancellation policy** | Time-based refund tiers via SSLCommerz refund API; ties into cancellation notifications you already emit. | `payment.service.ts` | 🟡 Medium |
| **Technician subscription tiers** | Free vs. premium (more listings, featured placement, lower commission). Recurring-billing story. | new `subscription` module | 🟠 High |
| **Multi-technician / recurring bookings** | Weekly cleaning, multi-visit jobs. Scheduling-model depth. | `booking` schema extension | 🟠 High |
| **In-app chat (customer ↔ technician)** | Coordinate job details. Reuses the WebSocket layer from §3. | new `chat` module + socket layer | 🟠 High |
| **Dispute resolution** | Customer raises a dispute on a completed job → admin workflow. Marketplace-trust feature. | new `dispute` module | 🟡 Medium |
| **Favorites / saved technicians** | Customers bookmark technicians for rebooking. Small, high-UX-value. | join table on `customer` | 🟢 Low |
| **Multi-language (i18n)** | Localize notification + email copy (e.g., Bangla/English). | message catalog in notification events | 🟡 Medium |

---

## 7. 📚 Documentation & Developer Experience

Cheap to do, disproportionately impressive when someone opens the repo.

- **Postman / Bruno collection** committed to the repo for one-click API exploration.
- **Architecture diagram** (request lifecycle, module layering, data flow) in the README.
- **ADRs (Architecture Decision Records)** — short notes on *why* key choices were made (e.g., inline relation selects, best-effort notifications, per-module include files). Shows deliberate engineering.
- **Seed data storytelling** — a documented demo scenario so a reviewer can log in and immediately see a populated, realistic app.
- **Contribution guide + conventional-commit enforcement** (commitlint + Husky) — signals team-readiness.
- **Live demo deployment** with a public Swagger URL + seeded demo accounts in the README.

---

## 🎯 Recommended "Interview-Winning" Track

If time is limited, this sequence delivers the **highest signal per hour** and tells one coherent story — *"I took a working CRUD backend and made it secure, real-time, intelligent, and production-ready."*

1. **Forgot/Reset password + Email verification** — completes the auth story; fast win. *(§1)*
2. **2FA (TOTP) + OAuth (Google)** — the auth-security showpiece. *(§1)* 🎯
3. **Automated tests + CI pipeline** — instant credibility, fixes the visible `test` stub gap. *(§5)* 🎯
4. **Rate limiting + Redis caching** — production-readiness in two focused features. *(§5)*
5. **Real-time notifications (WebSocket/SSE)** — leverages the system you already built; demos beautifully. *(§3)* 🎯
6. **Admin stats dashboard** — turns your data into insight; great for a frontend demo. *(§2)* 🎯
7. **One AI feature, done well** — semantic search *or* the booking assistant. The conversation-starter. *(§4)* 🎯

Ship 1–4 for a rock-solid backend. Add 5–7 and you have a project an interviewer remembers.

---

## Effort legend

| Badge | Meaning |
|---|---|
| 🟢 Low | Hours to a day; self-contained. |
| 🟡 Medium | A few days; touches multiple modules or needs new infra. |
| 🟠 High | A week+; new subsystem, external service, or non-trivial data modeling. |

---

*This roadmap is intentionally opinionated. Depth beats breadth in interviews — three features built thoughtfully (with tests, error handling, and a clear "why") outweigh ten half-finished ones.*
