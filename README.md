# Vort License API & Admin Panel

This project provides an Express-based admin panel (SB Admin 2 UI) and a REST API for managing licenses, scripts, and bot authentication sessions.

## Requirements

- Node.js 18+
- MySQL (configured via `DATABASE_URL` in `.env`)
- npm

## Installation

```bash
npm install
npx prisma migrate dev   # create/update the database schema
npx prisma generate      # generate Prisma client
npm run seed             # optional, seed the admin user
```

## Running

```bash
npm run dev   # development
npm start     # production (build first)
```

Admin panel is available at `http://localhost:3000/admin`. Default seed credentials (if you ran `npm run seed`): `admin / password`.

---

## REST API: Bot Authentication

Base URL: `http://localhost:3000/api`

### General Rules

- All responses use HTTP 200 with a JSON body describing success or error.
- Request body must be JSON.
- Required fields: `license`, `bot_userid`, `hwid`.

### POST `/api/auth/token`

Request:

```json
{
  "license": "GROW-ABCD-1234-X9",
  "bot_userid": "MyBot123",
  "hwid": "HWID_HASH"
}
```

Success response:

```json
{
  "status": "success",
  "token": "random_token",
  "expired_at": "2025-11-15T13:11:00.000Z"
}
```

Error response example:

```json
{
  "status": "error",
  "message": "License not found."
}
```

Possible error messages:

- `license, bot_userid, and hwid are required.`
- `License not found.`
- `License is not active.`
- `License expired.`
- `License is bound to another user.`
- `License is bound to another device.`
- `License is already in use.`

Internal checks:

1. Validate required fields.
2. Find license; check status/expiry.
3. Bind user/hwid if not already bound; otherwise enforce match.
4. Remove expired sessions.
5. Ensure active session count < `max_devices` unless reusing same user/hwid.
6. Generate token (valid 3 minutes), upsert session, log `success`.

### POST `/api/auth/logout`

Request:

```json
{
  "license": "GROW-ABCD-1234-X9",
  "bot_userid": "MyBot123",
  "hwid": "HWID_HASH"
}
```

Success response:

```json
{
  "status": "success",
  "message": "Logout successful."
}
```

Any error returns `{ "status": "error", "message": "..." }`. Even if no session existed, logout returns success and logs the event.

---

## Admin Panel Features

- **Users CRUD**: Manage admin logins (role-based).
- **Scripts CRUD**: Register script metadata or upload files stored under `/public/uploads/scripts`. Licenses reference scripts via dropdowns.
- **Licenses CRUD**: Generate keys (format `GROW-XXXX-XXXX-XX`), set max devices, bind/unbind users/devices, view sessions/logs.
- **Active Sessions**: Display per-license sessions and reset bindings.

---

## Testing

```bash
npm test
```

Unit tests cover core routes (e.g., `/api/auth/token`, `/api/auth/logout`) using mocks (`tests/api/auth.test.ts`). Add additional tests under `tests/`, and they will be picked up automatically by Jest.

---

## Key Generation

Generate secure Base64 keys (e.g., for JWT secret) via:

```bash
npm run key:generate
```

Optionally pass a byte length: `npm run key:generate -- 64`.

---

## Logging

Server logs go to `logs/app.log`. Logs for API usage (success/error/logout) are stored in the `license_logs` table.

---

## Environment Variables (`.env`)

```env
PORT=3000
LOG_LEVEL=debug
APP_URL=http://localhost:3000
JWT_SECRET=change-me
ENCRYPTION_KEY=rcKNGSv0y6t55LmFOJEqxBF8EevFhPvVFr2HKzP8GkUdtL84tZAOBEK/mo/4KzoI
DATABASE_URL="mysql://root@localhost:3306/vort_license"

# optional SMTP for reset emails
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="License Admin <mailer@example.com>"
```

Ensure `uploads/scripts` directory exists (it’s created automatically on upload) and `logs/` is writable.

---

## Deployment (Ubuntu VPS with domain `vort.zenby.my.id`)

Example steps for deploying on Ubuntu 22.04+:

1. **Provision server & DNS**
   - Point the domain `vort.zenby.my.id` to your VPS IP (A record).

2. **Install dependencies**
   ```bash
   sudo apt update
   sudo apt install -y curl build-essential
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   npm install -g pm2
   ```

3. **Clone project & configure**
   ```bash
   git clone <repo> /var/www/vort-license
   cd /var/www/vort-license
   cp .env.example .env   # adjust DATABASE_URL, JWT_SECRET, etc.
   npm install
   npx prisma migrate deploy
   npm run build
   ```

4. **Run with PM2**
   ```bash
   pm2 start dist/server.js --name vort-license --cwd /var/www/vort-license
   pm2 save
   pm2 startup
   ```

5. **Set up reverse proxy (nginx + SSL)**
   ```bash
   sudo apt install -y nginx
   sudo nano /etc/nginx/sites-available/vort
   ```
   Example config:
   ```
   server {
     listen 80;
     server_name vort.zenby.my.id;

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```
   Enable & reload:
   ```bash
   sudo ln -s /etc/nginx/sites-available/vort /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

6. **HTTPS with Certbot**
   ```bash
   sudo snap install core; sudo snap refresh core
   sudo snap install --classic certbot
   sudo ln -s /snap/bin/certbot /usr/bin/certbot
   sudo certbot --nginx -d vort.zenby.my.id
   ```
   Certbot updates the nginx config automatically and handles renewals.

7. **Monitoring & updates**
   - Check logs via `pm2 logs vort-license` or `tail -f logs/app.log`.
   - Pull updates (`git pull`), reinstall deps if needed, rebuild (`npm run build`), and restart `pm2 restart vort-license`.
   - Production build output lives in `/var/www/vort-license/dist`.
