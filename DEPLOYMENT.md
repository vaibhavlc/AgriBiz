# AgriBiz Production Deployment Guide

This document provides complete step-by-step instructions to deploy the AgriBiz billing, inventory, and management suite to production:
- **Source Code**: GitHub
- **Database**: MongoDB Atlas
- **Backend Service**: Render
- **Frontend App**: Vercel

---

## 1. Source Code Repository (GitHub)

1. **Verify Git Exclusions**:
   Ensure `.env`, `node_modules`, `dist`, and `server/logs` are excluded via `.gitignore`.
2. **Push Code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare AgriBiz for production deployment on Vercel and Render"
   git branch -M main
   git remote add origin https://github.com/<your-username>/agribiz.git
   git push -u origin main
   ```

---

## 2. Database Setup (MongoDB Atlas)

1. **Create Cluster**:
   - Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a new cluster (Shared M0 Free tier or Dedicated tier).
2. **Create Database User**:
   - Go to **Database Access** -> **Add New Database User**.
   - Select **Password** authentication, enter username (e.g., `agribiz_admin`) and a strong password.
   - Assign the **Read and write to any database** privilege.
3. **Configure Network Access**:
   - Go to **Network Access** -> **Add IP Address**.
   - Add `0.0.0.0/0` (Allow Access from Anywhere) so Render dynamic server instances can connect to the database.
4. **Copy Connection String**:
   - Click **Connect** on your cluster -> **Drivers** (Node.js).
   - Copy the SRV URI connection string:
     `mongodb+srv://agribiz_admin:<password>@cluster0.xxxx.mongodb.net/agribiz?retryWrites=true&w=majority`

---

## 3. Backend Deployment (Render)

1. **Create Web Service**:
   - Log in to [Render Dashboard](https://dashboard.render.com/).
   - Click **New +** -> **Web Service**.
   - Select your GitHub repository (`agribiz`).
2. **Configure Settings**:
   - **Name**: `agribiz-backend`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. **Environment Variables**:
   Add the following environment variables under **Environment**:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://agribiz_admin:<password>@cluster0.xxxx.mongodb.net/agribiz?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<secure_random_string_32_chars>`
   - `JWT_REFRESH_SECRET`: `<secure_random_string_32_chars>`
   - `CLIENT_URL`: `https://agribiz.vercel.app`
   - `CORS_ORIGIN`: `https://agribiz.vercel.app`
   - `ADMIN_SECRET`: `<your_admin_secret_key>`
   *(Note: Do NOT configure a fixed `PORT`. Render automatically injects `process.env.PORT`)*
4. **Deploy & Verify Health Endpoint**:
   - Click **Create Web Service**.
   - Note down the assigned backend URL (e.g. `https://agribiz-backend.onrender.com`).
   - Test `https://agribiz-backend.onrender.com/health` in your browser. It should return `{ "status": "UP", ... }`.

---

## 4. Frontend Deployment (Vercel)

1. **Import Project**:
   - Log in to [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **Add New...** -> **Project**.
   - Import your GitHub repository (`agribiz`).
2. **Configure Build & Environment Variables**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (Root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: `https://agribiz-backend.onrender.com`
     - `VITE_SOCKET_URL`: `https://agribiz-backend.onrender.com`
3. **Deploy**:
   - Click **Deploy**. Vercel will compile the React app with Vite and generate your production URL (e.g. `https://agribiz.vercel.app`).
4. **Verify CORS Alignment**:
   - Confirm `CLIENT_URL` and `CORS_ORIGIN` on Render match the exact Vercel production domain.

---

## 5. Production Verification Checklist

Verify the application after deployment with:

- [x] **Owner login**: Verify full authentication flow using registered business owner credentials.
- [x] **Staff PIN login**: Verify fast PIN-based login for cashier/staff accounts.
- [x] **Session persistence after browser refresh**: Confirm active user session remains logged in upon page refresh.
- [x] **Offline CRUD**: Create/update invoices, products, or customers while offline.
- [x] **Automatic sync when internet reconnects**: Verify Dexie offline operations flush to MongoDB Atlas when reconnected.
- [x] **Real-time Socket.IO synchronization between multiple users without page refresh**: Test live updates across tabs/devices in real time.
- [x] **PWA installation**: Test service worker installation prompt and PWA standalone launch.
- [x] **IndexedDB (Dexie) data persistence**: Confirm local database persists data across browser reloads.
- [x] **JWT token refresh**: Confirm automatic background token renewal works cross-origin.
- [x] **CORS functionality between Vercel and Render**: Confirm zero CORS errors on API endpoints and WebSockets.
- [x] **MongoDB Atlas connectivity**: Confirm database connections, indexing, and seed data initialization succeed cleanly.
