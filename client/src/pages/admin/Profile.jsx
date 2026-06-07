import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminProfile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/profile');
            setProfile(response.data.user || response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setProfile(user);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setSaving(true);

        if (!profile.full_name || !profile.email || !profile.phone) {
            setMessage({ text: '⚠️ جميع الحقول إجبارية (الاسم الكامل، البريد الإلكتروني، رقم الهاتف)', type: 'error' });
            setSaving(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            return;
        }

        try {
            const response = await api.put('/admin/profile', {
                full_name: profile.full_name,
                email: profile.email,
                phone: profile.phone
            });
            if (response.data.success) {
                setMessage({ text: '✅ تم تحديث الملف الشخصي بنجاح', type: 'success' });
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            setMessage({ text: error.response?.data?.error || '❌ حدث خطأ في التحديث', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError('❌ كلمة المرور الجديدة غير متطابقة');
            return;
        }
        if (passwordData.new_password.length < 6) {
            setPasswordError('❌ كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        try {
            const response = await api.put('/admin/change-password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            if (response.data.success) {
                setPasswordSuccess('✅ تم تغيير كلمة المرور بنجاح');
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                    setPasswordSuccess('');
                }, 2000);
            }
        } catch (error) {
            setPasswordError(error.response?.data?.error || '❌ حدث خطأ في تغيير كلمة المرور');
        }
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/admin', icon: '/icons/home-3d.png' },
        { name: 'ملفي الشخصي', path: '/admin/profile', icon: '/icons/profile-3d.png' },
        { name: 'إدارة المستخدمين', path: '/admin/users', icon: '/icons/users-3d.png' },
        { name: 'إعدادات النظام', path: '/admin/settings', icon: '/icons/settings-3d.png' },
    ];

    if (loading) {
        return <div style={styles.loadingContainer}><div style={styles.loader}>جاري التحميل...</div></div>;
    }

    if (!profile) {
        return (
            <div style={styles.container}>
                <div style={styles.sidebar}>
                    <div style={styles.logo}><h2></h2></div>
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
                    <div style={styles.errorState}>
                        <p>حدث خطأ في تحميل البيانات</p>
                        <button onClick={fetchProfile} style={styles.retryButton}>إعادة المحاولة</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}><h2></h2></div>
                <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>
                        <img src="/icons/admin-avatar-3d.png" alt="صورة المدير" style={styles.avatarImg} />
                    </div>
                    <div style={styles.userName}>{profile.full_name}</div>
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
                    <h1>ملفي الشخصي</h1>
                    <p>جميع الحقول التالية إجبارية</p>
                </div>

                {message.text && (
                    <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* صف 1: الاسم الكامل + البريد الإلكتروني */}
                    <div style={styles.formRow}>
                        <div style={styles.halfInput}>
                            <label style={styles.label}>الاسم الكامل <span style={styles.requiredStar}>*</span></label>
                            <input type="text" name="full_name" value={profile.full_name || ''} onChange={handleChange} required style={styles.input} />
                        </div>
                        <div style={styles.halfInput}>
                            <label style={styles.label}>البريد الإلكتروني <span style={styles.requiredStar}>*</span></label>
                            <input type="email" name="email" value={profile.email || ''} onChange={handleChange} required style={styles.input} />
                        </div>
                    </div>

                    {/* صف 2: رقم الهاتف */}
                    <div style={styles.formRow}>
                        <div style={styles.halfInput}>
                            <label style={styles.label}>رقم الهاتف <span style={styles.requiredStar}>*</span></label>
                            <input type="tel" name="phone" value={profile.phone || ''} onChange={handleChange} required placeholder="مثال: 0555123456" style={styles.input} />
                        </div>
                        <div style={styles.halfInput}>
                            {/* حقل فارغ للحفاظ على التماثل */}
                        </div>
                    </div>

                    <div style={styles.buttonGroup}>
                        <button type="submit" disabled={saving} style={styles.saveButton}>
                            <img src="/icons/save-3d.png" alt="حفظ" style={styles.buttonIcon} />
                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                        <button type="button" onClick={() => setShowPasswordModal(true)} style={styles.changePasswordButton}>
                            <img src="/icons/change-password-3d.png" alt="تغيير كلمة المرور" style={styles.buttonIcon} />
                            تغيير كلمة المرور
                        </button>
                    </div>
                </form>
            </div>

            {showPasswordModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h2>تغيير كلمة المرور</h2>
                            <button onClick={() => setShowPasswordModal(false)} style={styles.closeButton}>✕</button>
                        </div>
                        <form onSubmit={handlePasswordChange}>
                            {passwordError && <div style={styles.errorMessage}>{passwordError}</div>}
                            {passwordSuccess && <div style={styles.successMessage}>{passwordSuccess}</div>}
                            <div style={styles.inputGroup}>
                                <label>كلمة المرور الحالية</label>
                                <input type="password" value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} required style={styles.input} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label>كلمة المرور الجديدة</label>
                                <input type="password" value={passwordData.new_password} onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} required style={styles.input} />
                                <span style={styles.hint}>يجب أن تكون 6 أحرف على الأقل</span>
                            </div>
                            <div style={styles.inputGroup}>
                                <label>تأكيد كلمة المرور الجديدة</label>
                                <input type="password" value={passwordData.confirm_password} onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})} required style={styles.input} />
                            </div>
                            <div style={styles.modalFooter}>
                                <button type="submit" style={styles.saveButton}>تغيير كلمة المرور</button>
                                <button type="button" onClick={() => setShowPasswordModal(false)} style={styles.cancelButton}>إلغاء</button>
                            </div>
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
    userInfo: { textAlign: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' },
    userAvatar: { display: 'flex', justifyContent: 'center', marginBottom: '10px' },
    avatarImg: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', backgroundColor: '#f0f0f0' },
    userName: { fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' },
    userRole: { fontSize: '14px', color: '#aaa' },
    nav: { display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 15px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', transition: 'background-color 0.3s' },
    navIconImg: { width: '24px', height: '24px', marginLeft: '8px' },
    logoutButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', marginTop: '20px', transition: 'background-color 0.3s' },
    mainContent: { flex: 1, padding: '30px' },
    header: { marginBottom: '30px' },
    form: { backgroundColor: 'white', borderRadius: '10px', padding: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    formRow: { display: 'flex', gap: '30px', marginBottom: '20px', flexWrap: 'wrap' },
    halfInput: { flex: 1, minWidth: '250px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' },
    label: { fontSize: '14px', fontWeight: 'bold', color: '#333' },
    input: { padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', width: '100%' },
    select: { padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', width: '100%', backgroundColor: 'white' },
    textarea: { padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', width: '100%', fontFamily: 'inherit', resize: 'vertical' },
    buttonGroup: { display: 'flex', gap: '15px', marginTop: '30px', justifyContent: 'flex-end' },
    saveButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', transition: 'background-color 0.3s' },
    changePasswordButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', transition: 'background-color 0.3s' },
    buttonIcon: { width: '20px', height: '20px', objectFit: 'contain' },
    successMessage: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '5px', marginBottom: '20px' },
    errorMessage: { backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '5px', marginBottom: '20px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', borderRadius: '10px', padding: '30px', width: '450px', maxWidth: '90%' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    closeButton: { backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' },
    modalFooter: { display: 'flex', gap: '10px', marginTop: '20px' },
    cancelButton: { padding: '10px 20px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    hint: { fontSize: '12px', color: '#666', marginTop: '4px' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
    loader: { fontSize: '18px', color: '#1976d2' },
    errorState: { textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '10px' },
    retryButton: { marginTop: '15px', padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    requiredStar: { color: '#f44336', marginLeft: '4px', fontSize: '16px' },
};

export default AdminProfile;