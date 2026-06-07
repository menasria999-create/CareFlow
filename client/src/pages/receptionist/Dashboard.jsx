import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ReceptionistDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        patients_today: 0,
        appointments_today: 0,
        pending_appointments: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/receptionist/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/receptionist', icon: '/icons/home-3d.png' },
        { name: 'ملفي الشخصي', path: '/receptionist/profile', icon: '/icons/profile-3d.png' },
        { name: 'تسجيل مريض', path: '/receptionist/register-patient', icon: '/icons/register-patient-3d.png' },
    ];

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.sidebar}>
                    <div style={styles.logo}>
                        <div style={styles.logoHealth}></div>
                    </div>
                    <div style={styles.userInfo}>
                        <div style={styles.userAvatar}>
                            <img src="/icons/receptionist-avatar-3d.png" alt="موظف الاستقبال" style={styles.avatarImg} />
                        </div>
                        <div style={styles.userName}>{user?.full_name || 'موظف الاستقبال'}</div>
                        <div style={styles.userRole}>موظف(ة) استقبال</div>
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
                    <div style={styles.loadingContainer}>جاري التحميل...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}>
                    <div style={styles.logoHealth}></div>
                </div>
                <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>
                        <img 
                            src="/icons/receptionist-avatar-3d.png" 
                            alt="صورة موظف الاستقبال" 
                            style={styles.avatarImg} 
                        />
                    </div>
                    <div style={styles.userName}>{user?.full_name || 'أحمد علي'}</div>
                    <div style={styles.userRole}>موظف(ة) استقبال</div>
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
                        src="/icons/receptionist-avatar-3d.png" 
                        alt="صورة موظف الاستقبال" 
                        style={styles.welcomeAvatar} 
                    />
                    <div>
                        <h1>مرحباً {user?.full_name || 'أحمد علي'} 👋</h1>
                        <p>مرحباً بك في لوحة تحكم موظف الاستقبال</p>
                    </div>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/total-patients-3d.png" alt="مرضى اليوم" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{stats.patients_today || 0}</div>
                        <div style={styles.statLabel}>مرضى اليوم</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/appointments-3d.png" alt="مواعيد اليوم" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{stats.appointments_today || 0}</div>
                        <div style={styles.statLabel}>مواعيد اليوم</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/waiting-3d.png" alt="في الانتظار" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{stats.pending_appointments || 0}</div>
                        <div style={styles.statLabel}>في الانتظار</div>
                    </div>
                </div>

                <div style={styles.welcomeCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <img src="/icons/tasks-3d.png" alt="مهام" style={{ width: '28px', height: '28px' }} />
                        <h3>مهام موظف(ة) استقبال</h3>
                    </div>
                    <ul>
                        <li>إنشاء حساب للمرضى الجدد</li>
                        <li>حجز مواعيد للمرضى</li>
                        <li>القيام بمهام أخرى مثل رفع ملفات المريض</li>
                    </ul>
                </div>
            </div>
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
    userName: { fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', color: 'white' },
    userRole: { fontSize: '14px', color: '#aaa' },
    nav: { display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 15px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', transition: 'background-color 0.3s' },
    navIconImg: { width: '24px', height: '24px', marginLeft: '8px' },
    logoutButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', marginTop: '20px', transition: 'background-color 0.3s' },
    mainContent: { flex: 1, padding: '30px' },
    welcomeContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '40px',
        textAlign: 'center',
        flexDirection: 'column',
    },
    welcomeAvatar: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #1976d2',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
    statCard: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    statIcon: { marginBottom: '10px' },
    statIconImg: { width: '40px', height: '40px', objectFit: 'contain' },
    statNumber: { fontSize: '28px', fontWeight: 'bold', color: '#1976d2' },
    statLabel: { fontSize: '14px', color: '#666', marginTop: '5px' },
    welcomeCard: { backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    loadingContainer: { textAlign: 'center', padding: '50px', fontSize: '18px', color: '#1976d2' },
};

export default ReceptionistDashboard;