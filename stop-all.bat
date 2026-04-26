@echo off
REM Brute-force stop: kills any windows started by start-all.bat (matched by title).
taskkill /FI "WINDOWTITLE eq RxMax backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq RxMax patient-app*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq RxMax store-dashboard*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq RxMax admin-panel*" /T /F >nul 2>&1
echo Stopped (best effort).
