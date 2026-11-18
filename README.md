# Athma Mind Care Hospital — Frontend

React web app for the Athma patient assessment platform: the admin panel (Overview, Patients, Questions & Answers,
Reports, Activity) and the patient portal (registration, login, Take a Quiz).
It talks to the API in the separate `MindCarve-Backend` project.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

Start the backend first (`npm run dev` in `MindCarve-Backend`, port 4500). In development Vite proxies `/api` to
`http://localhost:4500` so the HttpOnly session cookie stays same-origin. To use another backend address, set
`VITE_API_PROXY` before running, e.g. `VITE_API_PROXY=http://localhost:5000 npm run dev`.

`npm run build` creates a production build in `dist/`.

## Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base path for API calls (default `/api`) |

## Pages

| URL | Who | Page |
| --- | --- | --- |
| `/login` | Patients | Two-panel login (email can be pre-filled from the welcome email link) |
| `/register` | Patients | Self-registration with searchable State dropdown and error summary |
| `/setup-account`, `/forgot-password`, `/reset-password` | Patients / staff | Invitation and password flows |
| `/patient/quizzes` | Patients | **Take a Quiz** — one card per published assessment |
| `/patient/assessments/:id` | Patients | Quiz screen: info panel, questions, question blocks; every answer saves on click; **Submit answers** continues to the next quiz |
| `/admin/login` | Staff | Staff login |
| `/admin/overview` | Staff | KPIs, assessments by day, risk levels, latest activity |
| `/admin/patients`, `/admin/patients/:id` | Staff | Patient list (declaration filter) and patient detail |
| `/admin/submissions/:assignmentId` | Staff | Submitted responses and calculated scores |
| `/admin/questions`, `/admin/questions/:id` | Staff | Assessment library and quiz detail (Attempt ID lookup) |
| `/admin/reports` | Admin | Generate and download PDF/XLSX reports |
| `/admin/activity` | Staff | Activity timeline |

## Architecture

```
NetworkString → NetworkService → Redux Thunk → Redux Slice → Page
```

- `src/services/networkString.js` — every API endpoint (no hardcoded URLs elsewhere).
- `src/services/networkService.js` — the only HTTP client (`get`, `post`, `put`, `patch`, `del`, `getBlob`), cookies included.
- `src/redux/thunks/` — all API calls; `src/redux/slices/` — state; pages dispatch thunks and read with `useSelector`.
- Forms use Formik + Yup; styling uses Tailwind with the Athma palette (`tailwind.config.js`); charts use Recharts.

```
src/
  assets/  components/  hooks/  layouts/  routes/  services/  utils/
  redux/   slices/ thunks/ store.js
  pages/   auth/  admin/{overview,patients,questions,reports,activity}  patient/{quizzes,assessments}
```
