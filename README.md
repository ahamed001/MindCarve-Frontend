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

- `vercel.json` forwards `/api/*` to the backend (change the Render address there if yours differs) and sends every other path to `index.html`, so links like `/admin/login` open directly. Because the API is reached through this site, the login cookie works in every browser.
- Vercel environment variables: `VITE_API_BASE_URL=/api` and `VITE_SOCKET_URL=https://your-backend.onrender.com` (live updates connect straight to the backend; Vercel can't forward WebSockets). Redeploy after changing them.
- On the backend, add this site to `CLIENT_URL`.

To run this frontend against the deployed backend, set `VITE_API_PROXY=https://your-backend.onrender.com` in `.env` and keep `VITE_API_BASE_URL=/api`.
