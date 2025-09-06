# 🚀 Production Deployment Guide

This guide will help you deploy your Device Management App to production using free-tier services.

## 📋 Prerequisites

- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- Auth0 account (already set up)

## 🏗️ Deployment Architecture

```
Frontend (Vercel) → Auth0 → Backend (Railway) → PostgreSQL (Railway)
```

## 📤 Step 1: Push Code to GitHub

1. **Initialize Git repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Device Management App"
   ```

2. **Create GitHub repository:**
   - Go to https://github.com/new
   - Name: `device-management-app`
   - Make it public
   - Don't initialize with README

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/device-management-app.git
   git branch -M main
   git push -u origin main
   ```

## 🖥️ Step 2: Deploy Backend to Railway

1. **Go to Railway.app and sign up/login**

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `device-management-app` repository
   - Select the `backend` folder

3. **Add PostgreSQL Database:**
   - In your Railway project dashboard
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically create a database

4. **Configure Environment Variables:**
   Go to your backend service → Variables tab and add:
   ```
   AUTH0_DOMAIN=dev-wuj0ul83tmp064p.us.auth0.com
   AUTH0_AUDIENCE=https://device-management-api
   AUTH0_ISSUER=https://dev-wuj0ul83tmp064p.us.auth0.com/
   FRONTEND_URL=https://your-app.vercel.app
   DATABASE_URL=[Railway will auto-populate this]
   PORT=8000
   RAILWAY_ENVIRONMENT=production
   ```
   
   **Important:** Replace `https://your-app.vercel.app` with your actual Vercel URL after frontend deployment.

5. **Get your backend URL:**
   - After deployment, Railway will give you a URL like:
   - `https://your-app-name.up.railway.app`

## 🌐 Step 3: Deploy Frontend to Netlify

1. **Go to Netlify.com and login to your existing account**

2. **Import Project:**
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Select your `device-management-app` repository
   - Set **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

3. **Configure Build Settings:**
   - Framework: Next.js (auto-detected)
   - Node version: 18 (set in netlify.toml)

4. **Add Environment Variables:**
   In Netlify dashboard → Site Settings → Environment Variables:
   ```
   AUTH0_SECRET=[Generate a 32-character random string]
   AUTH0_BASE_URL=https://your-app.netlify.app
   AUTH0_ISSUER_BASE_URL=https://dev-wuj0ul83tmp064p.us.auth0.com
   AUTH0_CLIENT_ID=your_auth0_client_id
   AUTH0_CLIENT_SECRET=your_auth0_client_secret
   AUTH0_AUDIENCE=https://device-management-api
   NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
   ```

5. **Deploy:**
   - Netlify will automatically deploy
   - You'll get a URL like: `https://your-app.netlify.app`

## 🔐 Step 4: Update Auth0 Settings

1. **Go to Auth0 Dashboard → Applications → Your App**

2. **Update URLs:**
   - **Allowed Callback URLs:**
     ```
     https://your-app.netlify.app/api/auth/callback
     ```
   
   - **Allowed Logout URLs:**
     ```
     https://your-app.netlify.app
     ```
   
   - **Allowed Web Origins:**
     ```
     https://your-app.netlify.app
     ```

3. **Update API Settings:**
   - Go to APIs → Device Management API
   - Update identifier if needed: `https://device-management-api`

## 🧪 Step 5: Test Production Deployment

1. **Visit your Netlify URL**
2. **Test the complete flow:**
   - Sign up/Login with Google
   - Access dashboard
   - Test device limit (try logging in from 4 devices)
   - Test force logout functionality
   - Test graceful logout notifications

## 🔧 Troubleshooting

### Backend Issues:
- Check Railway logs in dashboard
- Verify environment variables
- Ensure PostgreSQL is connected

### Frontend Issues:
- Check Netlify function logs
- Verify Auth0 configuration  
- Check browser console for errors

### Database Issues:
- Railway PostgreSQL should auto-connect
- Check DATABASE_URL environment variable

## 📊 Free Tier Limits

- **Railway:** 500 hours/month, 1GB RAM, 1GB storage
- **Netlify:** 100GB bandwidth, 300 build minutes/month
- **Auth0:** 7,000 free active users

## 🎉 Success!

Your Device Management App is now live and accessible to users worldwide!

**Production URLs:**
- Frontend: `https://your-app.netlify.app`
- Backend: `https://your-backend.up.railway.app`
- API Docs: `https://your-backend.up.railway.app/docs`
