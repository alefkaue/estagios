@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale primeiro o Node.js LTS em https://nodejs.org/
  pause
  exit /b 1
)
powershell.exe -NoProfile -File "%~dp0Instalar.ps1"
if errorlevel 1 (
  echo Instalacao interrompida. Guarde a mensagem de erro sem credenciais.
)
pause
