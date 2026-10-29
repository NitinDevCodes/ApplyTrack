# Verification — October 29, 2026

## Vercel deployment preparation — October 29, 2026

- Ran the production build and complete test suite using **Node.js 24.22.1** on Windows: **19 passed, 0 failed**.
- The original 13 integration checks still pass. Added coverage for the real root API entry point, production cookie flags, trusted-origin enforcement, query strings, session restoration and logout revocation, concurrent connection initialization, retry after failure, connection reuse/reopening, production configuration validation, sanitized failures, and the request body limit.
- Tests use an isolated local MongoDB instance; they do not read or write Atlas application records. The sandbox initially denied loopback connections (`EACCES`); rerunning with local network access passed.
- Corrected only the duplicated `MONGODB_URI=` prefix in the local environment file. Verified that the credentials and other settings were preserved and that the resulting URI parses as an Atlas connection to `applytrack`. No credential values were printed.
- Validated the routing configuration with Vercel's official `@vercel/routing-utils` 6.6.1 in an ignored temporary cache, without adding project dependencies. Confirmed static-file precedence, API routing (including `/api` and `/api/`), SPA fallback paths, and no injected query parameters. This also confirmed why unnamed captures are required with the API's strict query validation.
- This verifies application code on Node 24, not a public deployment. Live Atlas credentials/network access, Linux function bundling, Vercel CDN routing/security headers, forwarded IPs, and production/preview browser behavior remain to be verified during deployment. No application was deployed.

The sections below record the earlier local UI verification before the Vercel adapter was added.

## Environment

- Windows, Node.js 26.3.0, npm 11.16.0.
- MongoDB 8.3.11, reused from the installed executable with ApplyTrack-only data directories.
- Vite 7.3.7; exact dependency versions are recorded in `package-lock.json`.

## Automated checks

Final `npm test`: **13 passed, 0 failed**, following a successful Vite production build.

The suite covers protected endpoints, registration/validation, bcrypt hashes, cookie flags, login, application CRUD, all statuses, per-user ownership on list/read/update/delete/dashboard, search/filter/sort/pagination, literal regex searches, invalid/unsafe input, CSRF origin checks, dashboard aggregation, upcoming interviews, logout token revocation, authentication rate limiting, and serving the React production build.

The initial sandboxed run could not connect to loopback MongoDB (`EACCES`). The same tests passed with local network access. No tests were skipped or replaced with mocks.

## Browser checks

Verified against the running React + Express + MongoDB application:

- Registration and initial empty dashboard.
- Creation with company, title, type, location, URL, stipend, application date and notes.
- Inline status change from Applied to Interview.
- Editing the title, notes, and local interview date/time.
- Upcoming interview and dashboard counts updated after saving.
- Search with no matches, clear filters, status filters, and date-sort controls.
- Delete confirmation, cancel, then confirmed deletion; empty list and zero counts afterward.
- Logout, login, and session restoration after a browser reload.
- Session/account persistence after stopping and restarting `dev:local`.
- Desktop layout at 1366px and mobile layout at 390px, including mobile navigation.
- Mobile document width matched its viewport after fixing table header overflow.
- No browser console errors or warnings in the inspected final session.

Browser testing found and fixed two issues: native date inputs were not reliably synchronizing their value, and an absolutely positioned accessible table label caused mobile page overflow. Both were rechecked in the browser, followed by another successful build and full integration test run.

The dashboard screenshot uses a fictional account and a disposable test application. The application was deleted through the UI. It is not seeded data or a real job application.

## Scope

Verified locally. Atlas connectivity, public deployment, TLS/reverse-proxy configuration, and a cross-browser compatibility matrix were not tested. Production static serving and Secure cookie flags were verified in integration tests.
