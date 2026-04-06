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
- **Auth**: JWT (jsonwebtoken + bcryptjs)

## Artifacts

1. **pilates-studio** — Main management app (Spanish UI, purple accent)
2. **api-server** — Express REST API (port 8080)
3. **landing** — Public SaaS landing page

## Project: Pilates Studio Manager (SaaS — Phase 3)

A production-ready multi-tenant SaaS for pilates studio management with:

### Auth
- JWT-based login/logout with 7-day expiry
- 3 roles: ADMIN, RECEPTIONIST, INSTRUCTOR
- Protected routes (redirect to /login if unauthenticated)
- Role-based sidebar navigation
- Demo accounts: admin@studio.com/admin123 | recep@studio.com/recep123 | inst@studio.com/inst123

### Pages
- **Login** — Split layout with real JWT auth, demo credential hints
- **Dashboard** — Stats cards + 4 Recharts charts (occupancy, top clients, weekly attendance, popular classes)
- **Clases** — Full CRUD with modal
- **Clientes** — Client table with side panel (attendance history, notes)
- **Calendario** — Weekly grid view with attendance toggles + WhatsApp reminders
- **Instructores** — Instructor cards
- **Membresías** — Plans CRUD + Stripe checkout + client membership assignment
- **Reportes** — 5 charts (revenue, new clients, cancellations, occupancy, memberships) — ADMIN only
- **Configuración** — Studio settings form + branding color pickers — ADMIN only

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
- Stripe webhook + checkout session creation
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

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
