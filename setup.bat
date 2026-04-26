@echo off
REM RxMax — one-time setup. Run from rxmax-app\ on Windows.
REM Installs deps in backend + 3 React apps. Does NOT install Postgres (do that yourself, see RUNBOOK.md).
setlocal

echo.
echo ====================================================
echo  RxMax setup ^| installing Node deps in 4 components
echo ====================================================
echo.

where node >nul 2>nul || (echo [X] Node.js not on PATH. Install Node 18+ from https://nodejs.org and re-run. & exit /b 1)
where npm  >nul 2>nul || (echo [X] npm not on PATH. & exit /b 1)
where psql >nul 2>nul || echo [!] psql not on PATH ^- make sure PostgreSQL is installed before starting the backend.

for %%D in (backend admin-panel patient-app store-dashboard local-server) do (
  echo.
  echo --- npm install in %%D ---
  pushd "%~dp0%%D"
  call npm install --no-audit --no-fund || (echo [X] npm install failed in %%D & popd & exit /b 1)
  popd
)

echo.
echo ====================================================
echo  Done. Next: create Postgres DB, then run start-all.bat
echo  See RUNBOOK.md for the exact commands.
echo ====================================================
endlocal
