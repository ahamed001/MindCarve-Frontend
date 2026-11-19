# Athma Mind Care — Frontend

The web app for **Athma Mind Care**, a patient assessment platform for a mental health hospital.

- **Patients** register, log in and take standard mental-health questionnaires. Every answer saves as they go.
- **Hospital staff** see patients, their answers and scores, print reports, and follow the activity feed and audit log.

Built with React, Redux Toolkit and Tailwind CSS.

> This project was built as part of an interview process at **MindCarve**. It is meant to be cloned and run on your own machine.

## Run it locally

Start the backend (`MindCarve-Backend`) first, then:

```bash
git clone <repository-url>
cd MindCarve-Frontend
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

The app expects the backend at `http://localhost:4500`. Patients use `/register` and `/login`; staff use `/admin/login`.
