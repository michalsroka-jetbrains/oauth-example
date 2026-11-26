
## API Backend start
1. Go to BE
``` bash
cd api
```
2. Run
``` bash
npm run dev
```

## Frontend
Build
``` bash
npm install
```
Run
1. Go to FE
``` bash
cd client
```
2. Run
``` bash
npm start
```

## Backend client
Compile backend services
``` bash
npx run build
```
Run
``` bash
npm run start
```

## Health check
The API answers `GET /api/health` with `{"status": "ok"}` and needs no sign-in.

## Audit log
Token events are appended to the file named by `AUDIT_LOG_PATH` (default `token-audit.jsonl`), one JSON line each.
