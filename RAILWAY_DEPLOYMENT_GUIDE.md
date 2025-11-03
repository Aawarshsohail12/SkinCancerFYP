# Skin Cancer Detection - Railway Deployment Guide

This guide will help you deploy both your **FastAPI backend** and **Angular frontend** to Railway.app.

---

## 📋 Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Railway Account** - Sign up free at [railway.app](https://railway.app)
3. **MongoDB Atlas** - Cloud MongoDB instance
4. **Environment Variables** - MONGO_URI, SECRET_KEY, etc.

---

## 🚀 Quick Start (5 minutes)

### ⚠️ IMPORTANT: Deploy Backend First!

Railway can get confused with monorepos. **Always deploy the backend service first**, then the frontend.

### Option A: Manual Deploy (Recommended)

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Connect your GitHub account and select your repository
4. Railway will detect services from `railway.json` files

---

## 📱 Detailed Deployment Steps

### PART 1: Deploy Backend (FastAPI) - DEPLOY THIS FIRST! ⭐

#### Step 1: Prepare Backend Files

Your backend already has Railway-compatible setup. Verify these files exist:

```
api/skin-cancer-detection-backend/
├── requirements.txt          ✅
├── Dockerfile               ✅ (Now created)
├── railway.json             ✅ (Now created)
├── app/
│   ├── main.py              ✅
│   ├── config.py            ✅
│   └── ... (other modules)
└── start.sh                 ✅
```

All files are ready! ✅

#### Step 2: Configure Railway Backend Service - DO THIS FIRST!

**Important:** Deploy backend BEFORE frontend to avoid build errors!

1. **Go to [railway.app](https://railway.app)**
2. Click **"New Project"** → **"Deploy from GitHub"** → Select your repository
3. Railway will automatically detect the backend service from `Dockerfile` and `railway.json`
4. Select the backend service and configure:

**Backend Service Configuration:**

- **Name**: `skin-cancer-api`
- **Root Directory**: Should auto-detect `api/skin-cancer-detection-backend`
- Railway will use the `Dockerfile` for building

#### Step 3: Set Backend Environment Variables

In the Railway dashboard, go to your backend service and click **"Variables"**:

```
MONGO_URI = mongodb+srv://skincancer:skincancerdb@skincancer.oihitsl.mongodb.net/
MONGO_DB_NAME = skin_cancer
SECRET_KEY = (generate a secure random string, e.g., use OpenSSL)
PYTHON_VERSION = 3.9
```

**Generate a SECRET_KEY:**
```powershell
# On Windows PowerShell
$bytes = New-Object byte[] 32; (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

#### Step 4: Get Backend URL

After deployment, Railway will provide a URL like:
```
https://skin-cancer-backend-production-xxxx.up.railway.app
```

**Note this URL** - you'll need it for the frontend.

---

### PART 2: Deploy Frontend (Angular)

#### Step 1: Create Express Server File

Create `server.js` in the frontend root (if not already there):

```javascript
// server.js
const express = require('express');
const path = require('path');

const app = express();

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist/skin-cancer-detection-frontend/browser')));

// Route all requests to index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/skin-cancer-detection-frontend/browser/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### Step 2: Update package.json Scripts

Make sure your `package.json` has these scripts:

```json
{
  "scripts": {
    "build": "ng build --configuration production",
    "start": "node server.js",
    "install": "npm ci"
  }
}
```

#### Step 3: Configure Railway Frontend Service

1. Go to your Railway project
2. Click **"New Service"** → **"Deploy from GitHub"**
3. Select your repository (same repo)

**For Frontend Service Configuration:**

- **Name**: `skin-cancer-frontend`
- **Root Directory**: `skin-cancer-detection-frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### Step 4: Set Frontend Environment Variables

In Railway dashboard for frontend service, click **"Variables"**:

```
PORT = 3000
NEXT_PUBLIC_API_URL = https://skin-cancer-backend-production-xxxx.up.railway.app
NODE_ENV = production
```

Replace the URL with your actual backend URL from Step 1.

#### Step 5: Update Angular Environment

Update `skin-cancer-detection-frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://skin-cancer-backend-production-xxxx.up.railway.app' // Update with your backend URL
};
```

**Commit and push** this change to GitHub.

---

## 🔗 Connect Services (Link Backend & Frontend)

1. Go to your Railway project dashboard
2. Click **"Variables"** in the top menu
3. In **Frontend Service Variables**, add:
   ```
   VITE_API_URL = <backend-url>
   ```
4. Redeploy frontend

---

## 📧 MongoDB Atlas Configuration

### Important: Allow Railway IPs

1. **Go to MongoDB Atlas** → Your Cluster → **Network Access**
2. Add IP Address: `0.0.0.0/0` (allows all IPs)
   - ⚠️ For production, use specific IP ranges instead
3. Click **"Confirm"**

### Verify Connection String

Your `MONGO_URI` should look like:
```
mongodb+srv://skincancer:skincancerdb@skincancer.oihitsl.mongodb.net/?retryWrites=true&w=majority
```

---

## ✅ Verify Deployment

### Backend Tests

1. Open your backend URL: `https://your-backend-url/`
   - Should return: `{"message": "Skin Cancer Detection API is running"}`

2. Check API docs: `https://your-backend-url/docs`
   - Should show Swagger UI with all endpoints

3. Test health: `https://your-backend-url/health`

### Frontend Tests

1. Open frontend URL: `https://your-frontend-url`
   - Should load the Angular application
   - Check browser console for errors
   - Verify API calls work

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error: "Error creating build plan with Railpack"**
- This happens when Railway can't detect the buildpack type
- **Fix**: Railway now uses `Dockerfile` and `railway.json` (provided)
- If still failing, try these steps:
  1. Delete the failed deployment
  2. Push changes to GitHub: `git add . && git commit -m "Add Docker config" && git push`
  3. Create new deployment in Railway
  4. If it still fails, check that `Dockerfile` exists in backend folder

**Error: "ModuleNotFoundError"**
- Check `requirements.txt` has all dependencies
- Verify Python version in environment variables
- Check build logs in Railway dashboard

**Error: "Port already in use"**
- Make sure start command uses `$PORT` environment variable
- Command should be: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### MongoDB Connection Failed

**Error: "Connection refused"**
1. Check `MONGO_URI` is correct
2. Verify IP whitelist in MongoDB Atlas (should be `0.0.0.0/0`)
3. Test connection string locally first
4. Check credentials are correct

### Frontend Shows Blank Page

**Check:**
1. Build logs in Railway dashboard - look for compilation errors
2. Browser console for JavaScript errors
3. Network tab - verify API calls are going to correct backend URL
4. Check `environment.prod.ts` has correct `apiUrl`

### CORS Errors in Browser

**Fix:**
1. Update backend `CORS` settings in `app/config.py`:
   ```python
   allowed_origins: List[str] = [
       "https://your-frontend-url.railway.app",
       "https://your-backend-url.railway.app",
   ]
   ```
2. Commit and push
3. Railway will auto-redeploy

### "502 Bad Gateway" Error

**Usually means:**
- Backend service crashed - check logs
- Give backend 2-3 minutes to start up
- Check if model file `models/skin_cancer_model.h5` exists

---

## 📊 Project Costs (Railway)

- **Free Tier**: $5 free credit/month
- **Generous Limits**: Enough for:
  - 1 backend service
  - 1 frontend service
  - 1 MongoDB connection
- **Paid**: Pay as you go, usually $0-20/month for small projects

---

## 🔄 Continuous Deployment

Railway automatically redeploys when you:
1. Push to your main branch
2. Or manually trigger from dashboard

**To Deploy Updates:**
```bash
git add .
git commit -m "Update feature"
git push
```

---

## 📝 Environment Variables Reference

| Variable | Backend | Frontend | Example |
|----------|---------|----------|---------|
| `MONGO_URI` | ✅ | ❌ | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGO_DB_NAME` | ✅ | ❌ | `skin_cancer` |
| `SECRET_KEY` | ✅ | ❌ | `base64-encoded-string` |
| `PORT` | ✅ | ✅ | `3000` or `8000` |
| `NODE_ENV` | ❌ | ✅ | `production` |
| `VITE_API_URL` | ❌ | ✅ | `https://backend-url.railway.app` |

---

## 🎯 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Backend service created in Railway
- [ ] Backend environment variables set
- [ ] Frontend service created in Railway
- [ ] Frontend environment variables set
- [ ] Backend URL updated in frontend config
- [ ] `server.js` exists in frontend folder
- [ ] `package.json` build/start scripts correct
- [ ] MongoDB IP whitelist configured
- [ ] Both services deployed successfully
- [ ] Frontend loads and can call backend API
- [ ] Test prediction endpoint works

---

## 🆘 Need Help?

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **GitHub Issues**: Create an issue in your repository
- **Check Logs**: Railway dashboard → Service → Logs tab

---

## 📞 After Deployment

Your application will be live at:
- **Frontend**: `https://your-app-name.up.railway.app`
- **Backend API**: `https://your-api-name.up.railway.app`
- **API Docs**: `https://your-api-name.up.railway.app/docs`

**Share your URLs with others to use the app!** 🎉
