# Belhaven assessment portal

Separate Next.js application for Belhaven Montessori School. The repository root remains the existing public website; deploying that root does not deploy this portal.

## Current status

Implementation draft. Production build, TypeScript, calculation/password/session unit tests and anonymous HTTP access checks pass. No production database is connected and no school records are seeded. Authenticated database workflows and visual export checks must pass before school use.

Implemented areas include role-based sessions, forced password changes, account lockout, staff assignments, student registration/import/archive, 30/70 scoring, scorebook publication, draft/review resources, file storage, Word/PDF export routes, administrator student preview, and audit records. The optional preview reads published results without changing passwords or replacing the administrator session.

Remaining acceptance work includes database integration tests for every role, polished report tables and export rendering, report attendance/remarks editing, complete multiweek schemes and lesson generation, subject-specific question-paper structures and replacement, configurable grading/curriculum, and desktop/mobile visual validation. Current grade boundaries are provisional A80/B70/C60/D50/E40/F and must be confirmed before use. Do not describe this draft as production-ready.

## Local development

Use Node.js 22.18+ and pnpm. Run commands from this directory:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm exec tsc --noEmit
pnpm build
node tests/smoke.mjs
```

`tests/smoke.mjs` starts its own temporary production server and checks the empty setup state, security headers, anonymous route denial, and cross-origin rejection. It intentionally has no database credentials. It does not replace authenticated integration testing.

## Empty database setup

Create a dedicated Belhaven PostgreSQL project in the school-approved organisation. Do not reuse another school's database. Set environment variables using `.env.example` as the key list, never committing their values. No public environment variables or browser database keys are needed.

- `DATABASE_URL`: server-only PostgreSQL connection string with verified TLS; use the provider's pooler when deploying to Vercel.
- `SESSION_SECRET`: randomly generated secret of at least 32 characters.
- `APP_ORIGIN`: exact HTTPS portal origin for request-origin checks.
- `STUDENT_OVERRIDE_SECRET`: optional separate random secret for administrator previews.
- `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`: used only once for setup; password 12–128 characters.

Apply migrations using `pnpm migrate`, then run `pnpm bootstrap` with bootstrap credentials supplied through the process environment. Neither script automatically reads `.env.local`; load it explicitly with Node's `--env-file` option for local setup. Remove bootstrap secrets after account creation. The administrator must change the temporary password on first login.

The migration is additive, uses `bms_` table names and creates no students, staff or assessment records. Row-level security denies direct Data API access; access is through the application's authenticated server routes using a trusted database connection. No client-facing RLS policies are intentionally supplied. Keep credentials privileged only on the server.

## Vercel

Create a separate Vercel project using this repository and Root Directory `assessment`, with the Next.js preset and the committed pnpm lockfile. Supply production environment values in Vercel, run database setup, and verify role workflows before publishing portal links on the public website. Do not change the repository-root static website configuration to deploy this application.

Do not seed production with test people or marks. Run authenticated integration tests only against a dedicated disposable test database. Preserve existing academic records through subsequent migrations.
