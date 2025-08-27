#!/bin/bash

echo "🚀 Setting up Chat.VinaGPU.com..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Copy environment files
echo "📝 Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from example"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo "✅ Created frontend/.env.local from example"
fi

# Start database
echo "🐘 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Generate Prisma client and run migrations
echo "🔄 Setting up database..."
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the development servers:"
echo "  npm run dev"
echo ""
echo "To access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:3001"
echo "  Database: localhost:5432"
echo ""
echo "Demo credentials:"
echo "  Email: demo@example.com"
echo "  Password: password123"
echo ""
echo "Make sure Ollama is running on http://localhost:11434"
echo "Install a model with: ollama pull llama2"
