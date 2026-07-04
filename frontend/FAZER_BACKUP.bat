@echo off
echo Criando backup do ELUS App...
set SRC=C:\Users\juaze\Downloads\elus-mvp-main\elus-mvp-main\frontend
set DEST=C:\Users\juaze\Desktop\ELUS App\Backup 20-06-2026

mkdir "%DEST%" 2>nul

xcopy "%SRC%\app" "%DEST%\app\" /E /I /Y /Q
xcopy "%SRC%\src" "%DEST%\src\" /E /I /Y /Q
xcopy "%SRC%\assets" "%DEST%\assets\" /E /I /Y /Q
xcopy "%SRC%\scripts" "%DEST%\scripts\" /E /I /Y /Q
xcopy "%SRC%\supabase" "%DEST%\supabase\" /E /I /Y /Q

copy "%SRC%\package.json" "%DEST%\" /Y
copy "%SRC%\app.json" "%DEST%\" /Y
copy "%SRC%\tsconfig.json" "%DEST%\" /Y
copy "%SRC%\eas.json" "%DEST%\" /Y
copy "%SRC%\metro.config.js" "%DEST%\" /Y
copy "%SRC%\eslint.config.js" "%DEST%\" /Y
copy "%SRC%\expo-env.d.ts" "%DEST%\" /Y
copy "%SRC%\package-lock.json" "%DEST%\" /Y
copy "%SRC%\.env" "%DEST%\" /Y 2>nul
copy "%SRC%\CLAUDE.md" "%DEST%\" /Y 2>nul
copy "%SRC%\README.md" "%DEST%\" /Y 2>nul

echo.
echo Backup concluido em:
echo %DEST%
echo.
pause
