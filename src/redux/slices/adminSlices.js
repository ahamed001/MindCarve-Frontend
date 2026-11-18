import { createSlice } from '@reduxjs/toolkit';
import { addResourceCases, resourceState, stripMeta } from './helpers';
import * as t from '../thunks/adminThunks';

// ---------------------------------------------------------------- Dashboard
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { overview: resourceState() },
  reducers: {},
  extraReducers: (b) => addResourceCases(b, t.fetchOverview, 'overview', stripMeta),
});

// ---------------------------------------------------------------- Patients
const patientsSlice = createSlice({
  name: 'patients',
  initialState: {
    list: resourceState({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } }),
    detail: resourceState(),
    submission: resourceState(),
  },
  reducers: {
    clearPatientDetail: (state) => {
      state.detail = resourceState();
    },
  },
  extraReducers: (b) => {
    addResourceCases(b, t.fetchPatients, 'list', stripMeta);
    addResourceCases(b, t.fetchPatientDetail, 'detail', stripMeta);
    addResourceCases(b, t.fetchSubmission, 'submission', stripMeta);
    b.addCase(t.updatePatient.fulfilled, (state, action) => {
      state.detail.data = stripMeta(action.payload);
    })
      .addCase(t.setPatientStatus.fulfilled, (state, action) => {
        state.detail.data = stripMeta(action.payload);
      })
      .addCase(t.addClinicianNote.fulfilled, (state, action) => {
        if (state.detail.data) state.detail.data.notes = [stripMeta(action.payload), ...state.detail.data.notes];
      })
      .addCase(t.updateReviewStatus.fulfilled, (state, action) => {
        if (state.submission.data?.result) {
          state.submission.data.result = { ...state.submission.data.result, ...stripMeta(action.payload), reviewedBy: state.submission.data.result.reviewedBy };
        }
      });
  },
});

// ---------------------------------------------------------------- Assessments
const assessmentsSlice = createSlice({
  name: 'assessments',
  initialState: { list: resourceState([]), current: resourceState(), submissions: resourceState([]) },
  reducers: {},
  extraReducers: (b) => {
    addResourceCases(b, t.fetchAssessments, 'list', (p) => p.items);
    addResourceCases(b, t.fetchAssessment, 'current', stripMeta);
    addResourceCases(b, t.fetchAssessmentSubmissions, 'submissions', (p) => p.items);
    const setCurrent = (state, action) => {
      state.current.data = stripMeta(action.payload);
    };
    [t.updateAssessment, t.publishAssessment, t.archiveAssessment, t.restoreAssessment].forEach((thunk) => b.addCase(thunk.fulfilled, setCurrent));
    const markChanged = (state) => {
      if (state.current.data) state.current.data.hasUnpublishedChanges = true;
    };
    b.addCase(t.addQuestion.fulfilled, (state, action) => {
      state.current.data?.questions.push(stripMeta(action.payload));
      markChanged(state);
    })
      .addCase(t.updateQuestion.fulfilled, (state, action) => {
        const q = stripMeta(action.payload);
        const list = state.current.data?.questions || [];
        const i = list.findIndex((x) => x._id === q._id);
        if (i >= 0) list[i] = q;
        markChanged(state);
      })
      .addCase(t.deleteQuestion.fulfilled, (state, action) => {
        if (state.current.data) state.current.data.questions = action.payload.items;
        markChanged(state);
      })
      .addCase(t.reorderQuestions.fulfilled, (state, action) => {
        if (state.current.data) state.current.data.questions = action.payload.items;
        markChanged(state);
      })
      .addCase(t.createSection.fulfilled, (state, action) => {
        if (state.current.data) state.current.data.sections = action.payload.sections;
        markChanged(state);
      })
      .addCase(t.deleteSection.fulfilled, (state, action) => {
        if (state.current.data) state.current.data.sections = action.payload.sections;
        markChanged(state);
      });
  },
});

// ---------------------------------------------------------------- Reports
const reportsSlice = createSlice({
  name: 'reports',
  initialState: { index: resourceState({ definitions: [], reports: [] }) },
  reducers: {},
  extraReducers: (b) => {
    addResourceCases(b, t.fetchReports, 'index', stripMeta);
    b.addCase(t.generateReport.fulfilled, (state, action) => {
      state.index.data.reports.unshift(stripMeta(action.payload));
    }).addCase(t.fetchReport.fulfilled, (state, action) => {
      const report = stripMeta(action.payload);
      const i = state.index.data.reports.findIndex((r) => r._id === report._id);
      if (i >= 0) state.index.data.reports[i] = report;
    });
  },
});

// ---------------------------------------------------------------- Activity
const activitySlice = createSlice({
  name: 'activity',
  initialState: { feed: resourceState({ items: [], pagination: { page: 1, totalPages: 1 } }) },
  reducers: {},
  extraReducers: (b) =>
    addResourceCases(b, t.fetchActivity, 'feed', (payload, previous) => {
      const data = stripMeta(payload);
      // Page > 1 appends ("Load more"); page 1 replaces.
      if (data.pagination.page > 1 && previous) return { ...data, items: [...previous.items, ...data.items] };
      return data;
    }),
});

export const { clearPatientDetail } = patientsSlice.actions;
export const dashboardReducer = dashboardSlice.reducer;
export const patientsReducer = patientsSlice.reducer;
export const assessmentsReducer = assessmentsSlice.reducer;
export const reportsReducer = reportsSlice.reducer;
export const activityReducer = activitySlice.reducer;
