@echo off
chcp 65001 >nul
echo.
echo ================================
echo   ELUS — Backup Final
echo   20-06-2026
echo ================================
echo.

set SOURCE=C:\Users\juaze\Downloads\elus-mvp-main\elus-mvp-main\frontend
set DEST=C:\Users\juaze\Desktop\ELUS App\Backup Final 20-06-2026

echo Criando pasta de destino...
mkdir "%DEST%" 2>nul

echo Copiando arquivos (sem node_modules)...
robocopy "%SOURCE%" "%DEST%" /E /XD node_modules .expo .git /XF *.log /NFL /NDL /NJH /NJS

echo.
echo ================================
echo Backup concluido!
echo Destino: %DEST%
echo ================================
pause
