import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DoctorPatients = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [examinedPatients, setExaminedPatients] = useState([]);
    const [pendingPatients, setPendingPatients] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const examinedRes = await api.get('/doctors/patients/examined');
            setExaminedPatients(examinedRes.data || []);
            const pendingRes = await api.get('/doctors/patients/pending');
            setPendingPatients(pendingRes.data || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/doctor', icon: '/icons/home-3d.png' },
        { name: 'ملفي الشخصي', path: '/doctor/profile', icon: '/icons/profile-3d.png' },
        { name: 'سجلات المرضى', path: '/doctor/patients', icon: '/icons/records-3d.png' },
        { name: 'الاستشارات', path: '/doctor/consultations', icon: '/icons/consultations-3d.png' },
    ];

    if (loading) {
        return <div style={styles.loadingContainer}><div style={styles.loader}>جاري التحميل...</div></div>;
    }

    const currentPatients = activeTab === 'pending' ? pendingPatients : examinedPatients;

    return (
        <div style={styles.container}>
            {/* الشريط الجانبي */}
            <div style={styles.sidebar}>
                <div style={styles.logo}><h2></h2></div>
                <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>
                        <img src="/icons/doctor-avatar-3d.png" alt="صورة الطبيب" style={styles.avatarImg} />
                    </div>
                    <div style={styles.userName}>{user?.full_name}</div>
                    <div style={styles.userRole}>طبيب(ة)</div>
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
                    <h1>سجلات المرضى</h1>
                    <p>إدارة المرضى والمواعيد</p>
                </div>

                <div style={styles.tabs}>
                    <button onClick={() => setActiveTab('pending')} style={{...styles.tab, ...(activeTab === 'pending' && styles.tabActive)}}>
                        🆕 المرضى الجدد ({pendingPatients.length})
                    </button>
                    <button onClick={() => setActiveTab('examined')} style={{...styles.tab, ...(activeTab === 'examined' && styles.tabActive)}}>
                        ✅ المرضى الذين تم فحصهم ({examinedPatients.length})
                    </button>
                </div>

                {currentPatients.length === 0 ? (
                    <div style={styles.emptyState}>
        <img src="/icons/empty-3d.png" alt=" " style={styles.emptyIconImg} />
        <p style={styles.emptyMessage}>
            {activeTab === 'pending' 
                ? 'لايوجد مرضى لديهم مواعيد حاليا' 
                : 'لا يوجد مرضى تم فحصهم بعد'}
        </p>
    </div>
                ) : (
                    <div style={styles.patientsList}>
                        {currentPatients.map((patient) => (
                            <div
                                key={patient.patient_id}
                                style={styles.patientCard}
                                onClick={() => navigate(`/doctor/patients/${patient.user_id}`)}
                            >
                                <div style={styles.patientHeader}>
                                    <div style={styles.patientName}>
                                        {/* صورة المريض الثابتة */}
                                        <img 
                                            src="/icons/patient-avatar-3d.png"
                                            alt="صورة المريض"
                                            style={styles.patientAvatar}
                                        />
                                        {patient.full_name}
                                    </div>
                                    <div style={styles.patientDate}>
                                        {activeTab === 'pending' ? (
                                            <span style={styles.appointmentBadge}>
                                                <img src="/icons/calendar-3d.png" alt="تاريخ" style={styles.smallIcon} />
                                                تاريخ الحجز: {formatDate(patient.appointment_date || patient.created_at)}
                                            </span>
                                        ) : (
                                            <span>
                                                <img src="/icons/calendar-3d.png" alt="آخر زيارة" style={styles.smallIcon} />
                                                آخر زيارة: {formatDate(patient.last_visit)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={styles.patientInfo}>
                                    <div><img src="/icons/email-3d.png" alt="بريد" style={styles.smallIcon} /> {patient.email}</div>
                                    <div><img src="/icons/phone-3d.png" alt="هاتف" style={styles.smallIcon} /> {patient.phone || 'غير متوفر'}</div>
                                    <div><img src="/icons/birthday-3d.png" alt="تاريخ الميلاد" style={styles.smallIcon} /> تاريخ الميلاد: {formatDate(patient.date_of_birth)}</div>
                                    {patient.blood_type && <div><img src="/icons/blood-3d.png" alt="فصيلة الدم" style={styles.smallIcon} /> فصيلة الدم: {patient.blood_type}</div>}
                                </div>
                                {patient.allergies && (
                                    <div style={styles.allergies}>
                                        <img src="/icons/allergy-3d.png" alt="حساسية" style={styles.smallIcon} />
                                        حساسية: {patient.allergies}
                                    </div>
                                )}
                                {activeTab === 'pending' && patient.specialty && (
                                    <div style={styles.specialtyBadge}>
                                        <img src="/icons/specialty-3d.png" alt="تخصص" style={styles.smallIcon} />
                                        التخصص: {patient.specialty}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5', direction: 'rtl' },
    sidebar: { width: '280px', backgroundColor: '#1a1a2e', color: 'white', padding: '20px 0', display: 'flex', flexDirection: 'column' },
    logo: { padding: '20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' },
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
    header: { marginBottom: '30px' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
    tab: { padding: '10px 20px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
    tabActive: { backgroundColor: '#1976d2', color: 'white' },
    patientsList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    patientCard: { backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' },
    patientHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee', flexWrap: 'wrap', gap: '10px' },
    patientName: { fontSize: '18px', fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center', gap: '10px' },
    patientAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid #ddd',
        backgroundColor: '#f0f0f0',
    },
    patientDate: { fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' },
    appointmentBadge: { backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '5px' },
    smallIcon: { width: '16px', height: '16px', marginLeft: '4px', verticalAlign: 'middle' },
    patientInfo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px', color: '#555', marginBottom: '10px' },
    allergies: { backgroundColor: '#fff3e0', color: '#e65100', padding: '8px', borderRadius: '5px', fontSize: '13px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' },
    specialtyBadge: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '8px', borderRadius: '5px', fontSize: '13px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' },
    emptyState: { textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '10px' },
    emptyIconImg: { width: '80px', height: '80px', marginBottom: '20px' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
    loader: { fontSize: '18px', color: '#1976d2' },
};

export default DoctorPatients;