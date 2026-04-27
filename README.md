# Flat Expenses Manager

A Vite + React + TypeScript single-page application for managing shared flat expenses with:

- Supabase Auth, Database, and Storage
- Ant Design + styled-components Glassmorphism UI
- TanStack Query v5 for server state
- React Router for routing
- Excel export with SheetJS
- Weekend expense splitting by selected participants

## Features

- Email/password authentication with Supabase Auth
- Role-based access with `admin` and `user`
- Per-user `can_add_expenses` permission
- Fixed monthly expense tracking with equal split by member count
- Weekend meal expense tracking with custom participant split
- Monthly summaries for every flatmate
- Bill image uploads to Supabase Storage bucket `bill-images`
- Flat layout view with bed assignment management
- Announcement board with admin CRUD
- Excel export for expenses, users, and announcements
- Glassmorphism responsive UI built with Ant Design and styled-components

## Tech Stack

- React 19
- Vite
- TypeScript
- Supabase JavaScript client
- Ant Design
- styled-components
- TanStack Query
- React Router
- xlsx
- react-dropzone

## Project Structure

```text
src/
  components/
  context/
  hooks/
  lib/
  pages/
  styles/
supabase/
  migrations/
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

4. In Supabase, run the SQL migration from:

`supabase/migrations/202604271230_init.sql`

This migration creates:

- `profiles`
- `rooms`
- `beds`
- `bed_assignments`
- `expenses`
- `expense_participants`
- `announcements`
- `settings`
- storage bucket `bill-images`
- helper functions and RLS policies
- initial room, bed, and `member_count = 10` seed data

## Running Locally

```bash
npm run dev
```

Open the app at the local Vite URL, usually:

`http://localhost:5173`

## Demo Data Seed

You can populate Supabase with demo users, profiles, announcements, bed assignments, and expenses.

1. Add these values to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEMO_USER_PASSWORD=Flatmate123!
```

2. Make sure you already ran the migration:

`supabase/migrations/202604271230_init.sql`

3. Run:

```bash
npm run seed:demo
```

The script creates 10 demo users and prints their emails. All demo accounts share the password from `DEMO_USER_PASSWORD`.

## Production Build

```bash
npm run build
```

## Auth and Roles

- New sign-ups create a row in `profiles` through a database trigger.
- The very first registered user becomes `admin` automatically and also gets `can_add_expenses = true`.
- Later users default to `role = user` and `can_add_expenses = false`.
- Admins can:
  - change roles
  - toggle expense permissions
  - update member count
  - manage bed assignments
  - create announcements
  - delete any expense

Regular users can view all data. They can add expenses only when `can_add_expenses = true`. They cannot edit or delete expenses.

## Notes

- The requested floorplan includes 3 bedrooms with 2 visible beds each, plus washrooms, kitchen, TV lounge, and dining area.
- Fixed expense share is computed from the `settings.member_count` value, so it can stay independent from the number of registered profiles.
- Weekend meal share is computed as `amount / selected_participants.length`.

## Useful Commands

```bash
npm run dev
npm run build
npm run preview
```
