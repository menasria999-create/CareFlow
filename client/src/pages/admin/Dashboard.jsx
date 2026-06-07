import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        patients: 0,
        doctors: 0,
        receptionists: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/stats');
            setStats({
                patients: response.data.patients || 0,
                doctors: response.data.doctors || 0,
                receptionists: response.data.receptionists || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/admin', icon: '/icons/home-3d.png' },
        { name: 'ملفي الشخصي', path: '/admin/profile', icon: '/icons/profile-3d.png' },
        { name: 'إدارة المستخدمين', path: '/admin/users', icon: '/icons/users-3d.png' },
        { name: 'إعدادات النظام', path: '/admin/settings', icon: '/icons/settings-3d.png' },
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
                    <h2></h2>
                    <p style={styles.adminBadge}>مدير النظام</p>
                </div>
                <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>
                        <img src="/icons/admin-avatar-3d.png" alt="صورة المدير" style={styles.avatarImg} />
                    </div>
                    <div style={styles.userName}>{user?.full_name}</div>
                    <div style={styles.userRole}>مدير</div>
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
                    <button onClick={logout} style={styles.logoutButton}>
                        <img src="/icons/logout-3d.png" alt="تسجيل الخروج" style={styles.navIconImg} />
                        <span>تسجيل الخروج</span>
                    </button>
                </nav>
            </div>

            <div style={styles.mainContent}>
                <div style={styles.header}>
                    <h1>مرحباً مدير 👋</h1>
                    <p>مرحباً بك في لوحة تحكم الإدارة</p>
                </div>

                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/patients-3d.png" alt="المرضى" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{stats.patients}</div>
                        <div style={styles.statLabel}>المرضى</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/doctors-3d.png" alt="الأطباء" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{stats.doctors}</div>
                        <div style={styles.statLabel}>الأطباء</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>
                            <img src="/icons/receptionists-3d.png" alt="موظفي الاستقبال" style={styles.statIconImg} />
                        </div>
                        <div style={styles.statNumber}>{stats.receptionists}</div>
                        <div style={styles.statLabel}>موظفي الاستقبال</div>
                    </div>
                </div>
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
    adminBadge: {
        fontSize: '12px',
        color: '#ff9800',
        marginTop: '5px',
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
    header: {
        marginBottom: '30px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
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

export default AdminDashboard;