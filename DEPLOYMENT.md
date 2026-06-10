# Deployment Guide

This project is structured as a monorepo with separate `web` (frontend) and `server` (backend) applications. They are entirely decoupled and ready to be deployed separately. 

## 1. Deploying the Backend (Server)

The backend is a Node.js/Express application. You can deploy it to platforms like **Render**, **Railway**, **Heroku**, or **DigitalOcean Apps**.

### Steps for Render / Railway
1. **Connect your GitHub repository** to the deployment platform.
2. **Root Directory**: Leave it as the default (root of the repo).
3. **Build Command**: `npm install`
4. **Start Command**: `npm start` (This runs `npm run start --workspace @aquaflow/server`)
5. **Environment Variables**: Add all the variables from `apps/server/.env`.
   - **Important:** Set `CORS_ORIGIN` to the URL of your deployed frontend (e.g., `https://my-frontend-domain.vercel.app`).
   - Set `NODE_ENV=production`.
   - Set your `MONGODB_URI` and `JWT_SECRET`.

## 2. Deploying the Frontend (Web)

The frontend is a Vite + React application. The easiest platform to deploy this is **Vercel**, **Netlify**, or **Cloudflare Pages**.

### Steps for Vercel / Netlify
1. **Connect your GitHub repository** to Vercel/Netlify.
2. **Framework Preset**: Vercel/Netlify will usually auto-detect **Vite**.
3. **Root Directory**: You can leave it as the root or select `apps/web`.
4. **Build Command**: `npm run build:web` (or `npm run build` if you selected `apps/web` as root).
5. **Output Directory**: `apps/web/dist` (or `dist` if you selected `apps/web` as root).
6. **Environment Variables**: Add the variables from `apps/web/.env`.
   - **Important:** Set `VITE_API_URL` to the URL of your deployed backend (e.g., `https://my-backend-domain.onrender.com`).

---

**Summary of what we changed:**
- Removed hardcoded `localhost:5000` URLs in the Socket connection inside the frontend and replaced them with the dynamic environment variable `VITE_API_URL`.
- Ensured the backend supports a dynamically configured `CORS_ORIGIN` via environment variables.
- Added explicit deployment scripts (`start`, `start:server`, `build:web`) to the root `package.json` for seamless PaaS deployments.
