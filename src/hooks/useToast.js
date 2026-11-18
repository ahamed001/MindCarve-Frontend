import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../redux/slices/uiSlice';

/** Stable helpers so components can report success/error of an unwrapped thunk consistently. */
export const useToast = () => {
  const dispatch = useDispatch();
  return useMemo(
    () => ({
      success: (message) => dispatch(showToast({ message, tone: 'success' })),
      error: (err) => dispatch(showToast({ message: err?.message || String(err), tone: 'error' })),
    }),
    [dispatch],
  );
};
