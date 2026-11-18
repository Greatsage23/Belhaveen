# Voting system: Vercel deployment and election operations

The school homepage stays at belhaveen.vercel.app. `/voting` uses the assessment Next.js project. This system uses standard PostgreSQL (`pg`) and has no Supabase SDK, authentication or storage dependency. Candidate photographs are resized on the server and stored persistently in PostgreSQL, never the Vercel function filesystem.

## Database connection

1. In Vercel, open **belhaveen-assessment → Storage → Connect Database**. Choose a PostgreSQL provider such as Neon from the Vercel Marketplace. Review its plan before creating the database. Connect it to Production and the appropriate Preview environments; use a separate database for previews that must not affect school data.
2. Set server-only `DATABASE_URL` to the provider's pooled PostgreSQL connection URL with TLS. An optional `SESSION_SECRET` can override the random signing key created in the private `bms_auth_secrets` table during production setup. Keep `APP_ORIGIN=https://belhaveen.vercel.app`. Do not prefix secrets with `NEXT_PUBLIC_` or commit `.env` files.
3. Deploy the GitHub main branch. The assessment production build automatically applies pending migrations, creates a private signing key and creates the initial administrator only when no administrator exists. Preview builds skip this setup. A database connection failure stops the new deployment rather than silently publishing an unconfigured app.
4. Initial administrator username and password are both `administrator`. Sign in and choose a private password. Existing administrator accounts and records are preserved. Data from another provider is not copied automatically; keep the source database until any required records have been migrated and verified.
5. Keep the root project's `/voting`, `/api/*` and `/_next/*` rewrites. Complete a demo ballot before opening real voting. For manual/local setup, use `pnpm migrate` and `pnpm bootstrap` with a securely supplied DATABASE_URL and SESSION_SECRET.


## Election preparation

- Sign in through **Voting System → ADMINISTRATOR**. Only the administrator role can view election totals, manage nominations or download reports.
- Create and order portfolios. Add candidates with class and a JPG, PNG or WebP photograph under 3 MB. Photos are decoded, stripped of metadata and resized to 480×600 WebP.
- Select **DEMO MODE**, start voting and rehearse on the actual devices. Results poll every two seconds and report connection errors. Demo and real records are independent.
- Reset demo votes before changing nominations. Once any ballots exist, or real voting has started, nomination changes are locked. Resetting real voting requires the current administrator password and the exact warning phrase. Resets erase ballots/codes only in the chosen mode and leave an administrative audit record.
- In Settings, optionally enable single-use codes. Generate/download codes and give one to each eligible voter. Code hashes are stored independently of ballots; the database does not link a code to a student or ballot. Codes expire when that mode is reset.
- Switch to REAL MODE, confirm the nominations and start the election. Without codes, this is a supervised kiosk system: it prevents repeat HTTP submissions, not the same person deliberately casting another ballot. Supervisors must manage eligibility and turns. Use codes for an election accessible outside supervised devices.
- Pause or close voting from Overview. Closing prevents further submissions. Export reports from Download Reports. A tied highest total is shown as a tie, never arbitrarily resolved.

## Integrity and limitations

A completed ballot and all votes commit atomically. A unique random submission identifier makes retries idempotent. The client stores only that opaque identifier and a fingerprint while a submission is unresolved; it never stores candidate selections. The server locks election settings while validating submissions and administrative changes, checks every active portfolio and candidate membership, and atomically consumes optional codes. This intentionally serializes ballot writes, appropriate for a school election; load-test for the expected turnout before production.

Students do not authenticate and cannot request results, individual ballots or audit records. Anonymous ballot rows contain no student identity or code. This is not a cryptographic end-to-end verifiable election system. Administrative and database access should remain limited to authorised school staff. Backups and recovery follow the selected database provider's plan.

Legacy voting tables are preserved by migration 006. Legacy `/api/voting` payloads no longer submit votes. New elections start empty in demo mode. No real candidates or votes are fabricated.

## Verification

Run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm build`. Before the official election also verify against the connected PostgreSQL instance: complete ballot, double-click/retry, two requests using the same code, pause during submission, demo/real separation, non-administrator report denial, mobile voting, photo upload and all report downloads. Local build/unit checks alone do not establish live database readiness.
