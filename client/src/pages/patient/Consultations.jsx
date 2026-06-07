import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PatientConsultations = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [doctorInfo, setDoctorInfo] = useState(null);

    useEffect(() => {
        fetchDoctorInfo();
    }, []);

    const fetchDoctorInfo = async () => {
        try {
            const response = await api.get('/patients/my-doctor');
            setDoctorInfo(response.data);
        } catch (error) {
            console.error('Error fetching doctor info:', error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/patient', icon: '/icons/home-3d.png' },
        { name: 'ملفي الشخصي', path: '/patient/profile', icon: '/icons/profile-3d.png' },
        { name: 'المواعيد', path: '/patient/appointments', icon: '/icons/appointments-3d.png' },
        { name: 'الوصفات', path: '/patient/prescriptions', icon: '/icons/prescriptions-3d.png' },
        { name: 'السجل الطبي', path: '/patient/records', icon: '/icons/records-3d.png' },
        { name: 'الاستشارات', path: '/patient/consultations', icon: '/icons/consultations-3d.png' },
    ];

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loader}>جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}><h2> </h2></div>
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
                    <h1>الاستشارات الطبية 💬</h1>
                    <p>للتواصل مع الطبيب أو العيادة</p>
                </div>

                <div style={styles.contactContainer}>
                    {/* بطاقة معلومات العيادة */}
                    <div style={styles.infoCard}>
                        <div style={styles.cardHeader}>
                            <img src="/icons/clinic-3d.png" alt="عيادة" style={styles.cardIconImg} />
                            <h2>معلومات العيادة</h2>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>📞 هاتف العيادة:</span>
                            <span style={styles.infoValue}>0555123456</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>✉️ البريد الإلكتروني:</span>
                            <span style={styles.infoValue}>clinic@gmail.com</span>
                        </div>
                        <div style={styles.infoRow}>
                            <span style={styles.infoLabel}>📍 العنوان:</span>
                            <span style={styles.infoValue}>حي البشير الابراهيمي- الحجيرة -ولاية تقرت</span>
                        </div>
                    </div>

                    {/* بطاقة معلومات الطبيب */}
                    {doctorInfo && (
                        <div style={styles.infoCard}>
                            <div style={styles.cardHeader}>
                                <img src="/icons/doctor-avatar-3d.png" alt="طبيب" style={styles.cardIconImg} />
                                <h2>معلومات الطبيب المعالج</h2>
                            </div>
                            <div style={styles.infoRow}>
                                <span style={styles.infoLabel}>👤 الاسم:</span>
                                <span style={styles.infoValue}>د. {doctorInfo.full_name}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span style={styles.infoLabel}>📱 هاتف الطبيب:</span>
                                <span style={styles.infoValue}>{doctorInfo.phone || '0555123456'}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span style={styles.infoLabel}>✉️ البريد الإلكتروني:</span>
                                <span style={styles.infoValue}>{doctorInfo.email}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span style={styles.infoLabel}>⚕️ الاختصاص:</span>
                                <span style={styles.infoValue}>{doctorInfo.specialization}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span style={styles.infoLabel}>🏥 عنوان العيادة:</span>
                                <span style={styles.infoValue}>{doctorInfo.clinic_address || 'حي البشير الابراهيمي- الحجيرة -ولاية تقرت'}</span>
                            </div>
                        </div>
                    )}

                    {/* رسالة توضيحية */}
                    <div style={styles.noteCard}>
                        <p>📢 ملاحظة: للاستشارات الطبية العاجلة، يرجى الاتصال على رقم العيادة أو رقم الطبيب مباشرة.</p>
                        <p>⏰ أوقات العمل: السبت - الخميس (08:30 صباحاً - 16:00 مساءً)</p>
                    </div>
                </div>
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
    contactContainer: { display: 'flex', flexDirection: 'column', gap: '25px' },
    infoCard: { backgroundColor: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #1976d2' },
    cardIconImg: { width: '32px', height: '32px', objectFit: 'contain' },
    infoRow: { display: 'flex', marginBottom: '12px', padding: '5px 0' },
    infoLabel: { width: '140px', fontWeight: 'bold', color: '#555' },
    infoValue: { flex: 1, color: '#333' },
    noteCard: { backgroundColor: '#fff3e0', borderRadius: '10px', padding: '20px', borderRight: '4px solid #ff9800' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
    loader: { fontSize: '18px', color: '#1976d2' },
};

export default PatientConsultations;