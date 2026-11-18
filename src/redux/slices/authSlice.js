import { createSlice } from '@reduxjs/toolkit';
import { acceptInvitation, fetchCurrentUser, login, logout } from '../thunks/authThunks';

const initialState = {
  user: null,
  // 'checking' until the session cookie has been verified with the server
  status: 'checking',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired: (state) => {
      state.user = null;
      state.status = 'anonymous';
    },
  },
  extraReducers: (builder) => {
    const setUser = (state, action) => {
      state.user = action.payload.user;
      state.status = 'authenticated';
    };
    const clear = (state) => {
      state.user = null;
      state.status = 'anonymous';
    };
    builder
      .addCase(login.fulfilled, setUser)
      .addCase(acceptInvitation.fulfilled, setUser)
      .addCase(fetchCurrentUser.fulfilled, setUser)
      .addCase(fetchCurrentUser.rejected, clear)
      .addCase(logout.fulfilled, clear)
      .addCase(logout.rejected, clear);
  },
});

export const { sessionExpired } = authSlice.actions;
export const selectAuth = (state) => state.auth;
export default authSlice.reducer;
