@echo off
REM Batch 1 — push the api.js rewrites + Toast + OrdersPage updates to GitHub
REM Cleans up any leftover merge state, then commits and pushes.
REM IMPORTANT: Quit GitHub Desktop COMPLETELY before running this.

setlocal enabledelayedexpansion
set "REPO=%~dp0"
cd /d "%REPO%"

echo.
echo =====================================================
echo  Batch 1 push: kill mock fallbacks, fix UUID bugs, add Toast
echo =====================================================
echo.

tasklist /FI "IMAGENAME eq GitHubDesktop.exe" 2>nul | find /I "GitHubDesktop.exe" >nul
if not errorlevel 1 (
  echo [!] GitHub Desktop still running. Close it ^(Task Manager ^> End task^) and re-run.
  pause
  exit /b 1
)

echo [1/5] Cleaning leftover Git locks and merge state...
del /f /q ".git\HEAD.lock" ".git\index.lock" ".git\ORIG_HEAD.lock" ".git\MERGE_HEAD.lock" ".git\COMMIT_EDITMSG.lock" ".git\packed-refs.lock" 2>nul
del /f /q ".git\objects\maintenance.lock" 2>nul
for /r ".git" %%F in (*.lock) do del /f /q "%%F" 2>nul

REM Abort any in-progress merge so the index isn't confused
git merge --abort 2>nul
git reset --mixed HEAD 2>nul

echo [2/5] Staging all real changes...
git add -A

echo [3/5] Showing what will be committed:
git status --short

echo.
echo [4/5] Committing...
git -c user.email="agarawalvarsha@gmail.com" -c user.name="Prashant (Theros)" commit -m "Batch 1: remove all mock fallbacks; fix hardcoded storeId in patient-app; fix parseInt(UUID) in admin-panel; add Toast for error UX; refetch orders after status update"
if errorlevel 1 (
  echo [!] Nothing new to commit, or commit failed. Continuing to push step.
)

echo [5/5] Pushing to GitHub...
git push origin main
if errorlevel 1 (
  echo [X] Push failed. Open GitHub Desktop and try Push origin manually.
  pause
  exit /b 1
)

echo.
echo =====================================================
echo  Batch 1 pushed. Vercel + Render will auto-redeploy in ~2-3 min.
echo  When ready, hit:
echo    - https://rxmax-store-dashboard.vercel.app  (login 9876543200 / demo123)
echo    - https://rxmax-admin-panel.vercel.app      (login 9999999999 / rxmaxadmin2026)
echo    - https://rxmax-patient-app.vercel.app
echo =====================================================
pause
endlocal
