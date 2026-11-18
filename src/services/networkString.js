// Single source of truth for every API endpoint used by the client.
export const NetworkString = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    verifyInvitation: '/auth/invitations/verify',
    acceptInvitation: '/auth/invitations/accept',
    forgotPassword: '/auth/password/forgot',
    resetPassword: '/auth/password/reset',
  },
  dashboard: {
    overview: '/dashboard/overview',
  },
  patients: {
    list: '/patients',
    create: '/patients',
    detail: (id) => `/patients/${id}`,
    update: (id) => `/patients/${id}`,
    status: (id) => `/patients/${id}/status`,
    resendInvitation: (id) => `/patients/${id}/invitation/resend`,
    assignments: (id) => `/patients/${id}/assignments`,
    results: (id) => `/patients/${id}/results`,
    report: (id) => `/patients/${id}/report`,
    notes: (id) => `/patients/${id}/notes`,
  },
  assessments: {
    list: '/assessments',
    detail: (id) => `/assessments/${id}`,
    questions: (id) => `/assessments/${id}/questions`,
  },
  assignments: {
    list: '/assignments',
    status: (id) => `/assignments/${id}/status`,
    submission: (id) => `/assignments/${id}/submission`,
    report: (id) => `/assignments/${id}/report`,
  },
  results: {
    review: (id) => `/results/${id}/review`,
    calculate: (assignmentId) => `/results/assignment/${assignmentId}/calculate`,
  },
  reports: {
    list: '/reports',
    generate: '/reports',
    detail: (id) => `/reports/${id}`,
    download: (id) => `/reports/${id}/download`,
  },
  activity: {
    list: '/activity',
  },
  audit: {
    list: '/audit',
  },
  portal: {
    quizzes: '/me/quizzes',
    startQuiz: (assessmentId) => `/me/quizzes/${assessmentId}/start`,
    assignment: (id) => `/me/assignments/${id}`,
    saveProgress: (id) => `/me/assignments/${id}/responses`,
    submit: (id) => `/me/assignments/${id}/submit`,
  },
};
