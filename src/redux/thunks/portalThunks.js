import { NetworkService } from '../../services/networkService';
import { NetworkString } from '../../services/networkString';
import { createApiThunk } from './createApiThunk';

const P = NetworkString.portal;

export const fetchMyAssignment = createApiThunk('portal/assignment', (id) => NetworkService.get(P.assignment(id)));
export const saveProgress = createApiThunk('portal/saveProgress', ({ id, answers }) => NetworkService.put(P.saveProgress(id), { answers }));
export const submitAssessment = createApiThunk('portal/submit', ({ id, answers }) => NetworkService.post(P.submit(id), { answers }));
export const fetchMyQuizzes = createApiThunk('portal/quizzes', () => NetworkService.get(P.quizzes));
export const startQuiz = createApiThunk('portal/startQuiz', (assessmentId) => NetworkService.post(P.startQuiz(assessmentId)));
