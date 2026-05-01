@echo off
REM Batch 4 — Security hardening + operational layer
REM   - JWT secret enforcement (refuses to start without)
REM   - Demo OTP backdoor gated to non-production
REM   - OTP plaintext logging removed
REM   - bcrypt cost factor 10 -> 12
REM   - /seed endpoints require admin auth
REM   - Helmet security headers
REM   - CORS allowlist (no more "any origin")
REM   - Rate-limit (10 req/min on auth, 120 req/min elsewhere)
REM   - /uploads now authenticated
REM   - Body-size limit 256KB (15MB only on /api/prescriptions)
REM   - Structured request logging via morgan
REM   - withTransaction helper added
REM   - DPDP consent checkbox in patient registration
REM   - medibuddy_token legacy migrated to rxmax_store_token
REM   - .env.example template + AUDIT.md handover doc

setlocal enabledelayedexpansion
set "REPO=%~dp0"
cd /d "%REPO%"

echo.
echo =====================================================
echo  Batch 4 push: security and operational hardening
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
git -c user.email="agarawalvarsha@gmail.com" -c user.name="Prashant (Theros)" commit -m "Batch 4: security and operational hardening - JWT enforcement, rate-limit, CORS allowlist, helmet, /uploads auth, OTP backdoor gated, bcrypt 12, DPDP consent, audit doc"
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
echo  Batch 4 pushed.
echo.
echo  IMPORTANT — set this env var on Render before next backend boot:
echo    JWT_SECRET = ^(generate via: node -e "console.log^(require^('crypto'^).randomBytes^(32^).toString^('hex'^)^)"^)
echo.
echo  Without it, the backend will REFUSE to start in production.
echo  Existing user sessions will be invalidated when the secret changes.
echo =====================================================
pause
endlocal
