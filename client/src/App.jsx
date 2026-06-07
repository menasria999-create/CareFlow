import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// صفحات المصادقة
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';  // ✅ تمت الإضافة
import ResetPassword from './pages/auth/ResetPassword';

// صفحات المريض
import PatientDashboard from './pages/patient/Dashboard';
import PatientAppointments from './pages/patient/Appointments';
import MedicalRecords from './pages/patient/MedicalRecords';
import AddMedicalRecord from './pages/patient/AddMedicalRecord';
import Prescriptions from './pages/patient/Prescriptions';
import Profile from './pages/patient/Profile';
import PatientConsultations from './pages/patient/Consultations';

// صفحات الطبيب
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorProfile from './pages/doctor/Profile';
import DoctorPatients from './pages/doctor/Patients';
import PatientDetails from './pages/doctor/PatientDetails';
import DoctorConsultations from './pages/doctor/Consultations';

// صفحات الإدارة
import AdminDashboard from './pages/admin/Dashboard';
import AdminProfile from './pages/admin/Profile';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';

// صفحات موظف الاستقبال
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import ReceptionistProfile from './pages/receptionist/Profile';
import RegisterPatient from './pages/receptionist/RegisterPatient';

// مكون حماية المسارات
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={styles.loading}>جاري التحميل...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* صفحات المصادقة */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />  {/* ✅ تمت الإضافة */}
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* صفحات المريض */}
                    <Route 
                        path="/patient" 
                        element={
                            <ProtectedRoute allowedRoles={['patient']}>
                                <PatientDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/patient/dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['patient']}>
                                <PatientDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/patient/profile" 
                        element={
                            <ProtectedRoute allowedRoles={['patient']}>
                                <Profile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/patient/appointments" 
                        element={
                            <ProtectedRoute allowedRoles={['patient']}>
                                <PatientAppointments />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/patient/prescriptions" 
                        element={
                            <ProtectedRoute allowedRoles={['patient']}>
                                <Prescriptions />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/patient/records" 
                        element={
                            <ProtectedRoute allowedRoles={['patient']}>
                                <MedicalRecords />
                            </ProtectedRoute>
                        } 
                    />
                    {/* المسار الجديد للسجل الطبي حسب الطبيب */}
                    <Route 
                        path="/patient/records/doctor/:doctorId" 
                        element={
                            <ProtectedRoute allowedRoles={['patient']}>
                                <MedicalRecords />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/patient/add-record" 
                        element={
                            <ProtectedRoute allowedRoles={['patient']}>
                                <AddMedicalRecord />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/patient/consultations" 
                        element={
                            <ProtectedRoute allowedRoles={['patient']}>
                                <PatientConsultations />
                            </ProtectedRoute>
                        } 
                    />

                    {/* صفحات الطبيب */}
                    <Route 
                        path="/doctor" 
                        element={
                            <ProtectedRoute allowedRoles={['doctor']}>
                                <DoctorDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/doctor/dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['doctor']}>
                                <DoctorDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/doctor/profile" 
                        element={
                            <ProtectedRoute allowedRoles={['doctor']}>
                                <DoctorProfile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/doctor/patients" 
                        element={
                            <ProtectedRoute allowedRoles={['doctor']}>
                                <DoctorPatients />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/doctor/patients/:id" 
                        element={
                            <ProtectedRoute allowedRoles={['doctor']}>
                                <PatientDetails />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/doctor/consultations" 
                        element={
                            <ProtectedRoute allowedRoles={['doctor']}>
                                <DoctorConsultations />
                            </ProtectedRoute>
                        } 
                    />

                    {/* صفحات الإدارة */}
                    <Route 
                        path="/admin" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/profile" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminProfile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/users" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminUsers />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin/settings" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminSettings />
                            </ProtectedRoute>
                        } 
                    />

                    {/* صفحات موظف الاستقبال */}
                    <Route 
                        path="/receptionist" 
                        element={
                            <ProtectedRoute allowedRoles={['receptionist']}>
                                <ReceptionistDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/receptionist/dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['receptionist']}>
                                <ReceptionistDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/receptionist/profile" 
                        element={
                            <ProtectedRoute allowedRoles={['receptionist']}>
                                <ReceptionistProfile />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/receptionist/register-patient" 
                        element={
                            <ProtectedRoute allowedRoles={['receptionist']}>
                                <RegisterPatient />
                            </ProtectedRoute>
                        } 
                    />

                    {/* الصفحة الافتراضية */}
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

const styles = {
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#1976d2',
    },
};

export default App;