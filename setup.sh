#!/bin/bash

echo "🚀 Setting up Device Management Web App"
echo "======================================="

# Check if required tools are installed
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ $1 is installed"
    fi
}

echo "Checking required tools..."
check_command "node"
check_command "npm"
check_command "python3"
check_command "pip"

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Created virtual environment"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
echo "✅ Installed backend dependencies"

# Copy environment file
if [ ! -f ".env" ]; then
    cp env.example .env
    echo "✅ Created .env file (please configure it with your Auth0 credentials)"
else
    echo "⚠️  .env file already exists"
fi

cd ..

# Setup frontend
echo ""
echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
npm install
echo "✅ Installed frontend dependencies"

# Copy environment file
if [ ! -f ".env.local" ]; then
    cp env.local.example .env.local
    echo "✅ Created .env.local file (please configure it with your Auth0 credentials)"
else
    echo "⚠️  .env.local file already exists"
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure Auth0 credentials in backend/.env and frontend/.env.local"
echo "2. Start the backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Visit http://localhost:3000"
echo ""
echo "For deployment instructions, see DEPLOYMENT.md"
