# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Routing**: Wouter
- **State**: TanStack Query
- **Staff Auth**: JWT (jsonwebtoken + bcryptjs) — pilates-studio portal
- **Client Auth**: Clerk (Google Sign-In + email) — landing page client portal

## Artifacts

1. **pilates-studio** — Main management app (Spanish UI, gold #C49A1E brand)
2. **api-server** — Express REST API (port 8080)
3. **landing** — Public SaaS landing page

## Project: Pilates Studio Manager (SaaS — Phase 3)

Moon Pilates Studio — Panama (Atrio Mall Costa del Este, +507 6586-9949)
Real admin: Shantel Amaya / moonpilatesstudiopty@gmail.com / 123456789

### Brand
- Primary color: Gold #C49A1E (HSL 42 75% 42%)
- Font: Inter
- Login page: Real studio interior photo (login-bg.avif) with dark overlay

### Auth
- JWT-based login/logout with 7-day expiry
- 3 roles: ADMIN, RECEPTIONIST, INSTRUCTOR
- Protected routes (redirect to /login if unauthenticated)
- Role-based sidebar navigation
- No demo accounts — real credentials only

### Pages
- **Login** — Full-screen photo background, empty fields, no demo hints
- **Dashboard** — Stats cards + 4 Recharts charts (occupancy, top clients, weekly attendance, popular classes)
- **Clases** — Full CRUD with modal
- **Clientes** — Client table with side panel (attendance history, notes)
- **Calendario** — Weekly grid view with attendance toggles + WhatsApp reminders
- **Instructores** — Instructor cards
- **Membresías** — Plans CRUD + client membership assignment (ADMIN-only edit/delete guards)
- **Reportes** — 5 charts (revenue, new clients, cancellations, occupancy, memberships) + CSV & PDF export — ADMIN only
- **Configuración** — Studio settings form + branding color pickers + internal plans + user management — ADMIN only

### Admin-only Features
- Create/delete internal plans and promo pricing
- Create/delete staff users (ADMIN, RECEPTIONIST roles) via Gestión de Usuarios card
- Edit/delete membership plans

### User Management API
- GET /api/users — list studio users
- POST /api/users — create user (email, name, password, role)
- PATCH /api/users/:id — update user
- DELETE /api/users/:id — delete user (cannot delete self)

### Layout
- Collapsible sidebar with role-filtered nav items
- Breadcrumbs in header
- User avatar with dropdown (role badge, logout)
- Studio name shown in sidebar from DB

### Data Model
- **studios** — name, slug, logoUrl, primaryColor, secondaryColor, phone, email, address, cancellationPolicy
- **users** — email, name, passwordHash, role (ADMIN/RECEPTIONIST/INSTRUCTOR), studioId
- **instructors** — name, email, phone, specialties[]
- **classes** — name, instructorId, time, duration, capacity, enrolled, level, type, status, dayOfWeek, date
- **clients** — name, phone, email, plan, classesRemaining, notes
- **reservations** — clientId, classId, date, status, attended (bool)
- **memberships** — name, description, totalClasses, price, durationDays, active
- **client_memberships** — clientId, membershipId, startDate, endDate, classesUsed, status
- **payments** — clientId, membershipId, amount, status, stripeSessionId

### API Routes
- `POST /api/auth/login` — JWT login
- `GET /api/auth/me` — current user (requires Bearer token)
- `GET/PATCH /api/studio/settings` — studio config
- `GET /api/reports/revenue|new-clients|cancellations|occupancy|memberships`
- Standard CRUD for classes, clients, instructors, reservations, memberships
- Payment endpoints: PayPal (create-order, capture-order), Yappy, Efectivo/manual
- WhatsApp notifications via Twilio

### Data Model (additions)
- **clients.passwordHash** — Optional password hash enabling client portal login

### Client Portal (Landing Page — /landing)
- Full booking flow integrated into the public landing page
- **Auth modal** — triggered by any "Reservar" / "Comprar paquete" CTA; tabs for Login / Register
  - Client register: POST /api/client/register (name, email, phone, password)
  - Client login: POST /api/client/login (email, password → JWT with type="client")
  - Token stored in localStorage (`moon_client_token`)
- **Booking modal** — opens after auth; shows live class list from /api/client/classes
  - Select class → choose date → confirm → deducts from membership or classesRemaining
  - POST /api/client/reserve — saves reservation to DB, updates enrolled count
  - Membership check: if active clientMembership, classesUsed incremented; if no membership and no classes remaining, returns 402 with CTA
- **Client dashboard** (/landing/dashboard)
  - Sidebar: Mis Reservas, Membresía, Perfil, Historial
  - Mis Reservas: upcoming classes with cancel button, stat cards
  - Membresía: active plan card with progress bar, available plan list
  - Perfil: user info, logout
  - Historial: all reservations with attendance status
  - Redirects to / if not authenticated
- **Navbar updates**: "Iniciar sesión" + "Reservar clase" when logged out; user first name + "Reservar clase" when logged in

### Landing Page (at /landing)
- Moon Pilates Studio branding: real logo PNG + 2 AVIF reformer photos
- Hero, booking steps, about, class types (5 cards), memberships (3 plans), benefits, contact/map, footer
- Framer Motion scroll animations, sticky nav with scroll-to-white effect, mobile hamburger menu
- All "Reservar" + "Comprar paquete" + "Quiero empezar hoy" buttons trigger auth/booking flow

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/pilates-studio run dev` — run frontend locally

## Important Notes

- NEVER import `zod/v4` directly in api-server source — use generated schemas from `@workspace/api-zod`
- Drizzle returns `Date` objects — call `.toISOString()` before Zod parse
- JWT secret: uses `JWT_SECRET` env var, falls back to `SESSION_SECRET`
- API client auth token getter set in `AuthContext` via `setAuthTokenGetter`
- Currency: B/. (Panamanian Balboa, 1:1 USD) — NOT € or $
- Stripe removed; payments via PayPal (sandbox → set PAYPAL_ENV=live for production), Yappy, and Efectivo
- Staff API_BASE built in auth.tsx strips `/pilates-studio` prefix from BASE_URL before appending `/api`
- Staff demo tokens stored in localStorage key `pilates_token`; client portal tokens stored as `moon_client_token`
- Studio phone: +507 6586-9949; location: Atrio Mall Costa del Este Piso 2 Local C-16; email: moonpilatesstudiopty@gmail.com

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
