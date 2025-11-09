#!/bin/bash

echo "========================================"
echo "HRX ODOO - Quick Setup Script"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "[ERROR] PostgreSQL is not installed!"
    echo "Please install PostgreSQL from https://www.postgresql.org/download/"
    exit 1
fi

echo "[OK] Prerequisites check passed"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install backend dependencies"
        exit 1
    fi
fi
echo "[OK] Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install frontend dependencies"
        exit 1
    fi
fi
echo "[OK] Frontend dependencies installed"
echo ""

# Check for .env files
cd ../backend
if [ ! -f ".env" ]; then
    echo "[WARNING] Backend .env file not found!"
    echo "Please create backend/.env file with database credentials"
    echo "See DEPLOYMENT_GUIDE.md for template"
    echo ""
fi

cd ../frontend
if [ ! -f ".env" ]; then
    echo "[WARNING] Frontend .env file not found!"
    echo "Please create frontend/.env file with API URL"
    echo "See DEPLOYMENT_GUIDE.md for template"
    echo ""
fi

cd ..

echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Create .env files (if not done)"
echo "2. Create database: CREATE DATABASE hrx_odoo;"
echo "3. Run schema: psql -U postgres -d hrx_odoo -f backend/schema.sql"
echo "4. Seed database: node backend/scripts/seedDatabase.js"
echo "5. Start backend: cd backend && npm run dev"
echo "6. Start frontend: cd frontend && npm run dev"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
