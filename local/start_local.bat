@echo off
chcp 65001 >nul
title PromptVault Local Server
cd /d "%~dp0\.."

echo ===================================================
echo   PromptVault - Personal AI & Dev Workspace (Local)
echo ===================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check if node_modules exists
if not exist "node_modules\" (
    echo [SETUP] First run detected. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
)

:: 3. Open browser after slight delay in background
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: 4. Start local development/offline server
echo [INFO] Starting PromptVault local server at http://localhost:3000 ...
echo [INFO] Press Ctrl+C to stop the server.
echo.

call npm run dev

pause
