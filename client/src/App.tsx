import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AdminDashboard from '@/pages/dashboard/Admin';
import SecretaryDashboard from '@/pages/dashboard/Secretary';
import DoctorDashboard from '@/pages/dashboard/Doctor';
import PatientDashboard from '@/pages/dashboard/Patient';
import Forbidden from '@/pages/Forbidden';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="403" element={<Forbidden />} />

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="dashboard/admin" element={<AdminDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={['ADMIN', 'SECRETARY']} />}>
            <Route path="dashboard/secretary" element={<SecretaryDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={['DOCTOR']} />}>
            <Route path="dashboard/doctor" element={<DoctorDashboard />} />
          </Route>
          <Route element={<ProtectedRoute roles={['PATIENT']} />}>
            <Route path="dashboard/patient" element={<PatientDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
