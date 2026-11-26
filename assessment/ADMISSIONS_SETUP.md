# Belhaven online admissions

Public portal: https://belhaveen.vercel.app/admissions

Staff dashboard: https://belhaveen.vercel.app/admissions/admin

Admissions uses the existing Vercel project and Neon PostgreSQL database. It does not require Supabase. Production deployment runs migration `020_admissions.sql`; it does not change existing student, voting or assessment records.

## Activate email and admissions

In **belhaveen-assessment → Settings → Environment Variables**, add these values for Production and redeploy:

- `ADMISSIONS_EMAIL_USER`: `greatsage33@gmail.com`
- `ADMISSIONS_EMAIL_PASSWORD`: a Google app password for that account, entered privately in Vercel. Do not use the normal Gmail password or commit the value to Git.
- `CRON_SECRET`: a cryptographically random secret of at least 32 characters, entered privately in Vercel. This authorises the daily notification and retention job.

Google app passwords require 2-Step Verification. See https://support.google.com/accounts/answer/185833. If this account cannot create an app password, an alternative transactional email provider must be configured before opening admission.

Sign in with an authorised school administrator account, open the admissions dashboard, and:

1. In Settings, send a test email and confirm receipt.
2. Check the contact information, requirements, letter wording, required documents, retention period and additional fields.
3. In Vacancies, set each class's capacity, year, dates and open/closed status. Initial classes are closed with zero capacity; no places are invented.
4. Open online admissions in Settings.
5. Complete an application with a designated test family email, verify delivery and review the full workflow before inviting families.

Parents verify their email with a ten-minute code and receive a two-hour HttpOnly session. They can save private drafts, apply for several children, upload documents, submit once, check progress, download acknowledgements and accept offers. No permanent parent admission account is created.

## School review

Submitted applications appear in the inbox, refreshed every 15 seconds. Staff can review documents, request information, schedule an interview in Ghana time, offer admission, waitlist or mark an application unsuccessful. Parents see public messages, never confidential remarks. A separate permission controls health/support fields. Only administrators manage settings, classes, staff permissions or deletion.

Offer and acceptance reserve a place. Capacity is checked while the admission class is locked in a database transaction. Enrolment requires an accepted offer, a unique student index and an actual school class/stream. Enrolment creates the existing student and parent dashboard accounts through the school's enrolment service.

Download individual acknowledgement, application and offer PDFs from the record. CSV exports are compatible with Excel and neutralise spreadsheet formulas. The report screen can be printed to PDF. The inbox currently displays the latest 5,000 submitted records; CSV export contains all submitted records.

## Privacy, retention and operations

- Documents are private PostgreSQL binary records, limited to 3 MB each. Images are decoded and re-encoded to remove metadata; PDFs are parsed and active-content markers rejected. Files are never served as executable HTML. Download links expire after two minutes. These checks are not a claim of antivirus scanning.
- The school must review the published privacy notice, access grants and retention period before collecting children's information. The application does not claim legal certification.
- The daily 08:00 UTC job retries queued notifications, sends approaching-deadline notices, removes drafts inactive for 30 days, removes unsuccessful applications older than the configured retention period, and expires verification/session/download records. It requires `CRON_SECRET`. Enrolled records are not automatically deleted. Review local record-keeping requirements before enabling this job.
- Gmail sending limits and delivery failures apply. Failed notifications remain in the queue; administrators can retry them. A parent can still see a committed status update if its notification fails. Consider a transactional provider if volume exceeds Gmail's limits.
- Configure and verify Neon backup/restore coverage for both application rows and binary documents. Backup configuration cannot be established by this repository; perform a restoration drill separately. Monitor database storage as uploads grow.
- Keep Vercel environment variables private. Keep Preview deployments isolated from the production database; production-only setup scripts never run during previews.
- Do not insert real applicant data into development tests. The PostgreSQL tests use an isolated in-memory database and fictional records.

## Validation

Run `pnpm test` and `pnpm build` in `assessment`, and `node scripts/check.mjs` from the repository root. Tests cover validation, transition and capacity rules, privacy filtering, spreadsheet injection, PostgreSQL persistence, duplicate references, private table access and file cleanup, plus existing school modules.

Email delivery and the complete live parent-to-enrolment workflow must be verified after the private email settings are supplied. No live applications or admission decisions should be fabricated to test production.
