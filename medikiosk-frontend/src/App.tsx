import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { PatientSessionProvider } from './features/patient/PatientSessionContext';

import { DoctorAuthContextProvider } from './features/auth/DoctorAuthContext';

function App() {
  return (
    <DoctorAuthContextProvider>
      <PatientSessionProvider>
        <RouterProvider router={router} />
      </PatientSessionProvider>
    </DoctorAuthContextProvider>
  );
}

export default App;
