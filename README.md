# Nourish frontend

Next.js 16 client for Laravel nutrition API. Run frontend and backend with `localhost` on both ports; browser session cookies need same host.

From project root, run in separate terminals:

```bash
cd backend && php artisan serve --host=localhost --port=8000
```

```bash
cd frontend && npm run dev
```

Frontend defaults to `http://localhost:8000`. Set `NEXT_PUBLIC_API_URL` at build time when API uses another origin. Backend `FRONTEND_URL` and CORS origin must match frontend URL. Keep Google and 9router secrets in backend `.env` only.

Photo analysis runs in database queue. Start separate worker with `cd backend && php artisan queue:work database --queue=photos --tries=2 --timeout=60`; camera falls back to editable manual entry when analysis is unavailable. Profile photos remain temporary until backend upload endpoint exists. Phone registration is enabled only in Laravel local/testing environments; password recovery is pending phone ownership verification.

Checks: `npm run lint`, `npx tsc --noEmit`, `node --test tests/*.mjs`.
