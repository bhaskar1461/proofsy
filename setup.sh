#!/bin/bash

# Proofsy Setup Script - Automated installation and configuration

set -e

echo "🚀 Proofsy Backend Upgrade - Setup Script"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node.js version: $NODE_VERSION"

if ! [[ "$NODE_VERSION" =~ "v22" ]] && ! [[ "$NODE_VERSION" =~ "v20" ]]; then
    echo -e "${YELLOW}⚠️  Recommended Node.js version: 22.x (current: $NODE_VERSION)${NC}"
fi

# Install backend dependencies
echo ""
echo "📥 Installing backend dependencies..."
cd backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"

# Create storage directories
mkdir -p storage/pdfs
mkdir -p uploads
echo -e "${GREEN}✓ Storage directories created${NC}"

# Check for .env file
echo ""
echo "⚙️  Checking environment configuration..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env created. Please update with your configuration.${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

cd ..

# Install frontend dependencies
echo ""
echo "📥 Installing frontend dependencies..."
cd frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd ..

# Docker check
echo ""
echo "🐳 Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker is installed ($(docker --version))${NC}"
    
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✓ Docker Compose is installed${NC}"
        echo ""
        echo "To start the application with Docker:"
        echo "  docker-compose up --build"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not found. For production deployment, please install Docker.${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📖 Next steps:"
echo "  1. Update backend/.env with your configuration"
echo "  2. Run: docker-compose up"
echo "  3. Access API: http://localhost:5000"
echo "  4. Access Frontend: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "  - See UPGRADES.md for detailed changes"
echo "  - See backend/.env.example for environment variables"
echo "  - Run: npm test (in backend/) for tests"
echo ""
