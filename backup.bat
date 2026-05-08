@echo off
TITLE bugbOS — Data Backup
SETLOCAL
color 0A

echo.
echo  ╔══════════════════════════════════════╗
echo  ║    bugbOS  DATA  BACKUP  SYSTEM     ║
echo  ╚══════════════════════════════════════╝
echo.

SET TIMESTAMP=%DATE:~-4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%
SET TIMESTAMP=%TIMESTAMP: =0%
SET OUTDIR=e:\bugbounty\userdata\backups\backup_%TIMESTAMP%

echo [1/3] Creating backup folder: %OUTDIR%
mkdir "%OUTDIR%" 2>nul

echo [2/3] Copying userdata files (attachments, screenshots, reports)...
xcopy /E /I /Q "e:\bugbounty\userdata\attachments"  "%OUTDIR%\attachments\"  2>nul
xcopy /E /I /Q "e:\bugbounty\userdata\screenshots"  "%OUTDIR%\screenshots\"  2>nul
xcopy /E /I /Q "e:\bugbounty\userdata\reports"      "%OUTDIR%\reports\"      2>nul

echo [3/3] Reminder: Export your in-app data too!
echo.
echo  ┌─────────────────────────────────────────────────┐
echo  │  OPEN bugbOS → Export / Backup → Export Full   │
echo  │  Backup, then save the JSON file in:           │
echo  │  e:\bugbounty\userdata\backups\                 │
echo  └─────────────────────────────────────────────────┘
echo.
echo  ✓ File backup complete: %OUTDIR%
echo.

:: Also write a quick status file
echo Backup created: %DATE% %TIME% > "%OUTDIR%\backup_info.txt"
echo Files backed up: attachments, screenshots, reports >> "%OUTDIR%\backup_info.txt"
echo NOTE: Run Export Full Backup from the app to save bugs/notes/targets. >> "%OUTDIR%\backup_info.txt"

echo Press any key to open the backups folder...
pause >nul
explorer "%OUTDIR%"

ENDLOCAL
