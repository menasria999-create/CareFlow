import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const formatDateEnglish = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [reportsCount, setReportsCount] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const appointmentsRes = await api.get('/patients/appointments/upcoming');
            setAppointments(appointmentsRes.data || []);
            
            const prescriptionsRes = await api.get('/patients/prescriptions');
            setPrescriptions(prescriptionsRes.data || []);
            
            try {
                const reportsRes = await api.get('/patients/reports/count');
                setReportsCount(reportsRes.data.count || 0);
            } catch (err) {
                setReportsCount(0);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                <div style={styles.logo}>
                    <div style={styles.logoHealth}>      </div>
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
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            style={styles.navItem}
                        >
                            <img src={item.icon} alt={item.name} style={styles.navIconImg} />
                            <span>{item.name}</span>
                        </button>
                    ))}
                    <button onClick={handleLogout} style={styles.logoutButton}>
                        <img src="/icons/logout-3d.png" alt="تسجيل الخروج" style={styles.navIconImg} />
                        <span>تسجيل الخروج</span>
                    </button>
                </nav>
            </div>

            <div style={styles.mainContent}>
                {/* قسم الترحيب (في المنتصف) */}
                <div style={styles.welcomeContainer}>
                    <img 
                        src="/icons/patient-avatar-3d.png" 
                        alt="صورة المريض" 
                        style={styles.welcomeAvatar} 
                    />
                    <div>
                        <h1>مرحباً {user?.full_name} </h1>
                        <p>نتمنى لك دوام الصحة والعافية</p>
                    </div>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/appointments-3d.png" alt="مواعيد" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{appointments.length}</div>
                        <div style={styles.statLabel}>مواعيد قادمة</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/prescriptions-3d.png" alt="وصفات" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{prescriptions.length}</div>
                        <div style={styles.statLabel}>وصفات طبية</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/reports-3d.png" alt="تقارير" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{reportsCount}</div>
                        <div style={styles.statLabel}>تقارير طبية</div>
                    </div>
                </div>

                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h2>المواعيد القادمة</h2>
                        <button 
                            onClick={() => navigate('/patient/appointments')}
                            style={styles.viewAllButton}
                        >
                            عرض الكل
                        </button>
                    </div>
                    {appointments.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p>لا توجد مواعيد قادمة</p>
                            <button 
                                onClick={() => navigate('/patient/appointments')}
                                style={styles.bookButton}
                            >
                                حجز موعد جديد
                            </button>
                        </div>
                    ) : (
                        <div style={styles.appointmentsList}>
                            {appointments.slice(0, 3).map((appointment) => (
                                <div key={appointment.id} style={styles.appointmentCard}>
                                    <div style={styles.appointmentDate}>
                                        <div style={styles.dateDay}>
                                            {formatDateEnglish(appointment.appointment_date)}
                                        </div>
                                    </div>
                                    <div style={styles.appointmentInfo}>
                                        <div style={styles.doctorName}>د. {appointment.doctor_name}</div>
                                        <div style={styles.specialization}>{appointment.specialization}</div>
                                    </div>
                                    <div style={styles.appointmentStatus}>
                                        <span style={styles.statusBadge}>
                                            {appointment.status === 'scheduled' ? 'قيد الانتظار' : 'مؤكد'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* تم حذف قسم آخر الوصفات الطبية بناءً على طلب سابق */}
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        direction: 'rtl',
    },
    sidebar: {
        width: '280px',
        backgroundColor: '#1a1a2e',
        color: 'white',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
    },
    logo: {
        padding: '20px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '20px',
    },
    logoHealth: {
        fontSize: '28px',
        marginBottom: '5px',
    },
    userInfo: {
        textAlign: 'center',
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '20px',
    },
    userAvatar: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '10px',
    },
    avatarImg: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        backgroundColor: '#f0f0f0',
    },
    userName: {
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '5px',
    },
    userRole: {
        fontSize: '14px',
        color: '#aaa',
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        padding: '0 15px',
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 15px',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        borderRadius: '8px',
        fontSize: '16px',
        textAlign: 'right',
        transition: 'background-color 0.3s',
    },
    navIconImg: {
        width: '24px',
        height: '24px',
        marginLeft: '8px',
    },
    logoutButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 15px',
        backgroundColor: 'transparent',
        border: 'none',
        color: '#ff6b6b',
        cursor: 'pointer',
        borderRadius: '8px',
        fontSize: '16px',
        textAlign: 'right',
        marginTop: '20px',
        transition: 'background-color 0.3s',
    },
    mainContent: {
        flex: 1,
        padding: '30px',
    },
    // قسم الترحيب (في المنتصف)
    welcomeContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '40px',
        textAlign: 'center',
        gap: '15px',
    },
    welcomeAvatar: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '3px solid #1976d2',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
    },
    statCard: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    statIcon: {
        marginBottom: '10px',
    },
    statIconImg: {
        width: '40px',
        height: '40px',
        objectFit: 'contain',
    },
    statNumber: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#1976d2',
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
        marginTop: '5px',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #eee',
    },
    viewAllButton: {
        padding: '8px 16px',
        backgroundColor: '#f0f0f0',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    appointmentsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    appointmentCard: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        gap: '15px',
    },
    appointmentDate: {
        minWidth: '80px',
        textAlign: 'center',
        backgroundColor: '#e3f2fd',
        padding: '8px',
        borderRadius: '8px',
    },
    dateDay: {
        fontSize: '14px',
        fontWeight: 'bold',
    },
    appointmentInfo: {
        flex: 1,
    },
    doctorName: {
        fontWeight: 'bold',
        fontSize: '16px',
    },
    specialization: {
        fontSize: '12px',
        color: '#666',
    },
    statusBadge: {
        padding: '4px 8px',
        backgroundColor: '#4caf50',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        color: '#999',
    },
    bookButton: {
        marginTop: '10px',
        padding: '10px 20px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
    },
    loader: {
        fontSize: '18px',
        color: '#1976d2',
    },
};

export default Dashboard;