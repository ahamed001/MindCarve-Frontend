import { createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Wraps an async NetworkService call in createAsyncThunk.
 * Fulfilled payload: the API envelope's `data` (plus `message`); rejected payload: { status, message, errors }.
 */
export const createApiThunk = (type, request) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      const envelope = await request(arg);
      if (envelope && typeof envelope === 'object' && 'success' in envelope) {
        return { ...(envelope.data ?? {}), __message: envelope.message };
      }
      return envelope;
    } catch (error) {
      return rejectWithValue(error);
    }
  });
