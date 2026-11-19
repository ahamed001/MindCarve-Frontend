import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket, disconnectSocket } from '../services/socket';
import { sessionExpired } from '../redux/slices/authSlice';
import { setLiveConnected, showToast } from '../redux/slices/uiSlice';

const ENDED = {
  deactivated: 'Your account has been deactivated. Please contact the hospital.',
  email_changed: 'Your login email was changed. Please use the new invitation email to sign in.',
  password_changed: 'Your password was changed. Please sign in again.',
  signed_out: 'You signed out in another tab.',
};

/** Keeps one live connection open while someone is signed in, and reacts to account-wide events. */
const LiveBridge = () => {
  const dispatch = useDispatch();
  const { status, user } = useSelector((s) => s.auth);
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (status !== 'authenticated') return undefined;
    const socket = connectSocket();
    const staff = user?.role !== 'patient';
    const onConnect = () => dispatch(setLiveConnected(true));
    const onDisconnect = () => dispatch(setLiveConnected(false));
    // This account was signed out elsewhere (password reset, email change, deactivated): leave immediately.
    const onEnded = ({ reason } = {}) => {
      dispatch(sessionExpired());
      dispatch(showToast({ message: ENDED[reason] || 'Your session has ended. Please sign in again.', tone: 'error' }));
    };
    // Staff get a short heads-up for the moments that matter; screens refresh themselves.
    const onActivity = (a) => {
      if (a.action === 'assessment.completed' || a.action === 'patient.registered') dispatch(showToast({ message: a.message }));
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('session:ended', onEnded);
    if (staff) socket.on('activity:new', onActivity);
    if (socket.connected) onConnect();
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('session:ended', onEnded);
      socket.off('activity:new', onActivity);
      disconnectSocket();
      dispatch(setLiveConnected(false));
    };
  }, [status, userId, user?.role, dispatch]);

  return null;
};

export default LiveBridge;
