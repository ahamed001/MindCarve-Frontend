import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/Feedback';
import { fetchCurrentUser } from './redux/thunks/authThunks';

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
};

export default App;
