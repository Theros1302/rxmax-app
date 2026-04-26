@echo off
REM Removes leftover Git lock files that block GitHub Desktop from completing operations.
REM Safe to run any time you see "A lock file already exists" in GitHub Desktop.

setlocal
set "REPO=%~dp0"
set "GITDIR=%REPO%.git"

echo.
echo Cleaning Git lock files in: %GITDIR%
echo.

if not exist "%GITDIR%" (
  echo [X] .git folder not found at %GITDIR%
  echo     Run this from inside the rxmax-app folder.
  pause
  exit /b 1
)

del /f /q "%GITDIR%\HEAD.lock"             2>nul && echo  - removed HEAD.lock
del /f /q "%GITDIR%\index.lock"            2>nul && echo  - removed index.lock
del /f /q "%GITDIR%\ORIG_HEAD.lock"        2>nul && echo  - removed ORIG_HEAD.lock
del /f /q "%GITDIR%\MERGE_HEAD.lock"       2>nul && echo  - removed MERGE_HEAD.lock
del /f /q "%GITDIR%\COMMIT_EDITMSG.lock"   2>nul && echo  - removed COMMIT_EDITMSG.lock
del /f /q "%GITDIR%\packed-refs.lock"      2>nul && echo  - removed packed-refs.lock
del /f /q "%GITDIR%\objects\maintenance.lock" 2>nul && echo  - removed objects\maintenance.lock

REM Find any other stray .lock files inside .git and delete them
for /r "%GITDIR%" %%F in (*.lock) do (
  del /f /q "%%F" 2>nul
  echo  - removed %%F
)

echo.
echo Done. Now:
echo  1. Close GitHub Desktop completely (right-click tray icon ^> Quit if needed).
echo  2. Reopen GitHub Desktop.
echo  3. Click Push origin (or Repository ^> Push) again.
echo.
pause
endlocal
