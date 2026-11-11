# Diagon Store — Security

This doc covers how the shop and its back office are protected, how to set up the private admin address and admin accounts, and the checklist to complete before going live.

The protections are checked by automated tests: `cd backend && npm test`, 16 tests (see `backend/tests/security.test.js`).

---

## What's protected and how

| Area | Protection |
|---|---|
| **Admin address** | The back office lives at a secret path, e.g. `/door-k7m2x9pq4w8r3t`. The site's code holds only its **SHA-256 hash**. The browser hashes the first part of every unknown address and opens the back office only on a match. `/admin` and every guess show the normal "page not found", and `robots.txt` doesn't mention the back office. |
| **Admin sessions** | Signed token in an **httpOnly, SameSite=Strict, Secure** cookie scoped to `/api/admin`. Page scripts can't read it, so a script-injection bug can't steal it, and other sites can't send it. Sessions last 8 hours (`JWT_EXPIRES_IN`). |
| **Ending sessions** | Each admin has a session version in the database. **Sign out, a password change, a role change or blocking the account** bumps it, and every older session stops working immediately on every device. |
| **Request forgery (CSRF)** | 1. The SameSite=Strict cookie.<br>2. Every state-changing admin request (sign-in included) must carry the `X-Requested-With: DiagonStore` header that only the shop's own code sends. The CORS policy only allows the shop's own address. |
| **Password guessing** | An account locks after **5 wrong passwords in a row for 15 minutes** (`MAX_FAILED_LOGINS`, `LOCK_MINUTES`). There's also a per-IP limit of 10 failed sign-ins per 15 minutes, and a general limit of 600 API requests per IP per 5 minutes. A wrong email and a wrong password get the same message after the same delay, so attackers can't find out which accounts exist. Locks are written to the server log as `[security] …`. |
| **Passwords** | bcrypt (cost 12). Rules:<br>• 12+ characters, with letters and numbers<br>• not the email or the name<br>• not a common password<br>Admin passwords are typed at the terminal (`npm run create-admin`, input hidden), never stored in files. |
| **Signing secret** | The server refuses to start in production with a missing, short (< 32 characters) or placeholder `JWT_SECRET`. In development it warns. |
| **Roles** | `SUPER_ADMIN` manages admin users. `ADMIN` does everything else. Nobody can block, demote or delete their own account. |
| **Input** | Every request body, query and URL parameter is validated (Zod), and the database is accessed only through Prisma, with no hand-built SQL from user input. |
| **Rich text** | Product descriptions and pages are cleaned **on the server** before saving (sanitize-html: no scripts, event handlers or `javascript:` links). They're cleaned **again in the browser** before display (DOMPurify). |
| **Uploads** | Allowed types and a size limit; random file names. **The file contents are checked** with sharp, so a renamed script or HTML file is rejected and deleted. Very large "decompression bomb" images are refused. Uploads can't be used to read files outside the upload folder. |
| **Customer data** | Order tracking needs the order number **and** the phone number used for the order (rate-limited, never cached). Internal admin notes are never sent to customers. |
| **Spam** | Honeypot fields and per-IP limits on orders (10/hour) and contact messages (5/hour). |
| **HTTP headers** | helmet on the API (CSP, nosniff, frame and referrer rules, no `X-Powered-By`). The web server adds the site's headers; see the nginx example below. |
| **Dependencies** | `npm audit` shows 0 known vulnerabilities in both apps (Nov 2026). Re-run monthly. |

---

## Set up the private admin address

1. Generate an address and its hash:

   ```bash
   cd frontend
   npm run admin-path                 # random, e.g. /door-k7m2x9pq4w8r3tq2zh8m
   # or choose your own (16+ characters): npm run admin-path -- my-secret-door-2026
   ```

2. Put the printed `VITE_ADMIN_PATH_HASH=…` line in `frontend/.env`, or in your hosting's build settings, and rebuild.
3. Keep the address itself private. Bookmark it and share it only with the shop team. It is **not** stored in the code or in `.env`.
4. To change it, run the command again, replace the hash and rebuild. The old address then shows "page not found".

Without a hash (local development) the back office is at `/admin`.

> The hidden address is an **extra layer**. It stops bots and guessers from even finding the sign-in page. The real lock is still the password, the lockout and the session protections above. Keep strong passwords even with a secret address.

## Admin accounts

| Task | How |
|---|---|
| First admin | `cd backend && npm run create-admin`. It asks for email, name and password (hidden). |
| Forgotten password / locked out | `npm run create-admin -- --reset`. Sets a new password, unlocks the account and signs it out everywhere. |
| More admins | Back office → Admin users (super admins only) |
| Leaving staff | Back office → Admin users → turn off "Can sign in", or remove the account. Their sessions end immediately. |
| Change your password | Back office → My account. Your other devices are signed out. |

---

## Before going live (checklist)

- [ ] **HTTPS only.** Install a certificate (e.g. Let's Encrypt) and redirect http → https.
- [ ] `NODE_ENV=production` in `backend/.env`, which makes the session cookie HTTPS-only.
- [ ] **New `JWT_SECRET`**: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- [ ] **Database:**
  - [ ] A dedicated MySQL user with a strong password (never `root`).
  - [ ] MySQL not reachable from the internet.
- [ ] `CLIENT_URL` and `SITE_URL` set to the exact `https://` shop address.
- [ ] **Secret admin address:** `VITE_ADMIN_PATH_HASH` set and the frontend rebuilt.
- [ ] **Admin accounts:**
  - [ ] Created with `npm run create-admin`.
  - [ ] Test and demo admins removed.
  - [ ] No `ADMIN_*` lines left in any `.env`.
- [ ] The API listens on `127.0.0.1` only (`HOST=127.0.0.1`), behind the web server below.
- [ ] Backups: daily database dump + `backend/uploads`, kept off the server.
- [ ] `npm audit` clean in both apps, and Node.js on a supported LTS version.

### Example web server (nginx)

The shop and the API share one address. The API is never exposed directly.

```nginx
server {
    listen 443 ssl http2;
    server_name diagonstore.lk;
    # ssl_certificate / ssl_certificate_key …

    root /var/www/diagon-store/frontend/dist;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com; connect-src 'self'; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;

    location /api/          { proxy_pass http://127.0.0.1:5000; include /etc/nginx/proxy_params; client_max_body_size 12m; }
    location /uploads/      { proxy_pass http://127.0.0.1:5000; }
    location = /sitemap.xml { proxy_pass http://127.0.0.1:5000; }
    location = /robots.txt  { proxy_pass http://127.0.0.1:5000; }

    # the single-page app: every other address is handled by the shop (including the secret admin address)
    location / { try_files $uri /index.html; }
}

server { listen 80; server_name diagonstore.lk; return 301 https://$host$request_uri; }
```

`proxy_params` passes `X-Forwarded-For` and `X-Forwarded-Proto`. The API trusts one proxy hop for correct client IPs in the rate limits.

---

## Known limitations

- **An old demo password is in the git history.** `Admin@12345` was committed before Phase 0. It isn't used anywhere, so just never use it. Removing it would mean rewriting the shared history.
- **Admin sessions are cookies.** Admins must use the shop's own address (the same origin as the API). That is the reason for the `/api` proxy in development and in nginx.
- **No two-factor sign-in yet.** Candidate for a future phase if the shop grows its staff.

## Reporting a problem

If you find a security issue, tell the shop owner privately (don't open a public GitHub issue) with steps to reproduce it.
