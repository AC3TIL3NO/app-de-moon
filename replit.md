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

## Project: Pilates Studio Manager

A management MVP for pilates studios with the following screens:
- **Login** — split layout with form + pilates image
- **Dashboard** — stats cards, today's classes, calendar, recent clients
- **Clases** — full CRUD table with modal for new class creation
- **Clientes** — client table with side panel (attendance history, notes)
- **Calendario** — weekly grid view with class blocks and reservation management
- **Instructores** — instructor list/cards
- **Membresías** — membership plans CRUD + client membership assignment and status tracking

### Data Model
- **instructors** — name, email, phone, specialties[]
- **classes** — name, instructorId, time, duration, capacity, enrolled, level, type, status, dayOfWeek, date
- **clients** — name, phone, email, plan, classesRemaining, notes
- **reservations** — clientId, classId, date, status, attended (bool)
- **memberships** — name, description, totalClasses, price, durationDays, active
- **client_memberships** — clientId, membershipId, membershipName, clientName, startDate, endDate, classesUsed, classesTotal, status

### Dashboard Charts
- **Ocupación Semanal** — BarChart via Recharts showing occupancy % by day of week
- **Top Clientes** — Horizontal BarChart showing clients ranked by classes attended

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/pilates-studio run dev` — run frontend locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
