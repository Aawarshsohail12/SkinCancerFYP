# Skin Cancer Detection Backend - Render Deployment Guide

This guide will help you deploy your FastAPI backend to Render.com step by step.

## Prerequisites

1. A GitHub account
2. A Render account (free tier available at https://render.com)
3. Your code pushed to a GitHub repository

## Step-by-Step Deployment Instructions

### Step 1: Prepare Your Code

Your code is already prepared with the necessary configuration files:
- `render.yaml` - Render deployment configuration
- `requirements.txt` - Python dependencies
- `start.sh` - Startup script

### Step 2: Push to GitHub

1. Make sure all your code is committed and pushed to your GitHub repository
2. Your backend code should be in the `api/skin-cancer-detection-backend/` directory

### Step 3: Create a New Web Service on Render

1. Go to https://render.com and sign in
2. Click "New +" and select "Web Service"
3. Connect your GitHub account if not already connected
4. Select your repository (`skin-cancer-detection`)

### Step 4: Configure the Service

Fill in the following details:

**Basic Settings:**
- **Name**: `skin-cancer-detection-api` (or any name you prefer)
- **Region**: Choose the region closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `api/skin-cancer-detection-backend`

**Build & Deploy:**
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Environment Variables:**
Add these environment variables:
- `MONGO_URI`: `mongodb+srv://skincancer:skincancerdb@skincancer.oihitsl.mongodb.net/`
- `MONGO_DB_NAME`: `skin_cancer`
- `SECRET_KEY`: Generate a secure random string (Render can auto-generate this)
- `PYTHON_VERSION`: `3.9.16`

### Step 5: Advanced Settings (Optional)

- **Auto-Deploy**: Keep this enabled for automatic deployments on code changes
- **Health Check Path**: `/` (your API root endpoint)

### Step 6: Deploy

1. Click "Create Web Service"
2. Render will start building and deploying your application
3. Wait for the deployment to complete (this may take 5-15 minutes)

### Step 7: Update CORS Settings

After deployment, you'll get a URL like: `https://your-service-name.onrender.com`

You need to update your CORS settings:

1. Go to your `app/config.py` file
2. Add your new Render URL to the `allowed_origins` list
3. Commit and push the changes

### Step 8: Test Your API

Once deployed, you can test your API:
- **Health Check**: `https://your-service-name.onrender.com/`
- **API Documentation**: `https://your-service-name.onrender.com/docs`

## Important Notes

### File Uploads
- Render's free tier has ephemeral storage, meaning uploaded files will be deleted when the service restarts
- Consider using cloud storage (AWS S3, Cloudinary, etc.) for production file storage

### Database
- Your MongoDB Atlas connection should work fine
- Make sure your MongoDB cluster allows connections from all IPs (0.0.0.0/0) or add Render's IP ranges

### Free Tier Limitations
- Services sleep after 15 minutes of inactivity
- 750 hours per month (enough for one service running 24/7)
- Limited to 512MB RAM

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Ensure all dependencies in `requirements.txt` are compatible
- Python version issues: specify Python version in environment variables

### Service Won't Start
- Check the service logs in Render dashboard
- Verify the start command is correct: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Ensure all required directories exist

### Database Connection Issues
- Verify MongoDB URI is correct
- Check if MongoDB allows connections from Render IPs
- Test the connection string locally first

### CORS Issues
- Make sure your Render URL is added to `allowed_origins` in `config.py`
- Deploy the updated configuration

## Updating Your Service

To update your deployed service:
1. Make changes to your code
2. Commit and push to your GitHub repository
3. Render will automatically redeploy if auto-deploy is enabled

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGO_DB_NAME` | Database name | `skin_cancer` |
| `SECRET_KEY` | JWT secret key | Auto-generated secure string |
| `PYTHON_VERSION` | Python version | `3.9.16` |

## Support

If you encounter issues:
1. Check Render's documentation: https://render.com/docs
2. Review the service logs in your Render dashboard
3. Verify your MongoDB connection and credentials

Your API will be available at: `https://your-service-name.onrender.com`