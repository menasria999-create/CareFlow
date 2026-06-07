import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AddMedicalRecord = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        report_type: 'image'
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    const reportTypes = [
        { value: 'lab', label: '🧪 تحليل طبي', icon: '🧪' },
        { value: 'radiology', label: '🩻 صورة أشعة', icon: '🩻' },
        { value: 'document', label: '📄 وثائق خاصة', icon: '📄' },
        { value: 'report', label: '📋 تقرير طبي', icon: '📋' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // دالة لتعبئة العنوان تلقائياً عند اختيار نوع المستند
    const handleReportTypeChange = (type) => {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();
        const dateStr = `${day}/${month}/${year}`;
        
        let autoTitle = '';
        switch (type) {
            case 'lab':
                autoTitle = `🧪 تحليل طبي - ${dateStr}`;
                break;
            case 'radiology':
                autoTitle = `🩻 صورة أشعة - ${dateStr}`;
                break;
            case 'document':
                autoTitle = `📄 وثيقة خاصة - ${dateStr}`;
                break;
            case 'report':
                autoTitle = `📋 تقرير طبي - ${dateStr}`;
                break;
            default:
                autoTitle = '';
        }
        
        setFormData({
            ...formData,
            report_type: type,
            title: autoTitle
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setFilePreview(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!formData.title) {
            setError('يرجى إدخال عنوان للمستند');
            setLoading(false);
            return;
        }

        if (!formData.content && !selectedFile) {
            setError('يرجى إدخال محتوى أو رفع ملف');
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('content', formData.content || '');
        data.append('report_type', formData.report_type);
        if (selectedFile) {
            data.append('file', selectedFile);
        }

        try {
            const response = await api.post('/patients/reports', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data.success) {
                setSuccess('تم إضافة المستند الطبي بنجاح!');
                setTimeout(() => {
                    navigate('/patient/records');
                }, 2000);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'حدث خطأ في إضافة المستند');
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/patient', icon: '🏠' },
        { name: 'ملفي الشخصي', path: '/patient/profile', icon: '👤' },
        { name: 'المواعيد', path: '/patient/appointments', icon: '📅' },
        { name: 'الوصفات', path: '/patient/prescriptions', icon: '💊' },
        { name: 'السجل الطبي', path: '/patient/records', icon: '📋' },
    ];

    const getTypeIcon = (type) => {
        const found = reportTypes.find(t => t.value === type);
        return found ? found.icon : '📄';
    };

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}>
                    <div style={styles.logoHealth}> 🏥 </div>
                </div>
                <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>👤</div>
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
                            <span style={styles.navIcon}>{item.icon}</span>
                            <span>{item.name}</span>
                        </button>
                    ))}
                    <button onClick={logout} style={styles.logoutButton}>
                        <span style={styles.navIcon}>🚪</span>
                        <span>تسجيل الخروج</span>
                    </button>
                </nav>
            </div>

            <div style={styles.mainContent}>
                <div style={styles.header}>
                    <h1>إضافة مستند طبي جديد</h1>
                    <p>يمكنك إضافة تحاليل طبية، صور أشعة، أو تقارير طبية</p>
                </div>

                <div style={styles.formContainer}>
                    {error && <div style={styles.error}>{error}</div>}
                    {success && <div style={styles.success}>{success}</div>}

                    <form onSubmit={handleSubmit} style={styles.form}>
                        {/* نوع المستند */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>📋 نوع المستند *</label>
                            <div style={styles.typeGrid}>
                                {reportTypes.map((type) => (
                                    <div
                                        key={type.value}
                                        style={{
                                            ...styles.typeCard,
                                            ...(formData.report_type === type.value && styles.typeCardSelected)
                                        }}
                                        onClick={() => handleReportTypeChange(type.value)}
                                    >
                                        <div style={styles.typeIcon}>{type.icon}</div>
                                        <div>{type.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* العنوان - سيتم تعبئته تلقائياً */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>📝 العنوان *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                style={styles.input}
                                placeholder="سيتم تعبئة العنوان تلقائياً عند اختيار نوع المستند"
                                required
                            />
                        </div>

                        {/* المحتوى */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>📄 المحتوى / الوصف</label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                style={styles.textarea}
                                rows="6"
                                placeholder="اكتب تفاصيل التحليل أو التقرير الطبي هنا..."
                            />
                        </div>

                        {/* رفع ملف */}
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>📎 رفع ملف (صورة أو PDF)</label>
                            <div style={styles.fileArea}>
                                <input
                                    type="file"
                                    id="file"
                                    onChange={handleFileChange}
                                    style={styles.fileInput}
                                    accept="image/*,application/pdf"
                                />
                                <label htmlFor="file" style={styles.fileLabel}>
                                    📂 اختر ملف
                                </label>
                                {selectedFile && (
                                    <div style={styles.fileName}>
                                        📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                                    </div>
                                )}
                            </div>
                            <p style={styles.fileHint}>الملفات المدعومة: صور (JPG, PNG, GIF) و PDF (حد أقصى 5 ميجابايت)</p>
                        </div>

                        {/* معاينة الصورة */}
                        {filePreview && (
                            <div style={styles.previewContainer}>
                                <label style={styles.label}>🖼️ معاينة الصورة:</label>
                                <img src={filePreview} alt="Preview" style={styles.preview} />
                            </div>
                        )}

                        <button type="submit" disabled={loading} style={styles.submitButton}>
                            {loading ? 'جاري الحفظ...' : '💾 حفظ المستند'}
                        </button>
                    </form>
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
        fontSize: '50px',
        marginBottom: '10px',
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
    },
    navIcon: {
        fontSize: '20px',
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
    },
    mainContent: {
        flex: 1,
        padding: '30px',
    },
    header: {
        marginBottom: '30px',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333',
    },
    input: {
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
    },
    textarea: {
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        fontFamily: 'inherit',
        resize: 'vertical',
    },
    typeGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '10px',
    },
    typeCard: {
        padding: '12px',
        textAlign: 'center',
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        backgroundColor: 'white',
    },
    typeCardSelected: {
        borderColor: '#1976d2',
        backgroundColor: '#e3f2fd',
    },
    typeIcon: {
        fontSize: '24px',
        marginBottom: '5px',
    },
    fileArea: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flexWrap: 'wrap',
    },
    fileInput: {
        display: 'none',
    },
    fileLabel: {
        padding: '10px 20px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    fileName: {
        fontSize: '14px',
        color: '#666',
    },
    fileHint: {
        fontSize: '12px',
        color: '#999',
        marginTop: '5px',
    },
    previewContainer: {
        marginTop: '10px',
    },
    preview: {
        maxWidth: '100%',
        maxHeight: '200px',
        borderRadius: '5px',
        marginTop: '10px',
    },
    submitButton: {
        padding: '12px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '10px',
    },
    error: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '12px',
        borderRadius: '5px',
        marginBottom: '20px',
    },
    success: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        padding: '12px',
        borderRadius: '5px',
        marginBottom: '20px',
    },
};

export default AddMedicalRecord;