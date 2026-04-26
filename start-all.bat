@echo off
REM RxMax — starts backend + 3 React apps, each in its own window.
REM Run from rxmax-app\ on Windows.
setlocal

REM React-scripts 5 + newer Node sometimes needs the legacy OpenSSL provider.
set NODE_OPTIONS=--openssl-legacy-provider

echo Launching RxMax stack:
echo   backend          http://localhost:3001
echo   patient-app      http://localhost:3000
echo   store-dashboard  http://localhost:3002
echo   admin-panel      http://localhost:3003
echo.
echo Each app opens in its own terminal. Close those windows to stop.
echo.

start "RxMax backend (3001)"          cmd /k "cd /d %~dp0backend          && npm run dev"
timeout /t 3 /nobreak >nul
start "RxMax patient-app (3000)"      cmd /k "cd /d %~dp0patient-app      && npm start"
start "RxMax store-dashboard (3002)"  cmd /k "cd /d %~dp0store-dashboard  && npm start"
start "RxMax admin-panel (3003)"      cmd /k "cd /d %~dp0admin-panel      && npm start"

echo Started. Open the URLs above in your browser.
endlocal
