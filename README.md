# RxMax — rxmax.online

Five-surface stack: marketing site + 3 React apps + Express/Postgres backend.

## What's where

```
rxmax-app/
├── marketing-site/       → Cloudflare Pages → https://rxmax.online
├── patient-app/          → Vercel → https://app.rxmax.online
├── store-dashboard/      → Vercel → https://store.rxmax.online
├── admin-panel/          → Vercel → https://admin.rxmax.online
├── backend/              → Render → https://api.rxmax.online
└── local-server/         → optional in-memory demo backend (not deployed)
```

Each surface has its own deploy config already in place:
`vercel.json` (the three React apps), `render.yaml` (backend), `_headers` + `_redirects` (marketing-site).

## How to deploy (full step-by-step)

See **`DEPLOY_PLAYBOOK.md`** for the click-by-click. Short version:

1. Push this repo to GitHub.
2. Render → Blueprint → pick repo → applies `backend/render.yaml`. Auto-creates Postgres + auto-migrates demo data on first boot.
3. Vercel → Import three times → Root Directory = `patient-app` / `store-dashboard` / `admin-panel`.
4. Cloudflare Pages → Connect repo → Output dir = `marketing-site`.
5. Cloudflare DNS for `rxmax.online` → 6 CNAMEs (in playbook) → connect each subdomain in its host's settings.

Realistic time: 45 min of clicking.

## Before deploying — one thing to fill in

Open `marketing-site/index.html`, find this block near the top:

```html
window.RXMAX_CONFIG = {
  FORMSPREE_ENDPOINT: 'https://formspree.io/f/FORMSPREE_FORM_ID',
  ...
};
```

Replace `FORMSPREE_FORM_ID` with the ID Formspree gives you after signing up at https://formspree.io and creating a form. Until you do this, the "Register Your Pharmacy" form will show success animation but won't email you the lead — there's a console warning to remind you.

## Local development

Windows: from `rxmax-app/` run `setup.bat` once, then `start-all.bat` whenever you want to run everything locally. Details in `RUNBOOK.md`.

## Demo logins (seeded automatically)

| App              | Phone        | Password         |
|------------------|--------------|------------------|
| store-dashboard  | 9876543200   | demo123          |
| admin-panel      | 9999999999   | rxmaxadmin2026   |
| patient-app      | any 10-digit | OTP in API logs  |

## Domain

`rxmax.online` — registered. DNS migration to Cloudflare is part of step 5 of the playbook.

## Known follow-ups (deferred deliberately)

- Marketing HTML still uses Babel-in-browser. Works fine for retailers, slower than ideal. Productionize to Vite next iteration.
- Render free tier sleeps after 15 min idle → first hit takes ~30s. Upgrade backend to Starter ($7/mo) before sharing the link widely.
- WhatsApp lead alerts via Gupshup — backend has the integration ready but no API key configured.
- No Sentry, no UptimeRobot. Recommended once you have real traffic.
