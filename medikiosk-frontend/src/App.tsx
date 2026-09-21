import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { PatientSessionProvider } from './features/patient/PatientSessionContext';
import { DoctorAuthContextProvider } from './features/auth/DoctorAuthContext';
import { DemoIntelligenceProvider } from './demo/context/DemoIntelligenceContext';

function App() {
  return (
    <DemoIntelligenceProvider>
      <DoctorAuthContextProvider>
        <PatientSessionProvider>
          <RouterProvider router={router} />
        </PatientSessionProvider>
      </DoctorAuthContextProvider>
    </DemoIntelligenceProvider>
  );
}

export default App;
