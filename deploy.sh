#!/bin/bash

echo "🚀 Device Management App - Deployment Helper"
echo "============================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Device Management App ready for deployment"
    echo "✅ Git repository initialized"
    echo ""
    echo "🔗 Next steps:"
    echo "1. Create a new repository on GitHub: https://github.com/new"
    echo "2. Name it: device-management-app"
    echo "3. Run these commands with your GitHub username:"
    echo ""
    echo "   git remote add origin https://github.com/YOUR_USERNAME/device-management-app.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
else
    echo "📦 Git repository already exists"
    echo "🔄 Adding latest changes..."
    git add .
    git commit -m "Updated for production deployment - $(date)"
    echo "✅ Changes committed"
    echo ""
    echo "📤 Push to GitHub:"
    echo "   git push origin main"
    echo ""
fi

echo "🌐 Deployment Checklist:"
echo "========================"
echo "□ 1. Push code to GitHub (see commands above)"
echo "□ 2. Deploy backend to Railway:"
echo "     - Go to https://railway.app"
echo "     - New Project → Deploy from GitHub"
echo "     - Select backend folder"
echo "     - Add PostgreSQL database"
echo "     - Set environment variables"
echo ""
echo "□ 3. Deploy frontend to Vercel:"
echo "     - Go to https://vercel.com"
echo "     - New Project → Import from GitHub"
echo "     - Select frontend folder"
echo "     - Set environment variables"
echo ""
echo "□ 4. Update Auth0 settings with production URLs"
echo "□ 5. Test the complete application"
echo ""
echo "📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Ready to deploy! Follow the checklist above."
