@echo off
TITLE BugbOS - Tactical Command Center
SETLOCAL

:: Check if node_modules exists, if not, install
if not exist "node_modules\" (
    echo [!] node_modules not found. Initializing setup...
    call npm install
)

echo.
echo 🚀 Launching BugbOS Tactical Interface...
echo ------------------------------------------
call npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] App crashed or failed to start.
    echo [?] Ensure Node.js and Electron are correctly installed.
    pause
)

ENDLOCAL
