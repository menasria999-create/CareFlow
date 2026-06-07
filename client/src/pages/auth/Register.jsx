import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        date_of_birth: '',
        gender: 'male',
        medical_history: '',
        allergies: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // 🔥 تحويل البريد إلى أحرف صغيرة
        const normalizedEmail = formData.email.toLowerCase();

        console.log('Submitting form data:', formData);

        // تحويل صيغة التاريخ
        const formattedData = {
            ...formData,
            email: normalizedEmail,  // 🔥 استخدام البريد المحول
            date_of_birth: formData.date_of_birth.split('T')[0]
        };
        console.log('Formatted data:', formattedData);

        // التحقق من صحة البيانات
        if (!formData.full_name || !formData.email || !formData.password || !formData.date_of_birth) {
            setError('يرجى تعبئة جميع الحقول المطلوبة');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            setLoading(false);
            return;
        }

        const result = await register(formattedData);
        
        console.log('Registration result:', result);

        if (result.success) {
            navigate('/patient');
        } else {
            setError(result.message || 'حدث خطأ في التسجيل');
        }

        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logoHealth}> 🏥 </div>
                <h2 style={styles.subtitle}>إنشاء حساب جديد</h2>
                
                {error && <div style={styles.error}>{error}</div>}
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>الاسم الكامل *</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            style={styles.input}
                            required
                            placeholder="أدخل اسمك الكامل"
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>البريد الإلكتروني *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={styles.input}
                            required
                            placeholder="example@email.com"
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>كلمة المرور *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            style={styles.input}
                            required
                            placeholder="******** (6 أحرف على الأقل)"
                        />
                    </div>
                    
                    <div style={styles.row}>
                        <div style={styles.halfInput}>
                            <label style={styles.label}>رقم الهاتف</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                style={styles.input}
                                placeholder="05xxxxxxxx"
                            />
                        </div>
                        
                        <div style={styles.halfInput}>
                            <label style={styles.label}>تاريخ الميلاد *</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>الجنس *</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            style={styles.select}
                        >
                            <option value="male">ذكر</option>
                            <option value="female">أنثى</option>
                            <option value="other">آخر</option>
                        </select>
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>التاريخ الطبي (الأمراض المزمنة)</label>
                        <textarea
                            name="medical_history"
                            value={formData.medical_history}
                            onChange={handleChange}
                            style={styles.textarea}
                            rows="3"
                            placeholder="مثال: السكري، ارتفاع ضغط الدم..."
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>الحساسية</label>
                        <textarea
                            name="allergies"
                            value={formData.allergies}
                            onChange={handleChange}
                            style={styles.textarea}
                            rows="2"
                            placeholder="مثال: البنسلين، المكسرات..."
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                    </button>
                </form>
                
                <p style={styles.loginLink}>
                    لديك حساب بالفعل؟{' '}
                    <Link to="/login" style={styles.link}>
                        تسجيل الدخول
                    </Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        direction: 'rtl',
        padding: '20px',
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
    },
    logoHealth: {
        fontSize: '40px',
        textAlign: 'center',
        marginBottom: '10px',
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: '30px',
        fontSize: '18px',
        fontWeight: 'normal',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    row: {
        display: 'flex',
        gap: '15px',
    },
    halfInput: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    label: {
        fontSize: '14px',
        color: '#333',
        fontWeight: '500',
    },
    input: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
    },
    select: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        backgroundColor: 'white',
    },
    textarea: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        fontFamily: 'inherit',
        resize: 'vertical',
    },
    button: {
        padding: '12px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
    },
    error: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px',
        textAlign: 'center',
        fontSize: '14px',
    },
    loginLink: {
        textAlign: 'center',
        marginTop: '20px',
        color: '#666',
    },
    link: {
        color: '#1976d2',
        textDecoration: 'none',
    },
};

export default Register;