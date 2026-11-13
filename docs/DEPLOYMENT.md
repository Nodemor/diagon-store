# Diagon Store — Deployment (Ubuntu 24.04 VPS)

How the shop runs on a VPS, how to set up a new server, and how updates reach it automatically.

---

## How it works

```
 GitHub (Nodemor/diagon-store)                          VPS (Ubuntu 24.04)
 ─────────────────────────────                          ──────────────────────────────────────────────
 pull request → CI (tests, lint, build)                 nginx :80/:443
 merge to main → CI runs again on main  ──────┐           ├─ /            → frontend/dist (the shop)
                                              │           └─ /api /uploads /s /sitemap.xml /robots.txt
                                              │                          → API on 127.0.0.1:5000 (systemd)
                                              │         MariaDB (localhost only)
                                              └──────▶  auto-deploy timer, every minute:
                                                          new commit on main + CI passed?
                                                          → deploy.sh: install, migrate, build, restart,
                                                            health check (rolls back if it fails)
```

- **The server pulls updates; GitHub doesn't push them.** No SSH keys or passwords are stored on GitHub. The repo is public, so the server needs no GitHub login.
- **Only commits that pass CI are deployed.** A failed commit is skipped; the next good one is deployed.
- **Uploaded photos live outside the code** (`/var/lib/diagon-store/uploads`), so deploys never touch them.

| What | Where |
|---|---|
| Code | `/var/www/diagon-store` (user `diagon`) |
| API settings | `/var/www/diagon-store/backend/.env` (secrets, `chmod 600`) |
| Shop build settings | `/var/www/diagon-store/frontend/.env` (`VITE_ADMIN_PATH_HASH`) |
| Photos | `/var/lib/diagon-store/uploads` |
| Deploy log | `/var/lib/diagon-store/deploy/deploy.log` |
| Backups | `/var/backups/diagon-store` (nightly, 14 days) |
| Secret back-office address | `/root/diagon-store-admin-address.txt` |
| nginx site | `/etc/nginx/sites-available/diagon-store` |
| Services | `diagon-store` (API), `diagon-store-deploy.timer`, `diagon-store-backup.timer` |

---

## 1. Set up a new server (once, about 10 minutes)

1. Sign in to the VPS as root (Hostinger: hPanel → VPS → **Browser terminal**, or `ssh root@<server IP>`).
2. Run:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/Nodemor/diagon-store/main/deploy/setup-vps.sh -o setup-vps.sh
   sudo bash setup-vps.sh --demo
   ```

   Leave out `--demo` for an empty shop without the demo products.
   With a domain already pointing to the server, add `--domain yourdomain.lk --email you@example.com` to get HTTPS straight away.

3. At the end it asks for the **first admin**: email, name and password (typing hidden).
4. It prints the shop address and the **secret back-office address**. Save the back-office address in your password manager; it's also in `/root/diagon-store-admin-address.txt`.

The script installs nginx, MariaDB, Node.js 24, a firewall (SSH, HTTP and HTTPS only) and fail2ban. It creates the database with a random password and the session secret, deploys the shop, and turns on auto-deploy and nightly backups. Running it again is safe: settings, passwords and data are kept.

## 2. Domain and HTTPS

1. At your domain registrar (or Hostinger → Domains → DNS), add an **A record** for `@` pointing to the server's IP. Add another for `www` if you want it.
2. Wait until it resolves (`ping yourdomain.lk` shows the server IP), then run:

   ```bash
   sudo bash /var/www/diagon-store/deploy/enable-https.sh yourdomain.lk you@example.com
   ```

This gets a free Let's Encrypt certificate (renewed automatically), redirects http to https, and switches the shop settings (`SITE_URL`, `CLIENT_URL`, secure cookie) to the domain.

**Admin sign-in needs HTTPS** in production. Before the domain is set up, the shop runs on `http://<server IP>` with `COOKIE_SECURE=false` so you can look around. Turn HTTPS on before real customers use it.

## 3. After setup

- Back office → **Settings**: WhatsApp number, email, address, social links.
- Order emails: fill in the `SMTP_*` settings (see `backend/.env.example`) in `backend/.env`, set `EMAIL_ENABLED=true`, then `sudo systemctl restart diagon-store`.
- SSH hardening (recommended): add your SSH key (`ssh-copy-id root@<server IP>` from your PC), check you can sign in with it, then set `PasswordAuthentication no` in `/etc/ssh/sshd_config` and `sudo systemctl restart ssh`.

---

## Updating the shop

Merge a pull request into `main`. That's it.

1. GitHub Actions runs CI on `main` (about 3 minutes).
2. Within a minute after CI passes, the server deploys it (1–3 minutes) and the new version is live.

Follow along on the server:

```bash
tail -f /var/lib/diagon-store/deploy/deploy.log      # deploy history
journalctl -u diagon-store-deploy -f                 # what auto-deploy is doing right now
```

| Task | Command (on the server) |
|---|---|
| Deploy now (the newest main) | `sudo -u diagon -H /var/www/diagon-store/deploy/deploy.sh` |
| Deploy a specific commit (e.g. roll back) | `sudo -u diagon -H /var/www/diagon-store/deploy/deploy.sh <commit>` |
| Pause / resume auto-deploy | `sudo systemctl stop diagon-store-deploy.timer` / `start` |
| Retry a commit that failed | `sudo rm /var/lib/diagon-store/deploy/failed` |
| API status and logs | `systemctl status diagon-store` · `journalctl -u diagon-store -n 100` |
| Restart the API | `sudo systemctl restart diagon-store` |
| Change settings | edit `backend/.env`, then `sudo systemctl restart diagon-store` |
| New back-office admin password | `sudo -u diagon -H bash -c 'cd /var/www/diagon-store/backend && node create-admin.js --reset'` |
| Backup now | `sudo systemctl start diagon-store-backup` |

**Database changes** run automatically on deploy (`prisma migrate deploy`). They can't be rolled back by the deploy script, so keep them additive: add columns and tables, and remove old ones in a later release.

If a deploy fails (build error, or the new API doesn't start), `deploy.sh` puts the previous version back. It records the commit in `deploy/failed` so it isn't retried, and logs the reason.

---

## Backups and restore

Nightly at 02:30 (Sri Lanka time): a database dump and the photos are written to `/var/backups/diagon-store`, and kept for 14 days. **Copy them off the server regularly** (download with `scp`, or sync to cloud storage). Hostinger's VPS snapshots are a good extra layer.

```bash
# restore the database
gunzip -c /var/backups/diagon-store/db-<date>.sql.gz | sudo mysql diagon_store
# restore photos
sudo tar -xzf /var/backups/diagon-store/uploads-<date>.tar.gz -C /var/lib/diagon-store
sudo systemctl restart diagon-store
```

## Moving to a new server

1. Run the setup on the new server.
2. Copy the latest backup across and restore it (above).
3. Copy `backend/.env` from the old server, so the same `JWT_SECRET` and settings are kept, but keep the new server's `DATABASE_URL`.
4. Copy `frontend/.env` too, to keep the same back-office address.
5. Run `sudo -u diagon -H /var/www/diagon-store/deploy/deploy.sh`, point the DNS to the new IP, and run `enable-https.sh`.

---

## CI (GitHub Actions)

| Workflow | Runs on | Checks |
|---|---|---|
| `.github/workflows/ci.yml` | every PR and push to `main` | API tests against MariaDB, shop lint + build, `npm audit`, deploy-script syntax + shellcheck |
| `.github/workflows/vps-setup-test.yml` | PRs that change `deploy/` | Runs `setup-vps.sh` on a fresh Ubuntu 24.04 machine and checks the shop, link previews, headers, admin sign-in, auto-deploy and backups |

To require CI before merging, an organisation admin can add a branch rule: GitHub → repo **Settings → Branches → Add rule** for `main` → "Require status checks to pass".
