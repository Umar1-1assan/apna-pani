# Deployment Guide

This project is structured as a monorepo with separate `web` (frontend) and `server` (backend) applications.

---

## 1. Deploying the Frontend to Vercel

The frontend is a Vite + React application located in `apps/web`.

### Step-by-Step Vercel Deployment

1. **Connect GitHub to Vercel**:
   - Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** > **Project**.
   - Import your GitHub repository.

2. **Configure Project Settings**:
   - **Framework Preset**: Select **Vite** (it should auto-detect this).
   - **Root Directory**: Click "Edit" and choose `apps/web`.
   - **Build & Development Settings**:
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Disable Deployments on non-main Branches (Ignored Build Step)**:
   - Go to your Vercel project's **Settings** > **Git** tab.
   - Scroll down to the **Ignored Build Step** section.
   - Change the selection to **Custom**.
   - Input the following command:
     ```bash
     if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi
     ```
     *(This command tells Vercel: If the build target environment is production (i.e. the `main` branch), proceed with the build (exit 1). Otherwise, ignore/cancel the build (exit 0).)*
   - Save your changes.

4. **Environment Variables**:
   - Under the **Environment Variables** section in Vercel settings, add:
     - `VITE_API_URL`: The URL of your deployed backend (e.g., `https://your-backend.onrender.com`).
   - Click **Deploy**.

---

## 2. Deploying the Backend (Important Note)

> [!WARNING]  
> **Netlify is not suitable for this backend.** Netlify is designed for static websites and stateless serverless functions. Since your backend is a persistent Express server that uses **Socket.io (WebSockets)**, deploying it to Netlify will break the real-time websocket connections and trigger timeouts because Netlify terminates functions after a few seconds.
>
> We strongly recommend deploying the backend to **Render**, **Railway**, or **Railway/Heroku**. Below are the instructions for deploying to **Render**.

### Step-by-Step Render Deployment (Recommended)

1. **Create a Web Service on Render**:
   - Log in to [Render](https://render.com/) and click **New +** > **Web Service**.
   - Connect your GitHub repository.

2. **Configure Service Settings**:
   - **Name**: `apna-pani-backend` (or your preferred name)
   - **Region**: Select a region close to your target audience.
   - **Branch**: `main`
   - **Root Directory**: `apps/server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (Runs the production server script)

3. **Set Environment Variables**:
   - Click **Advanced** and add the following variables:
     - `PORT`: `5000`
     - `NODE_ENV`: `production`
     - `MONGODB_URI`: `mongodb://muhammadumarhassan987_db_user:IPJLnyw1HC1FlYH5@ac-eyd7bww-shard-00-00.mye74kw.mongodb.net:27017,ac-eyd7bww-shard-00-01.mye74kw.mongodb.net:27017,ac-eyd7bww-shard-00-02.mye74kw.mongodb.net:27017/apna-pani-db?ssl=true&replicaSet=atlas-13n7js-shard-0&authSource=admin&retryWrites=true&w=majority`
     - `JWT_SECRET`: `your_secure_random_jwt_secret`
     - `JWT_REFRESH_SECRET`: `your_secure_random_refresh_token_secret`
     - `CORS_ORIGIN`: `https://your-frontend-domain.vercel.app` (The Vercel URL you got from deploying the frontend above)
     - `SUPER_ADMIN_PHONE`: `+923001234567` (or your phone)
     - `SUPER_ADMIN_EMAIL`: `admin@aquaflow.com`
     - `SUPER_ADMIN_PASSWORD`: `admin123`
     - `SUPER_ADMIN_NAME`: `Super Admin`
   - Click **Create Web Service**.

4. **Verify CORS Settings**:
   - Once your Vercel deployment finishes, copy its production URL.
   - Go back to Render's Environment Settings and update `CORS_ORIGIN` to match your Vercel URL exactly (without the trailing slash).
