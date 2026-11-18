import { createSlice } from '@reduxjs/toolkit';
import { addResourceCases, resourceState, stripMeta } from './helpers';
import { fetchMyAssignment, fetchMyQuizzes, saveProgress, submitAssessment } from '../thunks/portalThunks';

const portalSlice = createSlice({
  name: 'portal',
  initialState: {
    quizzes: resourceState([]),
    session: resourceState(),
    saveState: { status: 'idle', lastSavedAt: null, error: null },
  },
  reducers: {
    resetSession: (state) => {
      state.session = resourceState();
      state.saveState = { status: 'idle', lastSavedAt: null, error: null };
    },
  },
  extraReducers: (b) => {
    addResourceCases(b, fetchMyQuizzes, 'quizzes', (p) => p.items);
    addResourceCases(b, fetchMyAssignment, 'session', stripMeta);
    b.addCase(saveProgress.pending, (state) => {
        state.saveState.status = 'saving';
        state.saveState.error = null;
      })
      .addCase(saveProgress.fulfilled, (state, action) => {
        state.saveState = { status: 'saved', lastSavedAt: action.payload.lastSavedAt, error: null };
        if (state.session.data?.assignment.status === 'assigned') state.session.data.assignment.status = 'in_progress';
      })
      .addCase(saveProgress.rejected, (state, action) => {
        state.saveState.status = 'error';
        state.saveState.error = action.payload?.message;
      })
      .addCase(submitAssessment.fulfilled, (state, action) => {
        if (state.session.data) {
          state.session.data.assignment.status = 'completed';
          state.session.data.assignment.completedAt = action.payload.completedAt;
        }
      })
      // Matchers run after the case reducer registered by addResourceCases, so this does not conflict with it.
      .addMatcher(fetchMyAssignment.fulfilled.match, (state, action) => {
        state.saveState.lastSavedAt = action.payload.lastSavedAt;
      });
  },
});

export const { resetSession } = portalSlice.actions;
export default portalSlice.reducer;
