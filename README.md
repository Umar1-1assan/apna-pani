# AquaFlow SaaS Boilerplate

Monorepo starter for a SaaS product with:

- React web app
- Node.js + Express API
- MongoDB-ready models and routes
- Cloudinary upload support
- JWT auth and OTP stubs

## Structure

- `apps/server` - Express API
- `apps/web` - React + Vite app

## Setup

1. Install dependencies.
2. Copy `apps/server/.env.example` to `apps/server/.env`.
3. Copy `apps/web/.env.example` to `apps/web/.env`.
4. Run `npm run dev` from the repo root.

## Notes

- `demo-login` is included so the starter works before OTP and billing providers are wired.
- Cloudinary uploads use an in-memory buffer flow so you can swap in signed uploads later without changing the route shape.
