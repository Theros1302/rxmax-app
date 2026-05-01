@echo off
REM Hotfix — Admin Store Detail page was rendering blank because of undefined-field crashes.
REM Adds null-guards on store.status, store.plan, lifetime, and order.status fields.

setlocal enabledelayedexpansion
set "REPO=%~dp0"
cd /d "%REPO%"

echo.
echo =====================================================
echo  Hotfix push: Admin Store Detail blank-page fix
echo =====================================================
echo.

tasklist /FI "IMAGENAME eq GitHubDesktop.exe" 2>nul | find /I "GitHubDesktop.exe" >nul
if not errorlevel 1 (
  echo [!] GitHub Desktop still running. Close it ^(Task Manager ^> End task^) and re-run.
  pause
  exit /b 1
)

del /f /q ".git\HEAD.lock" ".git\index.lock" ".git\ORIG_HEAD.lock" ".git\MERGE_HEAD.lock" ".git\COMMIT_EDITMSG.lock" ".git\packed-refs.lock" 2>nul
del /f /q ".git\objects\maintenance.lock" 2>nul
for /r ".git" %%F in (*.lock) do del /f /q "%%F" 2>nul
git merge --abort 2>nul
git reset --mixed HEAD 2>nul

git add -A
git -c user.email="agarawalvarsha@gmail.com" -c user.name="Prashant (Theros)" commit -m "Hotfix: guard undefined fields in admin StoreDetailPage to prevent blank-page crash"
if errorlevel 1 echo [!] Nothing to commit.

git push origin main
if errorlevel 1 (
  echo [X] Push failed. Open GitHub Desktop and try Push origin manually.
  pause
  exit /b 1
)

echo.
echo =====================================================
echo  Hotfix pushed. Vercel admin-panel rebuilds in ~2 min.
echo =====================================================
pause
endlocal
