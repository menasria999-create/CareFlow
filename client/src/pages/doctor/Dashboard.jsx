import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_patients: 0,
        examined_patients: 0,
        waiting_patients: 0
    });
    const [maxPatients, setMaxPatients] = useState(50);
    const [showMaxModal, setShowMaxModal] = useState(false);
    const [tempMaxPatients, setTempMaxPatients] = useState(50);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        fetchStats();
        fetchAppointments();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/doctors/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            // ✅ المسار الصحيح: /doctors/my-appointments
            const response = await api.get('/doctors/my-appointments');
            setAppointments(response.data.appointments || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const handleSetMaxPatients = () => {
        setMaxPatients(tempMaxPatients);
        setShowMaxModal(false);
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/doctor', icon: '/icons/home-3d.png' },
        { name: 'ملفي الشخصي', path: '/doctor/profile', icon: '/icons/profile-3d.png' },
        { name: 'سجلات المرضى', path: '/doctor/patients', icon: '/icons/records-3d.png' },
        { name: 'الاستشارات', path: '/doctor/consultations', icon: '/icons/consultations-3d.png' },
    ];

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loader}>جاري التحميل...</div>
            </div>
        );
    }

    const percentage = (stats.total_patients / maxPatients) * 100;

    return (
        <div style={styles.container}>
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
                <div style={styles.welcomeContainer}>
                    <img 
                        src="/icons/doctor-avatar-3d.png" 
                        alt="صورة الطبيب" 
                        style={styles.welcomeAvatar} 
                    />
                    <div>
                        <h1>مرحباً د. {user?.full_name}</h1>
                        <p>مرحباً بك في لوحة تحكم الأطباء</p>
                    </div>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/total-patients-3d.png" alt="إجمالي المرضى" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{stats.total_patients}</div>
                        <div style={styles.statLabel}>إجمالي المرضى</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/examined-3d.png" alt="تم فحصهم" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{stats.examined_patients}</div>
                        <div style={styles.statLabel}>تم فحصهم</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/waiting-3d.png" alt="قيد الانتظار" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{stats.waiting_patients}</div>
                        <div style={styles.statLabel}>قيد الانتظار</div>
                    </div>
                </div>

                <div style={styles.maxPatientsCard}>
                    <div style={styles.maxPatientsHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/icons/stats-3d.png" alt="إحصائيات" style={{ width: '28px', height: '28px' }} />
                            <h3>تحديد عدد المرضى</h3>
                        </div>
                        <button onClick={() => { setTempMaxPatients(maxPatients); setShowMaxModal(true); }} style={styles.editButton}>
                            <img src="/icons/edit-3d.png" alt="تعديل" style={styles.smallIconImg} />
                            تعديل
                        </button>
                    </div>
                    <div style={styles.progressContainer}>
                        <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${Math.min(percentage, 100)}%`, backgroundColor: percentage > 90 ? '#f44336' : percentage > 70 ? '#ff9800' : '#4caf50' }} />
                        </div>
                        <div style={styles.progressStats}>
                            <span>{stats.total_patients} مريض</span>
                            <span>الحد الأقصى: {maxPatients} مريض</span>
                        </div>
                    </div>
                </div>

                <div style={styles.appointmentsCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <img src="/icons/appointments-3d.png" alt="المواعيد" style={{ width: '28px', height: '28px' }} />
                        <h3>المواعيد القادمة</h3>
                    </div>
                    {appointments.length === 0 ? (
                        <div style={styles.noAppointments}>لا توجد مواعيد قادمة</div>
                    ) : (
                        <div style={styles.appointmentsList}>
                            {appointments.map((apt) => (
                                <div key={apt.id} style={styles.appointmentItem}>
                                    <div style={styles.appointmentPatient}>
                                        <img src="/icons/patient-icon-3d.png" alt="مريض" style={styles.smallIconImg} />
                                        {apt.patient_name}
                                    </div>
                                    <div style={styles.appointmentDetails}>
                                        <span>
                                            <img src="/icons/specialty-3d.png" alt="تخصص" style={styles.tinyIconImg} />
                                            التخصص: {apt.specialty || 'غير محدد'}
                                        </span>
                                        <span>📅 التاريخ: {new Date(apt.appointment_date).toLocaleDateString('ar-EG')}</span>
                                        <span>📝 الحالة: {apt.status === 'scheduled' ? 'قيد الانتظار' : apt.status}</span>
                                    </div>
                                    <div style={styles.appointmentActions}>
                                        <button onClick={() => navigate(`/doctor/patients/${apt.patient_user_id}`)} style={styles.viewButton}>
                                            عرض المريض
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showMaxModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h2>تحديد عدد المرضى</h2>
                            <button onClick={() => setShowMaxModal(false)} style={styles.closeButton}>✕</button>
                        </div>
                        <div style={styles.modalBody}>
                            <label style={styles.label}>الحد الأقصى لعدد المرضى:</label>
                            <input type="number" value={tempMaxPatients} onChange={(e) => setTempMaxPatients(parseInt(e.target.value))} style={styles.input} min="1" />
                        </div>
                        <div style={styles.modalFooter}>
                            <button onClick={handleSetMaxPatients} style={styles.saveButton}>حفظ</button>
                            <button onClick={() => setShowMaxModal(false)} style={styles.cancelButton}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
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
    welcomeContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '40px',
        textAlign: 'center',
        gap: '10px',
    },
    welcomeAvatar: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #1976d2',
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
    maxPatientsCard: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px',
    },
    maxPatientsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
    },
    editButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 15px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    smallIconImg: {
        width: '16px',
        height: '16px',
        objectFit: 'contain',
    },
    tinyIconImg: {
        width: '14px',
        height: '14px',
        objectFit: 'contain',
        marginLeft: '5px',
    },
    progressContainer: {
        marginTop: '10px',
    },
    progressBar: {
        backgroundColor: '#e0e0e0',
        borderRadius: '10px',
        height: '20px',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: '10px',
        transition: 'width 0.3s ease',
    },
    progressStats: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '10px',
        fontSize: '14px',
        color: '#666',
    },
    appointmentsCard: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    appointmentsList: {
        marginTop: '15px',
    },
    appointmentItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px',
        borderBottom: '1px solid #eee',
        gap: '15px',
        flexWrap: 'wrap',
    },
    appointmentPatient: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 'bold',
        color: '#1976d2',
        minWidth: '150px',
    },
    appointmentDetails: {
        display: 'flex',
        gap: '15px',
        color: '#666',
        fontSize: '13px',
        flex: 1,
        flexWrap: 'wrap',
    },
    appointmentActions: {
        display: 'flex',
        gap: '10px',
    },
    viewButton: {
        padding: '5px 12px',
        backgroundColor: '#4caf50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    noAppointments: {
        textAlign: 'center',
        padding: '20px',
        color: '#999',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '10px',
        width: '400px',
        maxWidth: '90%',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #eee',
    },
    closeButton: {
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
    },
    modalBody: {
        padding: '20px',
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        padding: '20px',
        borderTop: '1px solid #eee',
    },
    label: {
        display: 'block',
        marginBottom: '10px',
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
    },
    saveButton: {
        padding: '8px 20px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    cancelButton: {
        padding: '8px 20px',
        backgroundColor: '#999',
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

export default DoctorDashboard;