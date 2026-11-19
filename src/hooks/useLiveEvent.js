import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getSocket } from '../services/socket';

/**
 * Runs `handler` whenever the server pushes `event`. Bursts (e.g. a patient clicking answers quickly) are
 * grouped: the handler runs once, `delay` ms after the last event, with the latest payload.
 */
export const useLiveEvent = (event, handler, { delay = 500 } = {}) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const connected = useSelector((s) => s.ui.liveConnected);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    let timer;
    const listener = (payload) => {
      clearTimeout(timer);
      timer = setTimeout(() => handlerRef.current(payload), delay);
    };
    socket.on(event, listener);
    return () => {
      clearTimeout(timer);
      socket.off(event, listener);
    };
  }, [event, delay, connected]);
};
