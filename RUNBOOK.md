# RxMax — Local Run Guide (Windows)

You're running the **full Postgres backend** + 3 React UIs on your own machine.

## Ports

| Component        | URL                       |
|------------------|---------------------------|
| backend (API)    | http://localhost:3001     |
| patient-app      | http://localhost:3000     |
| store-dashboard  | http://localhost:3002     |
| admin-panel      | http://localhost:3003     |

## One-time setup

### 1. Install prerequisites
- **Node.js 18+** — https://nodejs.org (LTS).
- **PostgreSQL 14+** — https://www.postgresql.org/download/windows/. During install, set the `postgres` user password to **`Puchak!01`** (this matches `backend/.env`). If you use a different password, edit `backend/.env` accordingly.

### 2. Install Node dependencies
Open a terminal in `rxmax-app\` and run:
```
setup.bat
```
This runs `npm install` in `backend`, `admin-panel`, `patient-app`, `store-dashboard`, and `local-server`.

### 3. Create the database
```
psql -U postgres -c "CREATE DATABASE rxmax;"
```
You'll be prompted for the postgres password. Tables and demo data are created **automatically** the first time `backend` boots — no manual migration step needed. (If you ever want to re-run migrations standalone: `cd backend && npm run migrate`.)

## Daily run

From `rxmax-app\`:
```
start-all.bat
```
This opens four terminals — one per app — and waits 3s after the backend before launching the React apps so the API is up first.

To stop:
```
stop-all.bat
```
or just close the four terminal windows.

## Demo logins (seeded)

| App              | Phone        | Password         |
|------------------|--------------|------------------|
| store-dashboard  | 9876543200   | demo123          |
| admin-panel      | 9999999999   | rxmaxadmin2026   |
| patient-app      | 9876543210   | (OTP/demo)       |

## Troubleshooting

- **"ECONNREFUSED localhost:5432"** — Postgres isn't running. Start the **postgresql-x64-XX** service (Services app) or open pgAdmin.
- **"password authentication failed for user postgres"** — `backend/.env` password doesn't match what you set during Postgres install. Edit `DB_PASSWORD` in `backend/.env`.
- **React app says "digital envelope routines::unsupported"** — already handled: `start-all.bat` sets `NODE_OPTIONS=--openssl-legacy-provider`. If you launch an app manually, set this env var first.
- **Port already in use** — something else is using 3000/3001/3002/3003. `netstat -ano | findstr :3001` to find the PID, then `taskkill /PID <pid> /F`.
- **CORS error in the browser** — the backend currently allows all origins, so this usually means the API isn't running or is on the wrong port. Verify `http://localhost:3001/api/health` returns `{"status":"healthy"}`.

## Switching backends later

All three UIs read `REACT_APP_API_URL` from their `.env.local`. To point them at the demo `local-server` instead, change those values to `http://localhost:3001` (already set) and run `local-server\server.js` instead of `backend\`. To point at the hosted Render backend, set `REACT_APP_API_URL=https://rxmax-backend.onrender.com`.

## Security notes (worth fixing before sharing)

- `backend/.env`, `backend/.env.local`, `admin-panel/.env.local`, `patient-app/.env.local`, `store-dashboard/.env.local` all contain a live **Gemini API key**. If this folder is ever pushed to a public repo, that key leaks — rotate it and move to `.env.local` only (which is gitignored).
- `JWT_SECRET=rxmax-secret-2026` in `backend/.env` is a placeholder — change before any non-local use.
- DB password `Puchak!01` is in plaintext in `backend/.env`. Same gitignore note applies.
