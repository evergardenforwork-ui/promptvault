#!/usr/bin/env bash

# PromptVault Local Server Starter for macOS / Linux

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "==================================================="
echo "  PromptVault - Personal AI & Dev Workspace (Local)"
echo "==================================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[SETUP] First run detected. Installing dependencies..."
    npm install
fi

# Try opening default browser
if which xdg-open > /dev/null; then
    (sleep 2 && xdg-open http://localhost:3000) &
elif which open > /dev/null; then
    (sleep 2 && open http://localhost:3000) &
fi

echo "[INFO] Starting PromptVault local server at http://localhost:3000 ..."
npm run dev
