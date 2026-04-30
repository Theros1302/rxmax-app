@echo off
REM Batch 3 — All missing features + bug fixes:
REM   - Apollo default fallback removed in patient-app
REM   - Patient Refills page now shows seeded refills with proper field mapping
REM   - Add Patient flow (backend + UI)
REM   - Add Inventory + Bulk Upload UI
REM   - Send Reminder action on Patients page
REM   - Prescription review popup
REM   - Admin Store Detail page now uses real data with empty/error states

setlocal enabledelayedexpansion
set "REPO=%~dp0"
cd /d "%REPO%"

echo.
echo =====================================================
echo  Batch 3 push: missing features + remaining bug fixes
echo =====================================================
echo.

tasklist /FI "IMAGENAME eq GitHubDesktop.exe" 2>nul | find /I "GitHubDesktop.exe" >nul
if not errorlevel 1 (
  echo [!] GitHub Desktop still running. Close it ^(Task Manager ^> End task^) and re-run.
  pause
  exit /b 1
)

echo [1/4] Cleaning leftover Git locks and merge state...
del /f /q ".git\HEAD.lock" ".git\index.lock" ".git\ORIG_HEAD.lock" ".git\MERGE_HEAD.lock" ".git\COMMIT_EDITMSG.lock" ".git\packed-refs.lock" 2>nul
del /f /q ".git\objects\maintenance.lock" 2>nul
for /r ".git" %%F in (*.lock) do del /f /q "%%F" 2>nul
git merge --abort 2>nul
git reset --mixed HEAD 2>nul

echo [2/4] Staging changes...
git add -A

echo [3/4] Committing...
git -c user.email="agarawalvarsha@gmail.com" -c user.name="Prashant (Theros)" commit -m "Batch 3: add patient/inventory/reminder UIs + Rx popup + admin store detail; remove apollo fallback; seed refills"
if errorlevel 1 echo [!] Nothing new to commit.

echo [4/4] Pushing...
git push origin main
if errorlevel 1 (
  echo [X] Push failed. Open GitHub Desktop and try Push origin manually.
  pause
  exit /b 1
)

echo.
echo =====================================================
echo  Batch 3 pushed. Vercel + Render auto-redeploy in ~3 min.
echo  See chat for what to test next.
echo =====================================================
pause
endlocal
