# Rezidence-2

Mode-aware React application with demo/live runtime resolution, provider-based services,
gateways, centralized request workflow, and CI/CD verification.

## Requirements

- Node.js 20+
- npm 10+

## Local development

```bash
npm install
npm start
```

## Verification shortcuts

Focused mode/services test suite:

```bash
npm run test:mode-services
```

Focused verification (focused tests + production build):

```bash
npm run verify:mode-services
```

Full verification (all unit tests + production build):

```bash
npm run verify:all
```

## CI

GitHub Actions workflow `CI` runs on pushes to `main` and on pull requests:

- `npm ci`
- `npm run verify:all`

See: `.github/workflows/ci.yml`.

## GitHub Pages deployment

GitHub Actions workflow `Deploy Pages` builds with repository-relative `PUBLIC_URL`
and publishes the `build/` folder to the `gh-pages` branch.

See: `.github/workflows/pages.yml`.

If Pages is not yet visible, ensure repository settings are configured to serve from
the `gh-pages` branch (`/root`).

## Architecture notes

- FSD roots: `src/app`, `src/entities`, `src/features`, `src/shared`
- Runtime mode resolution: `src/config/runtimeMode.js`
- Service providers/container: `src/services/providers/*`
- Mode-aware gateways: `src/services/*Gateway.js`
- Request workflow helpers: `src/domain/requestWorkflow.js`
- Sync feedback helpers: `src/ui/syncFeedback.js`
- Pass API layer: `src/shared/api/passesApi.js` (`getPasses`, `createPass`, `validatePass`, `logVisit`)

Additional analysis/migration notes live in `docs/analysis/`.
