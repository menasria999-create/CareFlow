import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ترجمة التخصصات للعرض فقط
const translateSpecialty = (specialty) => {
    const translation = {
        'Cardiology': 'أمراض القلب',
        'Dermatology': 'الأمراض الجلدية',
        'Orthopedics': 'العظام والمفاصل',
        'Pediatrics': 'طب الأطفال',
        'Neurology': 'الأعصاب',
        'العظام والمفاصل': 'العظام والمفاصل',
        'طب الأطفال': 'طب الأطفال',
        'الأمراض المزمنة': 'الأمراض المزمنة'
    };
    return translation[specialty] || specialty || 'عام';
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
};

const Appointments = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [showBooking, setShowBooking] = useState(false);
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState('');

    useEffect(() => {
        fetchAppointments();
        fetchSpecialties();
    }, []);

    useEffect(() => {
        if (showBooking) fetchSpecialties();
    }, [showBooking]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/patients/my-appointments');
            setAppointments(res.data.appointments || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSpecialties = async () => {
        try {
            const res = await api.get('/patients/specialties');
            setSpecialties(res.data || []);
        } catch (error) {
            console.error('Error fetching specialties:', error);
            setSpecialties([
                { specialization: 'العظام والمفاصل', doctors_count: 1 },
                { specialization: 'طب الأطفال', doctors_count: 1 },
                { specialization: 'الأمراض المزمنة', doctors_count: 1 }
            ]);
        }
    };

    const handleSpecialtySelect = (e) => {
        setSelectedSpecialty(e.target.value);
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        setBookingError('');
        setBookingSuccess('');

        if (!selectedSpecialty) {
            setBookingError('يرجى اختيار التخصص الطبي');
            return;
        }
        if (!appointmentDate) {
            setBookingError('يرجى اختيار التاريخ');
            return;
        }

        try {
            const doctorsRes = await api.get(`/patients/doctors/by-specialty/${encodeURIComponent(selectedSpecialty)}`);
            if (doctorsRes.data.length === 0) {
                setBookingError('لا يوجد أطباء متاحون في هذا التخصص حالياً');
                return;
            }
            const firstDoctor = doctorsRes.data[0];
            const defaultTime = '10:00';

            const response = await api.post('/patients/appointments', {
                doctor_id: firstDoctor.id,
                appointment_date: appointmentDate,
                appointment_time: defaultTime
            });

            if (response.data.success) {
                setBookingSuccess(`✅ تم حجز موعدك في تخصص ${translateSpecialty(selectedSpecialty)} بنجاح!`);
                fetchAppointments();
                setTimeout(() => {
                    setShowBooking(false);
                    setSelectedSpecialty('');
                    setAppointmentDate('');
                    setBookingSuccess('');
                }, 2000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            setBookingError(error.response?.data?.error || 'حدث خطأ في حجز الموعد');
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (window.confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) {
            try {
                const response = await api.put(`/patients/appointments/${appointmentId}/cancel`);
                if (response.data.success) {
                    alert('✅ تم إلغاء الموعد بنجاح');
                    setLoading(true);
                    await fetchAppointments();
                    setLoading(false);
                } else {
                    throw new Error(response.data.message);
                }
            } catch (error) {
                alert(error.response?.data?.error || '❌ حدث خطأ في إلغاء الموعد');
            }
        }
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/patient', icon: '/icons/home-3d.png' },
        { name: 'ملفي الشخصي', path: '/patient/profile', icon: '/icons/profile-3d.png' },
        { name: 'المواعيد', path: '/patient/appointments', icon: '/icons/appointments-3d.png' },
        { name: 'الوصفات', path: '/patient/prescriptions', icon: '/icons/prescriptions-3d.png' },
        { name: 'السجل الطبي', path: '/patient/records', icon: '/icons/records-3d.png' },
    ];

    if (loading) {
        return <div style={styles.loadingContainer}><div style={styles.loader}>جاري التحميل...</div></div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}>
                    <div style={styles.logoHealth}></div>
                </div>
                <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>
                        <img src="/icons/patient-avatar-3d.png" alt="صورة المريض" style={styles.avatarImg} />
                    </div>
                    <div style={styles.userName}>{user?.full_name}</div>
                    <div style={styles.userRole}>مريض(ة)</div>
                </div>
                <nav style={styles.nav}>
                    {menuItems.map((item) => (
                        <button key={item.path} onClick={() => navigate(item.path)} style={styles.navItem}>
                            <img src={item.icon} alt={item.name} style={styles.navIconImg} />
                            <span>{item.name}</span>
                        </button>
                    ))}
                    <button onClick={logout} style={styles.logoutButton}>
                        <img src="/icons/logout-3d.png" alt="تسجيل الخروج" style={styles.navIconImg} />
                        <span>تسجيل الخروج</span>
                    </button>
                </nav>
            </div>

            <div style={styles.mainContent}>
                <div style={styles.header}>
                    <h1>المواعيد</h1>
                    <button onClick={() => setShowBooking(true)} style={styles.bookButton}>
                        <img src="/icons/add-appointment-3d.png" alt="حجز موعد" style={styles.buttonIcon} />
                        حجز موعد جديد
                    </button>
                </div>

                <div style={styles.appointmentsList}>
                    <h3>مواعيدي القادمة</h3>
                    {appointments.length === 0 ? (
                        <div style={styles.emptyState}>
                            <img src="/icons/calendar-empty-3d.png" alt="لا توجد مواعيد" style={styles.emptyIconImg} />
                            <p>لا توجد مواعيد قادمة</p>
                        </div>
                    ) : (
                        appointments.map((appointment) => (
                            <div key={appointment.id} style={styles.appointmentCard}>
                                <div style={styles.appointmentDate}>
                                    <div style={styles.dateDay}>{formatDate(appointment.appointment_date)}</div>
                                </div>
                                <div style={styles.appointmentInfo}>
                                    <div style={styles.specializationName}>
                                        {translateSpecialty(appointment.specialty || appointment.doctor_specialty || 'عام')}
                                    </div>
                                    {appointment.type && (
                                        <div style={styles.appointmentType}>
                                            {appointment.type === 'teleconsultation' ? '📹 استشارة عن بُعد' : '🏥 في العيادة'}
                                        </div>
                                    )}
                                    {appointment.doctor_name && (
                                        <div style={styles.doctorName}>
                                            <img src="/icons/doctor-avatar-3d.png" alt="طبيب" style={styles.smallIcon} />
                                            د. {appointment.doctor_name}
                                        </div>
                                    )}
                                </div>
                                <div style={styles.appointmentStatus}>
                                    <span style={{
                                        ...styles.statusBadge,
                                        backgroundColor: appointment.status === 'scheduled' ? '#ff9800' : '#4caf50'
                                    }}>
                                        {appointment.status === 'scheduled' ? 'قيد الانتظار' : 'مؤكد'}
                                    </span>
                                    <button onClick={() => handleCancelAppointment(appointment.id)} style={styles.cancelButton}>
                                        <img src="/icons/cancel-3d.png" alt="إلغاء" style={styles.smallIcon} />
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showBooking && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h2>حجز موعد جديد</h2>
                            <button onClick={() => { setShowBooking(false); setBookingError(''); setBookingSuccess(''); }} style={styles.closeButton}>✕</button>
                        </div>
                        <form onSubmit={handleBookAppointment}>
                            {bookingError && <div style={styles.error}>{bookingError}</div>}
                            {bookingSuccess && <div style={styles.success}>{bookingSuccess}</div>}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>
                                    <img src="/icons/specialty-3d.png" alt="تخصص" style={styles.labelIcon} />
                                    التخصص الطبي *
                                </label>
                                <select value={selectedSpecialty} onChange={handleSpecialtySelect} style={styles.select} required>
                                    <option value="">-- اختر التخصص الطبي --</option>
                                    {specialties.map((spec) => (
                                        <option key={spec.specialization} value={spec.specialization}>
                                            {translateSpecialty(spec.specialization)} ({spec.doctors_count} أطباء)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>
                                    <img src="/icons/calendar-3d.png" alt="تاريخ" style={styles.labelIcon} />
                                    التاريخ *
                                </label>
                                <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} style={styles.input} required min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <button type="submit" style={styles.submitButton}>
                                <img src="/icons/confirm-appointment-3d.png" alt="تأكيد" style={styles.buttonIcon} />
                                تأكيد الحجز
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5', direction: 'rtl' },
    sidebar: { width: '280px', backgroundColor: '#1a1a2e', color: 'white', padding: '20px 0', display: 'flex', flexDirection: 'column' },
    logo: { padding: '20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' },
    logoHealth: { fontSize: '28px', marginBottom: '5px' },
    userInfo: { textAlign: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' },
    userAvatar: { display: 'flex', justifyContent: 'center', marginBottom: '10px' },
    avatarImg: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        backgroundColor: '#f0f0f0',
    },
    userName: { fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' },
    userRole: { fontSize: '14px', color: '#aaa' },
    nav: { display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 15px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', transition: 'background-color 0.3s' },
    navIconImg: { width: '24px', height: '24px', marginLeft: '8px' },
    logoutButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', marginTop: '20px', transition: 'background-color 0.3s' },
    mainContent: { flex: 1, padding: '30px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    bookButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
    buttonIcon: { width: '20px', height: '20px', objectFit: 'contain' },
    appointmentsList: { backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    appointmentCard: { display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee', gap: '20px' },
    appointmentDate: { minWidth: '100px', textAlign: 'center', backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '8px' },
    dateDay: { fontSize: '16px', fontWeight: 'bold' },
    appointmentInfo: { flex: 1 },
    specializationName: { fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' },
    appointmentType: { fontSize: '12px', color: '#1976d2', marginTop: '5px' },
    doctorName: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4caf50', marginTop: '3px' },
    smallIcon: { width: '18px', height: '18px', objectFit: 'contain' },
    appointmentStatus: { textAlign: 'center' },
    statusBadge: { display: 'inline-block', padding: '5px 10px', borderRadius: '5px', color: 'white', fontSize: '12px', marginBottom: '8px' },
    cancelButton: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', backgroundColor: '#ffebee', color: '#c62828', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
    emptyState: { textAlign: 'center', padding: '40px', color: '#999' },
    emptyIconImg: { width: '80px', height: '80px', marginBottom: '20px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '500px', maxWidth: '90%' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    closeButton: { backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' },
    label: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' },
    labelIcon: { width: '20px', height: '20px', objectFit: 'contain' },
    select: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', backgroundColor: 'white', width: '100%' },
    input: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', width: '100%' },
    submitButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', width: '100%', marginTop: '10px' },
    error: { backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', fontSize: '14px', marginBottom: '15px' },
    success: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '5px', fontSize: '14px', marginBottom: '15px' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
    loader: { fontSize: '18px', color: '#1976d2' },
};

export default Appointments;