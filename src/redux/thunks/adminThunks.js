import { NetworkService } from '../../services/networkService';
import { NetworkString } from '../../services/networkString';
import { createApiThunk } from './createApiThunk';

const S = NetworkString;

// Dashboard
export const fetchOverview = createApiThunk('dashboard/overview', () => NetworkService.get(S.dashboard.overview));

// Patients
export const fetchPatients = createApiThunk('patients/list', (params) => NetworkService.get(S.patients.list, params));
export const createPatient = createApiThunk('patients/create', (body) => NetworkService.post(S.patients.create, body));
export const fetchPatientDetail = createApiThunk('patients/detail', (id) => NetworkService.get(S.patients.detail(id)));
export const updatePatient = createApiThunk('patients/update', ({ id, data }) => NetworkService.put(S.patients.update(id), data));
export const setPatientStatus = createApiThunk('patients/status', ({ id, status }) => NetworkService.patch(S.patients.status(id), { status }));
export const resendInvitation = createApiThunk('patients/resendInvitation', (id) => NetworkService.post(S.patients.resendInvitation(id)));
export const assignAssessments = createApiThunk('patients/assign', ({ id, ...body }) => NetworkService.post(S.patients.assignments(id), body));
export const addClinicianNote = createApiThunk('patients/addNote', ({ id, body }) => NetworkService.post(S.patients.notes(id), { body }));

// Assignments, submissions & results
export const cancelAssignment = createApiThunk('assignments/cancel', (id) => NetworkService.patch(S.assignments.status(id), { status: 'cancelled' }));
export const fetchAssessmentSubmissions = createApiThunk('assignments/byAssessment', (assessmentId) =>
  NetworkService.get(S.assignments.list, { assessment: assessmentId, status: 'completed', limit: 8 }),
);
export const lookupAttempt = createApiThunk('assignments/lookupAttempt', (code) => NetworkService.get(S.assignments.byAttempt(code)));
export const fetchSubmission = createApiThunk('assignments/submission', (id) => NetworkService.get(S.assignments.submission(id)));
export const updateReviewStatus = createApiThunk('results/review', ({ resultId, reviewStatus }) =>
  NetworkService.patch(S.results.review(resultId), { reviewStatus }),
);

// Assessments & questions
export const fetchAssessments = createApiThunk('assessments/list', (params) => NetworkService.get(S.assessments.list, params));
export const fetchAssessment = createApiThunk('assessments/detail', (id) => NetworkService.get(S.assessments.detail(id)));
export const createAssessment = createApiThunk('assessments/create', (body) => NetworkService.post(S.assessments.create, body));
export const updateAssessment = createApiThunk('assessments/update', ({ id, data }) => NetworkService.put(S.assessments.update(id), data));
export const publishAssessment = createApiThunk('assessments/publish', (id) => NetworkService.post(S.assessments.publish(id)));
export const archiveAssessment = createApiThunk('assessments/archive', (id) => NetworkService.post(S.assessments.archive(id)));
export const restoreAssessment = createApiThunk('assessments/restore', (id) => NetworkService.post(S.assessments.restore(id)));
export const addQuestion = createApiThunk('questions/add', ({ id, data }) => NetworkService.post(S.assessments.questions(id), data));
export const updateQuestion = createApiThunk('questions/update', ({ questionId, data }) => NetworkService.put(S.assessments.question(questionId), data));
export const deleteQuestion = createApiThunk('questions/delete', (questionId) => NetworkService.del(S.assessments.question(questionId)));
export const reorderQuestions = createApiThunk('questions/reorder', ({ id, orderedIds }) => NetworkService.put(S.assessments.reorder(id), { orderedIds }));
export const createSection = createApiThunk('sections/create', ({ id, data }) => NetworkService.post(S.assessments.sections(id), data));
export const deleteSection = createApiThunk('sections/delete', ({ id, key }) => NetworkService.del(S.assessments.section(id, key)));

// Reports
export const fetchReports = createApiThunk('reports/list', () => NetworkService.get(S.reports.list));
export const generateReport = createApiThunk('reports/generate', (body) => NetworkService.post(S.reports.generate, body));
export const fetchReport = createApiThunk('reports/detail', (id) => NetworkService.get(S.reports.detail(id)));
export const downloadReport = createApiThunk('reports/download', async (id) => {
  const { blob, fileName } = await NetworkService.getBlob(S.reports.download(id));
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { fileName };
});

// Activity
export const fetchActivity = createApiThunk('activity/list', (params) => NetworkService.get(S.activity.list, params));
