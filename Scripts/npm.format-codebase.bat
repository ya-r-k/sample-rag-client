@echo off
chcp 65001 >nul
cd /d "%~dp0..\SampleRag.Client"

echo [INFO] Formatting React client with Prettier ^(npm run format^)...
call npm run format
if errorlevel 1 exit /b 1

echo [OK] Format finished.
exit /b 0
