# FIT IT — Deploy (second app on the same Windows server as PULSE)

FIT IT is a fully separate app: its own folder (`C:\fitit`), its own database, its own
Windows service (`fitit-api`, port **4001**), its own IIS site, its own domain. It shares
nothing with PULSE at runtime. The original `DEPLOY.md` still explains every concept —
this file is just the FIT IT-specific values.

## 0. One-time prerequisites (already on the server from PULSE)
Node 20, ffmpeg, NSSM, IIS + ARR + WebSockets — nothing new to install.

## 1. DNS
Add an A-record for `fitit.grand-hub.com` pointing at the server's IP. (To change the
domain later: `apps\web\.env` → `VITE_SITE_ORIGIN`, the server `.env` → `WEB_ORIGIN`,
and the IIS binding.)

## 2. Bundle (dev machine)
```powershell
powershell -File F:\FITIT\deploy\make-bundle.ps1     # -> F:\fitit-bundle.zip
# copy to the server, then:
```

## 3. Server: extract + environment
```powershell
Expand-Archive C:\fitit-bundle.zip -DestinationPath C:\fitit -Force
notepad C:\fitit\.env
```
`C:\fitit\.env` — start from `.env.example` with these FIT IT values (generate FRESH
secrets — never reuse PULSE's):
```
DATABASE_URL="file:./prod.db"
PORT=4001                      # PULSE owns 4000 on this server
NODE_ENV=production
WEB_ORIGIN=https://fitit.grand-hub.com
JWT_ACCESS_SECRET=<new random 64 chars>
MEDIA_SIGN_SECRET=<new random 64 chars>
UPLOAD_DIR=../../uploads
# SMTP: can reuse the same Gmail/Brevo account; set SMTP_FROM appropriately
# VAPID keys: generate NEW ones (npx web-push generate-vapid-keys) — push
# subscriptions are per-app; reusing PULSE's keys cross-wires notifications
# OAuth: create a NEW Google client for the FIT IT domain (or leave blank — email login works)
```

## 4. Server: install (idempotent — also the update command forever after)
```powershell
powershell -ExecutionPolicy Bypass -File C:\fitit\deploy\install.ps1 -Nssm C:\nssm\nssm.exe
```
Defaults are already FIT IT: Root `C:\fitit`, site `fitit`, service `fitit-api`,
host `fitit.grand-hub.com`. The bundled `deploy\iis\web.config` already proxies to **:4001**.
The installer seeds diet programs + paths; the Egyptian Carrefour prize challenge is
deliberately NOT seeded here.

## 5. Content seeds (once, on the server)
```powershell
cd C:\fitit
node node_modules\tsx\dist\cli.mjs prisma\seed.ts               # programs, recipes, articles, exercises
node node_modules\tsx\dist\cli.mjs prisma\seed-engagement.ts    # badges + challenges
node node_modules\tsx\dist\cli.mjs prisma\seed-demo-fitit.ts    # OPTIONAL: demo users/coaches/gym (test1234) — testing only, skip for real launch
```
English-only brand: skip every `prisma\ar\*` script and `translate-manual.ts`.

## 6. HTTPS
Run win-acme (`wacs.exe`), pick the `fitit` site → free cert + 443 binding, same as PULSE.

## 7. Verify
- https://<domain> loads with the FIT IT gold/black theme and English UI
- `http://localhost:4001/api/health` on the server returns ok
- Register a test account → Admin → make it ADMIN in `C:\fitit\prod.db` context (or
  via the first-user flow you used on PULSE)

## Updating later
Rebuild the zip on the dev machine, copy, extract over `C:\fitit`, re-run the installer.
`C:\fitit\.env`, `prod.db` and `uploads\` are never inside the bundle, so they survive.

## Gotchas specific to running BOTH apps on one server
- Ports: PULSE api = 4000, FIT IT api = 4001. Each app's `web.config` proxies to its own.
- Services: `pulse-api` and `fitit-api` are independent — stopping one never touches the other.
- Backups: FIT IT's nightly backup lands in `C:\fitit\backups` (or its `BACKUP_DIR`) —
  add it to the same off-site copy job as PULSE's.
