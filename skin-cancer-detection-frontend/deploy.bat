@echo off

echo 🚀 Building Angular application for production...

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the application
echo 🔨 Building application...
npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Build completed successfully!
    echo 📁 Build output is in: dist/skin-cancer-detection-frontend/browser/
    echo.
    echo 🌐 Deployment files created:
    echo   - index.html ^(main app^)
    echo   - _redirects ^(Netlify routing^)
    echo   - .htaccess ^(Apache routing^)
    echo   - web.config ^(IIS routing^)
    echo   - 404.html ^(fallback^)
    echo.
    echo 🚀 Ready to deploy to:
    echo   - Vercel: vercel deploy
    echo   - Railway: railway up
    echo   - Netlify: drag and drop dist folder
    echo   - Any static host with the routing files
) else (
    echo ❌ Build failed!
    exit /b 1
)
