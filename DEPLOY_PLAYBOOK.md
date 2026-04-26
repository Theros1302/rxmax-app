# RxMax — Live Links Playbook (rxmax.online)

This is the click-by-click to take what's in this folder to public, shareable URLs in roughly 30–45 minutes.

## End-state URL map

| Surface          | Public URL                    | Hosted on        |
|------------------|-------------------------------|------------------|
| Marketing site   | https://rxmax.online          | Cloudflare Pages |
| Patient app      | https://app.rxmax.online      | Vercel           |
| Store dashboard  | https://store.rxmax.online    | Vercel           |
| Admin panel      | https://admin.rxmax.online    | Vercel           |
| Backend API      | https://api.rxmax.online      | Render           |
| Health check     | https://api.rxmax.online/api/health |            |

## Pre-flight

The git remote already exists: `https://github.com/Theros1302/rxmax-app.git`. Push the latest from your machine before starting:

```
cd "C:\Users\DELL\Documents\Prashant Projects\Personal project\Archive (1)\Pharmacy App\rxmax-app"
git add .
git commit -m "Add deploy configs for rxmax.online"
git push origin main
```

If git push asks for credentials, use a GitHub Personal Access Token (Settings → Developer settings → PATs → Generate, scope: `repo`).

## Step 1 — Backend on Render (~10 min)

1. Go to https://render.com → sign up with GitHub.
2. **New → Blueprint**. Pick the `rxmax-app` repo. Render auto-detects `backend/render.yaml`. Apply.
3. This creates two things: `rxmax-backend` (web service) and `rxmax-db` (Postgres). The DB attaches automatically via `DATABASE_URL`.
4. In the `rxmax-backend` service, set the two `sync: false` env vars:
   - `GEMINI_API_KEY` → your Gemini key
   - `WHATSAPP_API_KEY` → your Gupshup key (or leave blank — service runs in mock mode)
5. Wait for first deploy (~5 min). You'll get a URL like `https://rxmax-backend-xxxx.onrender.com`.
6. Visit `<that URL>/api/health` → should return `{"status":"healthy"}`. **First boot also runs migrations and seeds demo data automatically** (5 stores, 5 patients, 15 medicines, 6 orders).

> Free tier on Render sleeps after 15 min idle. First request after sleep takes ~30s. For retailer demos this is acceptable; upgrade to Starter ($7/mo) once you have leads coming in.

## Step 2 — Three React apps on Vercel (~10 min total)

Do this three times — once per app — they're identical:

1. https://vercel.com → sign up with GitHub.
2. **Add New → Project** → import `rxmax-app` repo.
3. **Root Directory**: set to one of `patient-app`, `store-dashboard`, `admin-panel`. Vercel reads that folder's `vercel.json` automatically.
4. **Environment Variables**: add `REACT_APP_API_URL` = your Render URL from Step 1 (or `https://api.rxmax.online` if you've already pointed DNS — see Step 4). Also `REACT_APP_GEMINI_API_KEY` if the patient app needs client-side Gemini.
5. Deploy. You'll get URLs like `rxmax-patient-app.vercel.app`, `rxmax-store-dashboard.vercel.app`, `rxmax-admin-panel.vercel.app`. **These are already shareable** — don't wait for the custom domain in Step 4.

## Step 3 — Marketing site on Cloudflare Pages (~5 min)

1. https://dash.cloudflare.com → Pages → Create a project → Connect to GitHub → select `rxmax-app`.
2. **Build settings**:
   - Build command: *(leave empty)*
   - Build output directory: `marketing-site`
3. Deploy. You'll get `rxmax-app.pages.dev` immediately.

## Step 4 — DNS on Cloudflare so rxmax.online works (~10 min)

1. Cloudflare → Add a Site → `rxmax.online` → Free plan.
2. Cloudflare gives you 2 nameservers (e.g. `pablo.ns.cloudflare.com`). At Hostinger (or wherever you bought the domain): Domain → DNS / Nameservers → switch to those two. Propagation: typically 10–30 min.
3. Once active, in Cloudflare DNS add these records:

| Type  | Name   | Target                                       | Proxy |
|-------|--------|----------------------------------------------|-------|
| CNAME | @      | rxmax-app.pages.dev                          | Proxy |
| CNAME | www    | rxmax-app.pages.dev                          | Proxy |
| CNAME | app    | rxmax-patient-app.vercel.app                 | DNS   |
| CNAME | store  | rxmax-store-dashboard.vercel.app             | DNS   |
| CNAME | admin  | rxmax-admin-panel.vercel.app                 | DNS   |
| CNAME | api    | rxmax-backend-xxxx.onrender.com              | DNS   |

(For Vercel/Render, leave proxy **off** — they handle SSL themselves and the proxy interferes. Cloudflare Pages plays nicely with proxy on.)

4. In **each** Vercel project → Settings → Domains → add `app.rxmax.online`, `store.rxmax.online`, `admin.rxmax.online` respectively. Vercel verifies via the CNAME.
5. In Render → your service → Settings → Custom Domains → add `api.rxmax.online`. Same flow.
6. In Cloudflare Pages → your project → Custom domains → add `rxmax.online` and `www.rxmax.online`.

After this, all six links above are live with auto-SSL.

## Step 5 — Update API URL across the React apps

Once `api.rxmax.online` is live, in each Vercel project change the env var:
```
REACT_APP_API_URL = https://api.rxmax.online
```
Then redeploy the three frontends (Vercel → Deployments → ⋯ → Redeploy).

## Verification — what to click after deploy

In order:

1. `https://api.rxmax.online/api/health` → `{"status":"healthy"}`. If 502 for 30s on first hit, that's Render waking up.
2. `https://rxmax.online` → marketing page loads. Open DevTools → Network — should be all 200s.
3. `https://store.rxmax.online` → store login page. Login: `9876543200` / `demo123`.
4. `https://admin.rxmax.online` → admin login. Login: `9999999999` / `rxmaxadmin2026`.
5. `https://app.rxmax.online` → patient app loads. Login flow uses OTP (currently logs OTP to backend console — check Render logs).

## Cost summary

- Cloudflare DNS + Pages: **₹0**
- Vercel × 3 (Hobby plan): **₹0** for now; if traffic grows or you need analytics → Pro $20/mo per project.
- Render web + Postgres free: **₹0**; **upgrade to Starter ($7 + $7 = ~₹1200/mo)** before sending the link to retailers en masse, otherwise the first hit after a 15-min idle takes 30s and you'll lose them.
- Domain renewal: ~₹1700/yr.

**Realistic min-viable cost: ₹1,200/mo (Render Starter tiers). Everything else stays free at this scale.**

## What's NOT done yet (be honest)

- The marketing site is still the in-browser-Babel single-file build. It works and looks the same in the browser, but is slower on mid-range Android than a proper Vite build, and SEO crawlers will see an empty body. Productionizing it (Vite + proper SSR/SSG) is the next iteration once you've validated retailer interest with the current version.
- The `Register Your Pharmacy` form on the marketing page currently has no backend wired up. Either:
  - Hook it to `https://api.rxmax.online/api/leads` (need to build that route — small task), or
  - Use Cloudflare Pages built-in form handler / a free Formspree endpoint as a stop-gap.
- WhatsApp lead alerts via Gupshup require a Gupshup account + verified template. Without that, the backend is in mock mode and just logs.
- No Sentry / no uptime monitor yet. UptimeRobot has a free tier that pings `/api/health` every 5 min — strongly recommended before sharing widely.

## Subdomain CNAME quick reference

```
rxmax.online          CNAME  rxmax-app.pages.dev              # marketing
www.rxmax.online      CNAME  rxmax-app.pages.dev              # marketing
app.rxmax.online      CNAME  rxmax-patient-app.vercel.app     # patient
store.rxmax.online    CNAME  rxmax-store-dashboard.vercel.app # store dashboard
admin.rxmax.online    CNAME  rxmax-admin-panel.vercel.app     # admin panel
api.rxmax.online      CNAME  rxmax-backend-xxxx.onrender.com  # backend API
```
