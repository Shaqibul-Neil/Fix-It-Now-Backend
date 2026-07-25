# 🖥️ FixItNow — Frontend Dashboard Plan

Detailed page map for all three roles, grounded in the 12 backend modules
(`auth · availabilitySlot · booking · category · customer · notification ·
payment · review · service · stats · technician · user`).

**Rules of thumb**
- Every data page = **5 stat cards**.
- **Dashboard + Analytics** are common to all roles (data scoped by role) and carry **2–3 charts each**.
- **Notifications** = bell-icon dropdown, **no dedicated page**. Prefs live under **Settings**.
- **Settings** + **Profile** exist for everyone (form-primary pages; stat cards optional).
- Stat sources below map to real schema fields/enums.

Enum reference:
- Booking: `REQUESTED · ACCEPTED · DECLINED · PAID · IN_PROGRESS · COMPLETED · CANCELLED`
- Payment: `PENDING · SUCCESS · FAILED · REFUNDED`
- Review: `PENDING · PUBLISHED · HIDDEN · REJECTED`
- User: `ACTIVE · BANNED` · Technician: `isApproved · isAvailable · isProfileComplete`

---

## Page count summary

| Role | Data pages | + Form pages | Total | Bell |
|---|---|---|---|---|
| **Admin** | Dashboard, Analytics, Users, Technicians, Bookings, Payments, Services, Categories, Reviews, Support* | Settings, Profile | **12** | 🔔 dropdown |
| **Technician** | Dashboard, Analytics, My Services, My Jobs, My Availability, My Reviews, Earnings, Support* | Settings, Profile | **10** | 🔔 dropdown |
| **Customer** | Dashboard, Analytics, Browse Services, My Bookings, My Payments, My Reviews, Support* | Settings, Profile | **9** | 🔔 dropdown |

`*` Support = planned; needs a new backend module (see Backend task list).

---

# COMMON PAGES (all roles, data scoped by role)

## 📊 Dashboard — 5 stats + 3 charts

**Admin**
| Stat | Source |
|---|---|
| Total Revenue | Σ payments `SUCCESS`.amount |
| Total Bookings | count bookings |
| Total Customers | count users role `CUSTOMER` |
| Total Technicians | count users role `TECHNICIAN` |
| Completed Bookings | bookings `COMPLETED` |

Charts: **① Payment + Booking combo** (line: bookings count + revenue over time, dual axis) · **② Category-wise bookings** (stacked area over time) · **③ Services-per-category pie**. Table: **Top booked services**.

**Technician**
| Stat | Source |
|---|---|
| Total Earnings | 60% share of `COMPLETED` bookings |
| Total Jobs | count own bookings |
| Completed Jobs | bookings `COMPLETED` |
| Average Rating | profile.averageRating |
| New Requests | bookings `REQUESTED` |

Charts: **① Earnings + jobs combo** (over time) · **② Jobs by status pie** · **③ Rating trend line**. Table: **Recent job requests**.

**Customer**
| Stat | Source |
|---|---|
| Total Bookings | count own bookings |
| Upcoming | `scheduledAt > now` & active status |
| Completed | bookings `COMPLETED` |
| Total Spent | Σ own payments `SUCCESS` |
| Reviews Given | count own reviews |

Charts: **① Spend over time area** · **② My bookings by status pie** · **③ Bookings by category bar**. Table: **Recent bookings**.

## 📈 Analytics — 5 stats + 3–4 charts (time-bucketed, date-range filter)

**Admin**
| Stat | Source |
|---|---|
| Conversion Rate | `COMPLETED` / total bookings |
| Cancellation Rate | `CANCELLED + DECLINED` / total |
| Avg Booking Value | avg booking.amount |
| Avg Time-to-Accept | avg(acceptedAt − createdAt) |
| Refund Rate | `REFUNDED` / `SUCCESS` payments |

Charts: **① Revenue trend** (area; daily/weekly/monthly) · **② Booking funnel** (bar: REQUESTED→ACCEPTED→PAID→COMPLETED) · **③ Top categories by revenue** (horizontal bar) · **④ Payment status split pie**. Table: **Top technicians by revenue/rating**.

**Technician**
| Stat | Source |
|---|---|
| Total Earnings | 60% of completed |
| Avg Earning / Job | earnings ÷ completed count |
| Completion Rate | `COMPLETED` / accepted |
| Avg Rating | profile.averageRating |
| Repeat-Customer Rate | customers with >1 booking |

Charts: **① Earnings over time area** · **② Jobs by service bar** · **③ Rating distribution** (bar, 1–5★) · **④ Rating trend line**.

**Customer**
| Stat | Source |
|---|---|
| Total Spent | Σ SUCCESS payments |
| Avg Spend / Booking | spent ÷ bookings |
| Most-Booked Category | groupBy category |
| Completed : Cancelled | ratio |
| Avg Rating Given | avg own review.rating |

Charts: **① Spend over time area** · **② Spend by category pie** · **③ Bookings by status bar**.

---

# ADMIN module pages (5 stats each)

**Users** (`user` / `customer`)
| Active Users | Banned Users | New This Month | Total Customers | Repeat Customers (>1 booking) |

→ chart: signups over time (line).

**Technicians** (`technician`)
| Total Technicians | Active — Available Now (`isAvailable`) | Banned (status) | Incomplete Profiles (`isProfileComplete=false`) | Avg Rating (all) |

→ chart: technicians by city (bar) + rating distribution.
> Note: "Pending Approvals" dropped — no approval flow yet. See task list to add it, then swap **Incomplete Profiles** → **Pending Approval**.

**Bookings** (`booking`)
| Total | In Progress | Completed | Cancelled | Today's Scheduled |

→ chart: bookings by status pie + bookings over time line.

**Payments** (`payment`)
| Total Revenue (SUCCESS) | Pending | Failed | Refunded | Today's Revenue |

→ chart: revenue over time area + payment status pie.

**Services** (`service`)
| Total | Active | Inactive | Avg Price | Most Booked Service |

→ chart: services-per-category pie + top services table.

**Categories** (`category`)
| Total | Active | Inactive | Most Services (category) | Most Bookings (category) |

→ chart: services per category bar + bookings per category bar.

**Reviews** (`review`) — moderation queue
| Total | Pending (moderate) | Published | Hidden/Rejected | Avg Rating |

→ chart: rating distribution bar + reviews over time line.

**Support*** (planned) — ticket management
| Total Tickets | Open | In Progress | Resolved | Awaiting Reply |

→ chart: tickets by status pie + tickets over time line.

---

# TECHNICIAN module pages (5 stats each)

**My Services** (`service`)
| Total | Active | Inactive | Avg Price | Most Booked |

→ chart: bookings per service bar.

**My Jobs** (`booking`)
| Total Jobs | New Requests (`REQUESTED`) | In Progress | Completed | Declined/Cancelled |

→ chart: jobs by status pie + jobs over time line.

**My Availability** (`availabilitySlot`)
| Active Slots | Weekly Hours | Days Available | Busiest Day | Available Now (toggle) |

→ chart: slots by day-of-week bar.

**My Reviews** received (`review`)
| Total Reviews | Avg Rating | 5★ Count | Published | Latest Rating |

→ chart: rating distribution bar + rating trend line.

**Earnings** (`payment` + wallet §8 of PLAN.md)
| Total Earnings (60%) | This Month | Pending Payout | Jobs Paid | Avg / Job |

→ chart: earnings over time area.

**Support*** (planned) — my tickets
| My Tickets | Open | Resolved | Awaiting Reply | Avg Response Time |

→ chart: tickets by status pie.

---

# CUSTOMER module pages (5 stats each)

**Browse Services** (`service`) — discovery
| Available Services | Categories | Avg Price | Top-Rated Technicians | Services Near Me (city) |

→ chart: services-per-category pie.

**My Bookings** (`booking`)
| Total | Upcoming | In Progress | Completed | Cancelled |

→ chart: bookings by status pie + bookings over time line.

**My Payments** (`payment`)
| Total Spent | Successful | Pending | Failed | Refunded |

→ chart: spend over time area.

**My Reviews** (`review`)
| Reviews Given | Published | Pending | Avg Rating Given | Services Reviewed |

→ chart: rating distribution bar.

**Support*** (planned) — my tickets
| My Tickets | Open | Resolved | Awaiting Reply | Last Update |

→ chart: tickets by status pie.

---

# SHARED PAGES (all roles)

**🔔 Notifications** — bell-icon dropdown, no page.
- Unread badge count · recent list · mark-read / mark-all-read · deep-link to source.

**⚙️ Settings** — form page (stat cards optional).
- Notification preferences (per-channel / per-type toggles — needs backend model).
- Change password · email · account (deactivate).
- Theme / language (if i18n added).

**👤 Profile** — form page. Optional mini-stats header:
- Admin: Member Since · Role · Last Login · Total Actions.
- Technician: Member Since · Avg Rating · Total Jobs · Experience (yrs) · Available toggle.
- Customer: Member Since · Total Bookings · Total Spent · Reviews Given · Default City.

---

# Chart-type cheat sheet

| Need | Chart |
|---|---|
| Value over time (revenue, earnings, spend) | line / area |
| Two series over time (bookings + revenue) | combo dual-axis |
| Category over time | stacked area |
| Composition (status split, services/category) | pie / donut |
| Comparison / ranking (top categories, cities) | bar / horizontal bar |
| Funnel (REQUESTED→COMPLETED) | funnel / bar |
| Rating spread (1–5★) | bar |
| Top-N lists (services, technicians) | table |

Example charts mapping: payment+booking → **Dashboard ①** · category-wise area → **Dashboard ②** · services-per-category pie → **Dashboard ③** · top booked service → **Dashboard table**.

---

# ✅ Frontend task list

- [ ] Layout shell: role-based sidebar + topbar with 🔔 bell dropdown + avatar menu.
- [ ] Reusable `StatCard` component (label, value, delta, icon, trend arrow).
- [ ] Chart wrappers (line/area/bar/pie/combo/funnel) — one lib (Recharts/ApexCharts).
- [ ] Date-range picker + granularity toggle (day/week/month) on Analytics.
- [ ] Data table (sort, paginate, filter) for list pages + top-N tables.
- [ ] Role-guarded routing (Admin / Technician / Customer route groups).
- [ ] Dashboard + Analytics per role (stats + charts wired to stats API).
- [ ] All module list pages with 5 stat cards each.
- [ ] Bell dropdown: unread count poll/subscribe, mark-read.
- [ ] Settings page (notification prefs + password/email/account).
- [ ] Profile page per role (view/edit + mini-stats header).
- [ ] **Support page** (customer/technician create ticket + thread; admin manage) — blocked on backend Support module.
- [ ] Technician **Available Now** toggle (writes `isAvailable`).
- [ ] Empty/loading/error states + skeletons for every stat + chart.

---

# 🛠️ Backend task list (to power an enterprise-level dashboard)

Ordered highest-leverage first.

- [ ] **Stats/analytics endpoints (biggest gap).** Build out the `stats` module: one
      endpoint per dashboard/analytics view returning stat cards + chart series in a
      shaped payload. Use Prisma `groupBy` / `aggregate` / raw SQL for time-series.
- [ ] **Time-bucketing util** — group by day/week/month with a date-range filter
      (shared across revenue, bookings, earnings, tickets trends).
- [ ] **Aggregation queries** — category-wise bookings, services-per-category,
      top-N booked services, top technicians, rating distribution, booking funnel.
- [ ] **Derived KPIs** — conversion rate, cancellation rate, avg time-to-accept,
      refund rate, repeat-customer rate, completion rate.
- [ ] **Technician approval flow** — admin approve/reject endpoints writing
      `isApproved` + notification (`TECHNICIAN_ONBOARDED`); then swap the admin
      Technicians stat **Incomplete Profiles → Pending Approval**.
- [ ] **Wallet / Escrow / Payout system** (PLAN.md §8) — powers Technician Earnings
      stats (total/this-month/pending payout) + admin revenue split.
- [ ] **Support / Ticket module (new)** — `SupportTicket` + `TicketMessage` models;
      customer/technician create + thread; admin list/respond/resolve; statuses
      `OPEN · IN_PROGRESS · RESOLVED · CLOSED`; feeds all Support pages.
- [ ] **Notification preferences model** — per-user, per-type/channel toggles;
      consulted before emit; drives the Settings prefs UI.
- [ ] **Bell endpoints** — unread count + paginated recent + mark-read / mark-all.
- [ ] **Account settings endpoints** — change password, change email, deactivate.
- [ ] **Profile read/update** — confirm customer/technician profile GET/PATCH cover
      the Profile page (avatar, bio, address, city/area, hourlyRate, etc.).
- [ ] **"Near me" filter** — services/technicians by customer city/area for Browse.
- [ ] **Caching (optional)** — cache heavy aggregations (Redis, short TTL) so
      dashboards stay fast under load.
- [ ] **Consistent stats response contract** — `{ stats: [...], charts: {...} }`
      shape so the frontend `StatCard`/chart wrappers stay generic.
