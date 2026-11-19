import { createSlice, nanoid } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [], liveConnected: false },
  reducers: {
    showToast: {
      reducer: (state, action) => {
        state.toasts.push(action.payload);
      },
      prepare: ({ message, tone = 'success' }) => ({ payload: { id: nanoid(), message, tone } }),
    },
    setLiveConnected: (state, action) => {
      state.liveConnected = action.payload;
    },
    dismissToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { showToast, dismissToast, setLiveConnected } = uiSlice.actions;
export default uiSlice.reducer;
