import { configureStore } from '@reduxjs/toolkit';
import authReducer, { sessionExpired } from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import portalReducer from './slices/portalSlice';
import { activityReducer, assessmentsReducer, dashboardReducer, patientsReducer, reportsReducer } from './slices/adminSlices';
import { setUnauthorizedHandler } from '../services/networkService';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    dashboard: dashboardReducer,
    patients: patientsReducer,
    assessments: assessmentsReducer,
    reports: reportsReducer,
    activity: activityReducer,
    portal: portalReducer,
  },
});

// Any 401 from a protected endpoint ends the client session (server already rejected the cookie).
setUnauthorizedHandler(() => {
  if (store.getState().auth.status === 'authenticated') store.dispatch(sessionExpired());
});
