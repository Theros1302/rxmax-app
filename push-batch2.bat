@echo off
REM Batch 2 — patient registration flow + admin store-creation with credentials display
REM + accept UUID or slug in store lookup + protect Pro tier in render.yaml

setlocal enabledelayedexpansion
set "REPO=%~dp0"
cd /d "%REPO%"

echo.
echo =====================================================
echo  Batch 2 push: patient registration, store-creation flow,
echo  slug/UUID fix, render.yaml protected
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
git -c user.email="agarawalvarsha@gmail.com" -c user.name="Prashant (Theros)" commit -m "Batch 2: patient registration flow; admin store-create returns credentials + onboarding link; backend accepts store UUID or slug; render.yaml plan removed to protect paid tier"
if errorlevel 1 echo [!] Nothing new to commit ^(may already be in sync^).

echo [4/4] Pushing...
git push origin main
if errorlevel 1 (
  echo [X] Push failed. Open GitHub Desktop and try Push origin manually.
  pause
  exit /b 1
)

echo.
echo =====================================================
echo  Batch 2 pushed. Vercel + Render auto-redeploy in ~2-3 min.
echo  See chat for what to test next.
echo =====================================================
pause
endlocal
