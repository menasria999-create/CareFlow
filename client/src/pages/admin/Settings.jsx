import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminSettings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        clinic_name: 'عيادة الشفاء الطبية',
        clinic_phone: '0555123456',
        clinic_email: 'clinic@careflow.com',
        clinic_address: 'حي البشير الابراهيمي، الحجيرة، ولاية تقرت',
        work_hours: 'السبت - الخميس (08:30 صباحاً - 16:00 مساءً)'
    });
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setSettings({
            ...settings,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await api.put('/admin/settings', settings);
            if (response.data.success) {
                setMessage({ text: 'تم حفظ إعدادات النظام بنجاح', type: 'success' });
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            }
        } catch (error) {
            setMessage({ text: error.response?.data?.error || 'حدث خطأ في حفظ الإعدادات', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } finally {
            setSaving(false);
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
                    <h1>إعدادات النظام</h1>
                    <p>تعديل معلومات العيادة وإعدادات النظام</p>
                </div>

                {message.text && (
                    <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGrid}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>
                                <img src="/icons/clinic-3d.png" alt="عيادة" style={styles.labelIcon} />
                                اسم العيادة
                            </label>
                            <input
                                type="text"
                                name="clinic_name"
                                value={settings.clinic_name}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>
                                <img src="/icons/phone-3d.png" alt="هاتف" style={styles.labelIcon} />
                                هاتف العيادة
                            </label>
                            <input
                                type="tel"
                                name="clinic_phone"
                                value={settings.clinic_phone}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>
                                <img src="/icons/email-3d.png" alt="بريد" style={styles.labelIcon} />
                                البريد الإلكتروني للعيادة
                            </label>
                            <input
                                type="email"
                                name="clinic_email"
                                value={settings.clinic_email}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>
                                <img src="/icons/address-3d.png" alt="عنوان" style={styles.labelIcon} />
                                عنوان العيادة
                            </label>
                            <textarea
                                name="clinic_address"
                                value={settings.clinic_address}
                                onChange={handleChange}
                                style={styles.textarea}
                                rows="3"
                                required
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>
                                <img src="/icons/work-hours-3d.png" alt="ساعات العمل" style={styles.labelIcon} />
                                أوقات العمل
                            </label>
                            <input
                                type="text"
                                name="work_hours"
                                value={settings.work_hours}
                                onChange={handleChange}
                                style={styles.input}
                                required
                                placeholder="مثال: السبت - الخميس (9 صباحاً - 9 مساءً)"
                            />
                        </div>
                    </div>

                    <div style={styles.buttonGroup}>
                        <button type="submit" disabled={saving} style={styles.saveButton}>
                            <img src="/icons/save-3d.png" alt="حفظ" style={styles.buttonIcon} />
                            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                        </button>
                    </div>
                </form>

                <div style={styles.infoCard}>
                    <div style={styles.infoCardHeader}>
                        <img src="/icons/info-3d.png" alt="ملاحظة" style={styles.infoIcon} />
                        <h3>ملاحظة</h3>
                    </div>
                    <p>هذه الإعدادات ستظهر في صفحات الاستشارات لكل من المريض والطبيب.</p>
                    <ul>
                        <li>معلومات العيادة تظهر في صفحة الاستشارات</li>
                        <li>أوقات العمل تساعد المرضى في معرفة أوقات التواصل</li>
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
    adminBadge: { fontSize: '12px', color: '#ff9800', marginTop: '5px' },
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
    form: { backgroundColor: 'white', borderRadius: '10px', padding: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' },
    labelIcon: { width: '20px', height: '20px', objectFit: 'contain' },
    input: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' },
    textarea: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', marginTop: '30px' },
    saveButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' },
    buttonIcon: { width: '20px', height: '20px', objectFit: 'contain' },
    infoCard: { backgroundColor: '#e3f2fd', borderRadius: '10px', padding: '20px', marginTop: '30px' },
    infoCardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
    infoIcon: { width: '24px', height: '24px', objectFit: 'contain' },
    successMessage: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '5px', marginBottom: '20px', textAlign: 'center' },
    errorMessage: { backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '5px', marginBottom: '20px', textAlign: 'center' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
    loader: { fontSize: '18px', color: '#1976d2' },
};

export default AdminSettings;