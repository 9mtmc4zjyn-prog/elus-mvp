@echo off
chcp 65001 >nul
echo.
echo ================================
echo   ELUS — Backup Selfie Fix
echo   20-06-2026
echo ================================
set SOURCE=C:\Users\juaze\Downloads\elus-mvp-main\elus-mvp-main\frontend
set DEST=C:\Users\juaze\Desktop\ELUS App\Backup Selfie Fix 20-06-2026
mkdir "%DEST%" 2>nul
robocopy "%SOURCE%" "%DEST%" /E /XD node_modules .expo .git /XF *.log /NFL /NDL /NJH /NJS
echo Backup concluido em: %DEST%
pause
