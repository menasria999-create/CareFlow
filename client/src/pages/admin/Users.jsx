import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminUsers = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeRole, setActiveRole] = useState('doctor');
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        address: '',
        hire_date: '',
        employee_id: '',
        role: 'doctor',
        specialization: '',
        license_number: ''
    });
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState('error');
    const [showPrintPopup, setShowPrintPopup] = useState(false);
    const [lastCreatedUser, setLastCreatedUser] = useState(null);

    const roles = [
        { value: 'doctor', label: 'الأطباء', icon: '/icons/doctor-3d.png' },
        { value: 'receptionist', label: 'موظفي الاستقبال', icon: '/icons/receptionist-3d.png' }
    ];

    useEffect(() => { fetchUsers(); }, [activeRole]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/users/${activeRole}`);
            setUsers(response.data || []);
        } catch (error) {
            showPopupMessage('حدث خطأ في تحميل البيانات', 'error');
        } finally { setLoading(false); }
    };

    const showPopupMessage = (msg, type = 'error') => {
        setPopupMessage(msg);
        setPopupType(type);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
    };

    const handleOpenModal = (userData = null) => {
        if (userData) {
            setEditingUser(userData);
            setFormData({
                email: userData.email || '',
                password: '',
                full_name: userData.full_name || '',
                phone: userData.phone || '',
                address: userData.address || '',
                hire_date: userData.hire_date || '',
                employee_id: userData.employee_id || '',
                role: userData.role,
                specialization: userData.specialization || '',
                license_number: userData.license_number || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: '',
                password: '',
                full_name: '',
                phone: '',
                address: '',
                hire_date: '',
                employee_id: '',
                role: activeRole,
                specialization: '',
                license_number: ''
            });
        }
        setShowPrintPopup(false);
        setLastCreatedUser(null);
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validatePhone = (phone) => {
        if (!phone) return false;
        const phoneRegex = /^0\d{9}$/;
        return phoneRegex.test(phone);
    };

    const handlePrint = () => {
        if (!lastCreatedUser) return;
        
        const isEdit = !!lastCreatedUser.updated_at;
        const title = isEdit ? 'المنصة الرقمية لادارة المرضى ' : 'المنصة الرقمية لادارة المرضى ';
        const subTitle = isEdit ? 'تم تحديث بيانات الحساب بنجاح' : 'تم إنشاء الحساب بنجاح';
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
                    .container { max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; }
                    .header { text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 10px; margin-bottom: 20px; }
                    .header h1 { color: #1976d2; margin: 0; }
                    .edit-badge { background: #ff9800; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; display: inline-block; margin-top: 8px; }
                    .info-row { display: flex; margin-bottom: 12px; padding: 8px; border-bottom: 1px solid #eee; }
                    .label { font-weight: bold; width: 150px; color: #555; }
                    .value { flex: 1; color: #333; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
                    .password-warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin-top: 15px; text-align: center; color: #856404; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏥 ${title}</h1>
                        <p>${subTitle}</p>
                        ${isEdit ? '<div class="edit-badge">🔄 تم التعديل</div>' : ''}
                    </div>
                    
                    <div class="info-row">
                        <div class="label">الاسم الكامل:</div>
                        <div class="value">${lastCreatedUser.full_name || ''}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">البريد الإلكتروني:</div>
                        <div class="value">${lastCreatedUser.email || ''}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">رقم الهاتف:</div>
                        <div class="value">${lastCreatedUser.phone || ''}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">العنوان:</div>
                        <div class="value">${lastCreatedUser.address || ''}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">الوظيفة:</div>
                        <div class="value">${lastCreatedUser.role === 'doctor' ? 'طبيب' : 'موظف استقبال'}</div>
                    </div>
                    ${lastCreatedUser.specialization ? `
                    <div class="info-row">
                        <div class="label">الاختصاص:</div>
                        <div class="value">${lastCreatedUser.specialization}</div>
                    </div>
                    ` : ''}
                    ${lastCreatedUser.license_number ? `
                    <div class="info-row">
                        <div class="label">رقم الترخيص:</div>
                        <div class="value">${lastCreatedUser.license_number}</div>
                    </div>
                    ` : ''}
                    <div class="info-row">
                        <div class="label">رقم الموظف:</div>
                        <div class="value">${lastCreatedUser.employee_id || ''}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">تاريخ التوظيف:</div>
                        <div class="value">${lastCreatedUser.hire_date || ''}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">${isEdit ? 'تاريخ التعديل:' : 'تاريخ الإنشاء:'}</div>
                        <div class="value">${new Date().toLocaleDateString('ar-EG')} ${new Date().toLocaleTimeString('ar-EG')}</div>
                    </div>
                    ${isEdit && lastCreatedUser.id ? `
                    <div class="info-row">
                        <div class="label">رقم المستخدم:</div>
                        <div class="value">${lastCreatedUser.id}</div>
                    </div>
                    ` : ''}
                    
                    <div class="password-warning">
                        ⚠️ ملاحظة أمنية: لا يمكن طباعة كلمة المرور لأسباب أمنية.<br>
                        ${isEdit ? 'تم تحديث البيانات مع الاحتفاظ بنفس كلمة المرور.' : 'سيتم إرسال رابط تعيين كلمة المرور إلى البريد الإلكتروني للموظف.'}
                    </div>
                    
                    <div class="footer">
                        هذا المستند يحتوي على معلومات سرية - يرجى الحفاظ عليه في مكان آمن
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const normalizedEmail = formData.email.toLowerCase();

        const requiredFields = ['full_name', 'email', 'phone', 'address', 'hire_date', 'employee_id'];
        if (formData.role === 'doctor') {
            requiredFields.push('specialization', 'license_number');
        }
        for (let field of requiredFields) {
            if (!formData[field]) {
                showPopupMessage(`⚠️ حقل ${field} مطلوب`, 'error');
                return;
            }
        }

        if (!validatePhone(formData.phone)) {
            showPopupMessage('⚠️ رقم الهاتف غير صحيح. يجب أن يبدأ بـ 0 ويتكون من 10 أرقام', 'error');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        if (!emailRegex.test(formData.email)) {
            showPopupMessage('⚠️ البريد الإلكتروني غير صحيح. يجب أن يكون عنوان Gmail صالحاً', 'error');
            return;
        }

        try {
            if (editingUser) {
                await api.put(`/admin/users/${editingUser.id}`, {
                    full_name: formData.full_name,
                    email: normalizedEmail,
                    phone: formData.phone,
                    address: formData.address,
                    hire_date: formData.hire_date,
                    employee_id: formData.employee_id,
                    is_active: true,
                    specialization: formData.specialization,
                    license_number: formData.license_number
                });
                
                setLastCreatedUser({
                    id: editingUser.id,
                    full_name: formData.full_name,
                    email: normalizedEmail,
                    phone: formData.phone,
                    address: formData.address,
                    role: formData.role,
                    specialization: formData.specialization,
                    license_number: formData.license_number,
                    employee_id: formData.employee_id,
                    hire_date: formData.hire_date,
                    updated_at: new Date().toISOString()
                });
                
                setShowModal(false);
                setShowPrintPopup(true);
                showPopupMessage('✅ تم تحديث المستخدم بنجاح', 'success');
                
            } else {
                await api.post('/admin/users', {
                    email: normalizedEmail,
                    password: formData.password,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    address: formData.address,
                    hire_date: formData.hire_date,
                    employee_id: formData.employee_id,
                    role: formData.role,
                    specialization: formData.specialization,
                    license_number: formData.license_number
                });
                
                setLastCreatedUser({
                    full_name: formData.full_name,
                    email: normalizedEmail,
                    phone: formData.phone,
                    address: formData.address,
                    role: formData.role,
                    specialization: formData.specialization,
                    license_number: formData.license_number,
                    employee_id: formData.employee_id,
                    hire_date: formData.hire_date
                });
                
                setShowModal(false);
                setShowPrintPopup(true);
                showPopupMessage('✅ تم إضافة المستخدم بنجاح', 'success');
            }
            
            fetchUsers();
            setTimeout(() => {
                setShowPrintPopup(false);
                setLastCreatedUser(null);
            }, 10000);
            
        } catch (error) {
            if (error.response?.data?.existing_specialty) {
                showPopupMessage(error.response.data.error, 'error');
            } else {
                showPopupMessage(error.response?.data?.error || '❌ حدث خطأ', 'error');
            }
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟`)) {
            try {
                await api.delete(`/admin/users/${userId}`);
                showPopupMessage('✅ تم حذف المستخدم بنجاح', 'success');
                fetchUsers();
            } catch (error) {
                showPopupMessage(error.response?.data?.error || '❌ حدث خطأ', 'error');
            }
        }
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/admin', icon: '/icons/home-3d.png' },
        { name: 'ملفي الشخصي', path: '/admin/profile', icon: '/icons/profile-3d.png' },
        { name: 'إدارة المستخدمين', path: '/admin/users', icon: '/icons/users-3d.png' },
        { name: 'إعدادات النظام', path: '/admin/settings', icon: '/icons/settings-3d.png' },
    ];

    if (loading) return <div style={styles.loadingContainer}><div style={styles.loader}>جاري التحميل...</div></div>;

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}><h2> </h2><p style={styles.adminBadge}>مدير النظام</p></div>
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
                    <h1>إدارة المستخدمين</h1>
                    <p>إدارة الأطباء وموظفي الاستقبال</p>
                </div>

                <div style={styles.roleTabs}>
                    {roles.map((role) => (
                        <button key={role.value} onClick={() => setActiveRole(role.value)} style={{...styles.roleTab, ...(activeRole === role.value && styles.roleTabActive)}}>
                            <img src={role.icon} alt={role.label} style={styles.tabIcon} />
                            {role.label}
                        </button>
                    ))}
                </div>

                <div style={styles.addButtonContainer}>
                    <button onClick={() => handleOpenModal()} style={styles.addButton}>
                        <img src="/icons/add-3d.png" alt="إضافة" style={styles.buttonIcon} />
                        إضافة {roles.find(r => r.value === activeRole)?.label}
                    </button>
                </div>

                <div style={styles.usersTable}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>الاسم</th>
                                <th style={styles.th}>البريد الإلكتروني</th>
                                <th style={styles.th}>رقم الهاتف</th>
                                {activeRole === 'doctor' && <th style={styles.th}>الاختصاص</th>}
                                {activeRole === 'doctor' && <th style={styles.th}>رقم الترخيص</th>}
                                {activeRole === 'receptionist' && <th style={styles.th}>العنوان</th>}
                                {activeRole === 'receptionist' && <th style={styles.th}>رقم الموظف</th>}
                                <th style={styles.th}>تاريخ التسجيل</th>
                                <th style={styles.th}>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan="8" style={styles.tdCenter}>لا توجد بيانات</td></tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id}>
                                        <td style={styles.td}>{u.full_name}</td>
                                        <td style={styles.td}>{u.email}</td>
                                        <td style={styles.td}>{u.phone || '-'}</td>
                                        {activeRole === 'doctor' && <td style={styles.td}>{u.specialization || '-'}</td>}
                                        {activeRole === 'doctor' && <td style={styles.td}>{u.license_number || '-'}</td>}
                                        {activeRole === 'receptionist' && <td style={styles.td}>{u.address || '-'}</td>}
                                        {activeRole === 'receptionist' && <td style={styles.td}>{u.employee_id || '-'}</td>}
                                        <td style={styles.td}>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                                        <td style={styles.td}>
                                            <button onClick={() => handleOpenModal(u)} style={styles.editButton}>تعديل</button>
                                            <button onClick={() => handleDeleteUser(u.id, u.full_name)} style={styles.deleteButton}>حذف</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                     </table>
                </div>
            </div>

            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h2>{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h2>
                            <button onClick={() => setShowModal(false)} style={styles.closeButton}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {!editingUser && (
                                <>
                                    <div style={styles.inputGroup}><label>البريد الإلكتروني (Gmail) *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required style={styles.input} /></div>
                                    <div style={styles.inputGroup}><label>كلمة المرور *</label><input type="password" name="password" value={formData.password} onChange={handleChange} required style={styles.input} /></div>
                                </>
                            )}
                            {editingUser && (
                                <div style={styles.inputGroup}><label>البريد الإلكتروني (Gmail) *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required style={styles.input} /></div>
                            )}
                            <div style={styles.inputGroup}><label>الاسم الكامل *</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required style={styles.input} /></div>
                            <div style={styles.inputGroup}><label>رقم الهاتف *</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="مثال: 0555123456" style={styles.input} /></div>
                            <div style={styles.inputGroup}><label>العنوان *</label><input type="text" name="address" value={formData.address} onChange={handleChange} required style={styles.input} /></div>
                            <div style={styles.inputGroup}><label>تاريخ التوظيف *</label><input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} required style={styles.input} /></div>
                            <div style={styles.inputGroup}><label>رقم الموظف *</label><input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} required style={styles.input} /></div>

                            {!editingUser && (
                                <div style={styles.inputGroup}>
                                    <label>الدور *</label>
                                    <select name="role" value={formData.role} onChange={handleChange} required style={styles.select}>
                                        {activeRole === 'doctor' && <option value="doctor">طبيب</option>}
                                        {activeRole === 'receptionist' && <option value="receptionist">موظف استقبال</option>}
                                    </select>
                                </div>
                            )}

                            {formData.role === 'doctor' && (
                                <>
                                    <div style={styles.inputGroup}><label>الاختصاص *</label><input type="text" name="specialization" value={formData.specialization} onChange={handleChange} required style={styles.input} /></div>
                                    <div style={styles.inputGroup}><label>رقم الترخيص *</label><input type="text" name="license_number" value={formData.license_number} onChange={handleChange} required style={styles.input} /></div>
                                </>
                            )}

                            <div style={styles.modalFooter}>
                                <button type="submit" style={styles.saveButton}>
                                    {editingUser ? 'تحديث' : 'إضافة'}
                                </button>
                                <button type="button" onClick={() => {
                                    setShowModal(false);
                                    setShowPrintPopup(false);
                                    setLastCreatedUser(null);
                                }} style={styles.cancelButton}>
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPrintPopup && lastCreatedUser && (
                <div style={styles.printPopupOverlay}>
                    <div style={styles.printPopup}>
                        <div style={styles.printPopupHeader}>
                            <h3>✅ تم {lastCreatedUser.updated_at ? 'تعديل' : 'إضافة'} المستخدم بنجاح</h3>
                            <button onClick={() => setShowPrintPopup(false)} style={styles.printPopupClose}>✕</button>
                        </div>
                        <div style={styles.printPopupBody}>
                            <p>هل تريد طباعة بيانات المستخدم؟</p>
                            <div style={styles.printPopupInfo}>
                                <p><strong>الاسم:</strong> {lastCreatedUser.full_name}</p>
                                <p><strong>البريد:</strong> {lastCreatedUser.email}</p>
                                <p><strong>الوظيفة:</strong> {lastCreatedUser.role === 'doctor' ? 'طبيب' : 'موظف استقبال'}</p>
                            </div>
                        </div>
                        <div style={styles.printPopupFooter}>
                            <button onClick={handlePrint} style={styles.printPopupConfirm}>
                                <img src="/icons/print-3d.png" alt="طباعة" style={styles.buttonIcon} />
                                طباعة البيانات
                            </button>
                            <button onClick={() => setShowPrintPopup(false)} style={styles.printPopupCancel}>
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPopup && (
                <div style={styles.popupOverlay}>
                    <div style={popupType === 'success' ? styles.popupSuccess : styles.popupError}>{popupMessage}</div>
                </div>
            )}
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
    avatarImg: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', backgroundColor: '#f0f0f0' },
    userName: { fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' },
    userRole: { fontSize: '14px', color: '#aaa' },
    nav: { display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 15px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', transition: 'background-color 0.3s' },
    navIconImg: { width: '24px', height: '24px', marginLeft: '8px' },
    logoutButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', marginTop: '20px', transition: 'background-color 0.3s' },
    mainContent: { flex: 1, padding: '30px' },
    header: { marginBottom: '30px' },
    roleTabs: { display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' },
    roleTab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.3s' },
    roleTabActive: { backgroundColor: '#1976d2', color: 'white' },
    tabIcon: { width: '20px', height: '20px', objectFit: 'contain' },
    addButtonContainer: { display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' },
    addButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' },
    buttonIcon: { width: '18px', height: '18px', objectFit: 'contain' },
    usersTable: { backgroundColor: 'white', borderRadius: '10px', overflow: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'center', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd', fontWeight: 'bold' },
    td: { padding: '10px', textAlign: 'center', borderBottom: '1px solid #eee' },
    tdCenter: { padding: '20px', textAlign: 'center', color: '#999' },
    editButton: { padding: '5px 10px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' },
    deleteButton: { padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'white', borderRadius: '10px', padding: '25px', width: '550px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    closeButton: { backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' },
    inputGroup: { marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '5px' },
    input: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px' },
    select: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', backgroundColor: 'white' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' },
    saveButton: { padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    cancelButton: { padding: '10px 20px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    printPopupOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        direction: 'rtl'
    },
    printPopup: {
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        overflow: 'hidden'
    },
    printPopupHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        backgroundColor: '#4caf50',
        color: 'white',
        borderBottom: '1px solid #ddd'
    },
    printPopupClose: {
        backgroundColor: 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer'
    },
    printPopupBody: {
        padding: '20px',
        textAlign: 'center'
    },
    printPopupInfo: {
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '15px',
        textAlign: 'right'
    },
    printPopupFooter: {
        display: 'flex',
        gap: '10px',
        padding: '15px 20px',
        borderTop: '1px solid #eee',
        justifyContent: 'center'
    },
    printPopupConfirm: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        backgroundColor: '#4caf50',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    printPopupCancel: {
        padding: '10px 20px',
        backgroundColor: '#999',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    popupOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, direction: 'rtl' },
    popupSuccess: { backgroundColor: '#4caf50', color: 'white', padding: '20px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', minWidth: '250px' },
    popupError: { backgroundColor: '#f44336', color: 'white', padding: '20px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', minWidth: '250px' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
    loader: { fontSize: '18px', color: '#1976d2' },
};

export default AdminUsers;