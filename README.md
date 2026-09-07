# Hangtuah Jakarta — Project Management (Kanban)

Kanban-style project management for Hangtuah Basketball Club divisions (Marketing, Merchandiser, Creative).

**Live path:** `https://radr.nxtdev.xyz/hangtuahpm`

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma 6
- Custom JWT auth (username/password, admin-issued temp passwords)
- dnd-kit Kanban + SSE realtime
- Hangtuah "Rise Stronger" brand theme (navy / sky / red)

## Roles

| Role | Access |
|------|--------|
| **STAFF** | Own division workspace(s) only |
| **LEADERSHIP** | All workspaces + Fight Night dashboard |
| **ADMIN** | Full CRUD on users, workspaces, boards, tasks |

## Local development

Requires PostgreSQL 16+ on your machine (or the VPS). Create DB + role:

```bash
sudo -u postgres psql -c "CREATE USER hangtuahpm_app WITH PASSWORD 'hangtuahpm_dev';"
sudo -u postgres psql -c "CREATE DATABASE hangtuahpm OWNER hangtuahpm_app;"
```

Then:

```bash
cp .env.example .env
# edit DATABASE_URL / JWT_SECRET if needed
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3001/hangtuahpm/login](http://localhost:3001/hangtuahpm/login)

> This Mac workspace does not ship with Postgres — run migrate/seed on the VPS (or any machine with Postgres) before first login.

### Seeded accounts (must change password on first login)

| Username | Temp password | Role |
|----------|---------------|------|
| `admin` | `Hangtuah!Admin1` | ADMIN |
| `lead1` | `Hangtuah!Lead1` | LEADERSHIP |
| `mkt.staff` | `Hangtuah!Staff1` | STAFF (Marketing) |

## VPS deploy (PM2 + Nginx, no Docker)

Target: `/var/www/hangtuahpm` on the box that serves `radr.nxtdev.xyz`.

```bash
# on VPS
sudo mkdir -p /var/www/hangtuahpm /var/hangtuahpm/uploads /var/log/hangtuahpm /var/backups/hangtuahpm
sudo chown -R $USER:$USER /var/www/hangtuahpm /var/hangtuahpm/uploads

# sync code, then:
cd /var/www/hangtuahpm
cp .env.example .env   # set production secrets
npm ci
npx prisma migrate deploy
npx prisma db seed
npm run build
mkdir -p /var/log/hangtuahpm
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Include [`deploy/nginx-hangtuahpm.conf`](deploy/nginx-hangtuahpm.conf) in the Nginx server block, then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Nightly backup (optional cron)

```bash
0 2 * * * pg_dump hangtuahpm | gzip > /var/backups/hangtuahpm/hangtuahpm-$(date +\%F).sql.gz
```

## Brand

Visual identity follows the Nov 2025 *Rise Stronger* rebrand:

- Official Hangtuah Jakarta crest (from hangtuah.id / IBL club logo CDN)
- Navy `#0B1F3A`, Sky `#0F8BF6`, Fight Red `#C8102E`
- Display font: Barlow Condensed
- Assets in `public/brand/`

### Imagery credits

- Login hero: [Photo by Kin Li on Unsplash](https://unsplash.com/photos/photo-1568861660872-cef3f9846366)
- Fight Night dashboard hero: [Photo by Syah on Unsplash](https://unsplash.com/photos/photo-1771882856158-c8e083134ee3)
- Club logo: Hangtuah Jakarta / IBL official crest (downloaded from hangtuah.id)

## License

Private — Hangtuah Jakarta.
