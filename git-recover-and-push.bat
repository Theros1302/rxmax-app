@echo off
REM RxMax — recover from broken mid-merge state and push deploy configs cleanly.
REM What this does: backs up the new deploy files, resets local to match GitHub
REM (preserving all 54 GitHub commits), restores the deploy files, commits, pushes.
REM
REM IMPORTANT: Quit GitHub Desktop COMPLETELY before running this (Task Manager
REM > End task on GitHub Desktop if needed). Otherwise lock files will keep coming back.

setlocal enabledelayedexpansion
set "REPO=%~dp0"
cd /d "%REPO%"

echo.
echo =====================================================
echo  RxMax git recovery
echo =====================================================
echo.

REM Step 0: confirm GitHub Desktop is closed
tasklist /FI "IMAGENAME eq GitHubDesktop.exe" 2>nul | find /I "GitHubDesktop.exe" >nul
if not errorlevel 1 (
  echo [!] GitHub Desktop is still running. Close it completely first.
  echo     Open Task Manager ^> right-click "GitHub Desktop" ^> End task.
  echo     Then re-run this script.
  pause
  exit /b 1
)

REM Step 1: clean lock files
echo [1/7] Cleaning leftover Git lock files...
del /f /q ".git\HEAD.lock" ".git\index.lock" ".git\ORIG_HEAD.lock" ".git\MERGE_HEAD.lock" ".git\COMMIT_EDITMSG.lock" ".git\packed-refs.lock" 2>nul
del /f /q ".git\objects\maintenance.lock" 2>nul
for /r ".git" %%F in (*.lock) do del /f /q "%%F" 2>nul
echo     done.

REM Step 2: back up deploy artifacts to a temp folder
echo [2/7] Backing up the new deploy files to a temp folder...
set "BAK=%TEMP%\rxmax-deploy-backup"
if exist "%BAK%" rmdir /s /q "%BAK%"
mkdir "%BAK%"

REM list of files I added/edited that we MUST preserve
set FILES=README.md DEPLOY_PLAYBOOK.md RUNBOOK.md setup.bat start-all.bat stop-all.bat fix-git-lock.bat git-recover-and-push.bat

for %%F in (%FILES%) do (
  if exist "%%F" (
    copy /y "%%F" "%BAK%\%%F" >nul
    echo     - %%F
  )
)

REM directories to preserve in full
for %%D in (marketing-site) do (
  if exist "%%D" (
    xcopy /e /y /i "%%D" "%BAK%\%%D" >nul
    echo     - %%D\
  )
)

REM specific files inside subdirs to preserve (overlay onto pulled tree)
mkdir "%BAK%\backend" 2>nul
mkdir "%BAK%\backend\migrations" 2>nul
mkdir "%BAK%\admin-panel" 2>nul
mkdir "%BAK%\patient-app" 2>nul
mkdir "%BAK%\store-dashboard" 2>nul

if exist "backend\render.yaml"               copy /y "backend\render.yaml"               "%BAK%\backend\render.yaml" >nul && echo     - backend\render.yaml
if exist "backend\migrations\run.js"         copy /y "backend\migrations\run.js"         "%BAK%\backend\migrations\run.js" >nul && echo     - backend\migrations\run.js
if exist "admin-panel\vercel.json"           copy /y "admin-panel\vercel.json"           "%BAK%\admin-panel\vercel.json" >nul && echo     - admin-panel\vercel.json
if exist "patient-app\vercel.json"           copy /y "patient-app\vercel.json"           "%BAK%\patient-app\vercel.json" >nul && echo     - patient-app\vercel.json
if exist "store-dashboard\vercel.json"       copy /y "store-dashboard\vercel.json"       "%BAK%\store-dashboard\vercel.json" >nul && echo     - store-dashboard\vercel.json

echo     backup complete in: %BAK%

REM Step 3: abort the broken merge so we have a clean working tree
echo [3/7] Aborting the broken merge...
git merge --abort 2>nul
git reset --hard HEAD 2>nul
echo     done.

REM Step 4: fetch the latest from GitHub
echo [4/7] Fetching latest from GitHub...
git fetch origin
if errorlevel 1 (
  echo [X] git fetch failed. Check internet/auth and try again.
  pause
  exit /b 1
)

REM Step 5: hard-reset local main to match GitHub (preserves all 54 commits there)
echo [5/7] Aligning local with GitHub main (no work lost on GitHub)...
git checkout main 2>nul
git reset --hard origin/main
if errorlevel 1 (
  echo [X] reset failed.
  pause
  exit /b 1
)
echo     local now matches origin/main exactly.

REM Step 6: restore the deploy files on top
echo [6/7] Restoring deploy files on top...
xcopy /e /y "%BAK%\*" "%REPO%" >nul
echo     done.

REM Step 7: commit + push
echo [7/7] Committing and pushing...
git add -A
git -c user.email="agarawalvarsha@gmail.com" -c user.name="Prashant (Theros)" commit -m "Add deploy configs and live demo links for rxmax.online"
if errorlevel 1 (
  echo [!] Nothing to commit ^(may already be in sync^). That can be fine.
)
git push origin main
if errorlevel 1 (
  echo [X] push failed. Open GitHub Desktop and try Push origin manually.
  pause
  exit /b 1
)

echo.
echo =====================================================
echo  All done. Open https://github.com/Theros1302/rxmax-app
echo  in Chrome and refresh to see your new files.
echo =====================================================
pause
endlocal
