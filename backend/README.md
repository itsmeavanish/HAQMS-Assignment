# HAQMS Backend - Node + Express + Prisma API Server

This is the Express API server and database layer for the Hospital Appointment & Queue Management System.

## 🚀 Running the API
The backend server runs on port `5000` by default.

## Environment

Create a local `.env` by copying the example and filling secrets:

```bash
cp .env.example .env
# edit backend/.env to set local values (do not commit this file)
```

If `.env` was accidentally committed, untrack it and add it to `.gitignore`:

```bash
git rm --cached backend/.env
git commit -m "remove secret .env from repo"
```

## Production deployment (quick start)

The fastest path to production is to provision a managed Postgres database (Supabase, Railway, Heroku, DigitalOcean, AWS RDS) and store secrets in your platform's secret manager. Below are copy-paste steps:

1. Provision a managed Postgres DB (example: Supabase)
	 - Create a new project and note the connection string from project settings.
	 - Ensure SSL is required by appending `&sslmode=require` if not present.

2. Update your production secrets (in your host/platform):

```
NODE_ENV=production
PORT=5000
JWT_SECRET=<strong-random-secret-from-vault>
DATABASE_URL=<your-postgres-connection-string>?schema=public&sslmode=require
```

3. Prisma migrations

If you switch from the default SQLite datasource to Postgres, update `prisma/schema.prisma` datasource provider to `postgresql`:

```prisma
datasource db {
	provider = "postgresql"
	url      = env("DATABASE_URL")
}
```

Then run migrations against the production DB (in CI or from a safe admin machine):

```bash
# generate client and apply migrations
npx prisma migrate deploy
npx prisma generate
```

If your migration workflow requires a shadow DB (Prisma creates temporary DBs during some actions), set `SHADOW_DATABASE_URL` in CI.

4. Deploy backend

- Option A (Docker Compose on a VM): create a `docker-compose.prod.yml` that references your `DATABASE_URL` and run `docker compose up -d`.
- Option B (Platform): Deploy to Heroku / Railway / DigitalOcean App Platform / Azure App Service and set the env vars in their UI.

5. Frontend

Set `NEXT_PUBLIC_API_URL` in your frontend hosting provider to `https://your-api-host.example.com/api`.

Security & Operations
- Use managed DB with backups and monitoring.
- Store secrets in a vault and grant minimal privileges to the DB user.
- Rotate `JWT_SECRET` periodically and ensure tokens are invalidated on rotation if necessary.

### Setup Database Environment
1. Ensure a local PostgreSQL instance is running or launch the pre-packaged docker container.
2. Build migrations and run the mock seed:
```bash
npm run db:setup
```

### Start Development Server
```bash
npm run dev
```

## 🔍 Candidate Scope
Analyze, profile, secure, and refactor files inside `src/` and `prisma/`:
- **SQL Injection**: Resolve raw interpolation queries in `src/routes/doctors.js`.
- **N+1 Database Queries**: Optimize appointments aggregation inside `src/routes/appointments.js`.
- **Concurrency Race Conditions**: Secure `src/routes/queue.js` token increments.
- **Weak Authorization**: Patch route security in `src/routes/patients.js`.
- **Schema Optimization**: Introduce proper constraints and indexes in `prisma/schema.prisma`.
