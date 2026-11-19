# Athma Mind Care — Frontend

The web app for **Athma Mind Care**, a patient assessment platform for a mental health hospital.

- **Patients** register, log in and take standard mental-health questionnaires. Every answer saves as they go.
- **Hospital staff** see patients, their answers and scores, build and publish questionnaires, print reports, and follow the activity feed and audit log, all updating live.

> This project was built as part of an interview process at **MindCarve**. It is meant to be cloned and run on your own machine.

Live: https://mind-carve-frontend.vercel.app (staff: `/admin/login`)

## Tech stack

| What it's for | What it uses |
| --- | --- |
| UI | React 18, built with Vite |
| Styling | Tailwind CSS |
| App state & API calls | Redux Toolkit (slices + thunks), Axios. API addresses live in one place (`networkString.js` → `networkService.js` → thunk → slice) |
| Pages & protected routes | React Router 6 (separate patient and staff areas, by role) |
| Forms & validation | Formik + Yup |
| Login / session | JWT kept by the backend in an HttpOnly cookie. The app never sees or stores the token |
| Live updates (no page refresh) | Socket.IO client: answers, new patients, submissions and quiz changes appear instantly; other tabs sign out when a session ends |
| Charts | Recharts |
| Icons | react-icons |

All scores are calculated on the backend; the frontend only displays them.

## Run it locally

Start the backend (`MindCarve-Backend`) first, then:

```bash
git clone <repository-url>
cd MindCarve-Frontend
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

The app expects the backend at `http://localhost:4500` (Vite proxies `/api` and `/socket.io` to it). Patients use `/register` and `/login`; staff use `/admin/login`.

## Deploying (Vercel)

- `vercel.json` sends every path to `index.html`, so links like `/admin/login` open directly.
- Set `VITE_API_BASE_URL` in Vercel to your backend, e.g. `https://your-backend.onrender.com/api`, then redeploy. Socket.IO connects to the same backend.
- On the backend, add this site to `CLIENT_URL`.
