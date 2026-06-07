import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            setMessage({ text: 'رابط غير صالح. يرجى استخدام الرابط المرسل إلى بريدك.', type: 'error' });
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // التحقق من تطابق كلمة المرور
        if (password !== confirmPassword) {
            setMessage({ text: 'كلمة المرور غير متطابقة', type: 'error' });
            return;
        }
        
        // التحقق من طول كلمة المرور
        if (password.length < 6) {
            setMessage({ text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', type: 'error' });
            return;
        }
        
        setLoading(true);
        setMessage({ text: '', type: '' });
        
        try {
            const response = await api.post('/auth/reset-password', {
                token: token,
                new_password: password
            });
            
            setMessage({ text: response.data.message, type: 'success' });
            
            // الانتقال إلى صفحة تسجيل الدخول بعد 3 ثوانٍ
            setTimeout(() => {
                navigate('/login');
            }, 3000);
            
        } catch (error) {
            setMessage({
                text: error.response?.data?.message || 'حدث خطأ، يرجى المحاولة مرة أخرى',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // إذا لم يكن هناك توكن
    if (!token) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.errorIcon}>⚠️</div>
                    <h2 style={styles.title}>رابط غير صالح</h2>
                    <p style={styles.description}>
                        الرابط الذي استخدمته غير صالح أو منتهي الصلاحية.
                    </p>
                    <Link to="/forgot-password" style={styles.link}>
                        طلب رابط جديد
                    </Link>
                    <div style={styles.backToLogin}>
                        <Link to="/login">← العودة إلى تسجيل الدخول</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h2 style={styles.title}>إعادة تعيين كلمة المرور</h2>
                    <p style={styles.description}>
                        أدخل كلمة المرور الجديدة لحسابك.
                    </p>
                </div>

                {message.text && (
                    <div style={message.type === 'success' ? styles.success : styles.error}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>كلمة المرور الجديدة</label>
                        <div style={styles.passwordWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={styles.input}
                                placeholder="********"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>تأكيد كلمة المرور الجديدة</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={styles.input}
                            placeholder="********"
                            required
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'جاري الحفظ...' : 'إعادة تعيين كلمة المرور'}
                    </button>
                </form>
                
                <div style={styles.backToLogin}>
                    <Link to="/login">← العودة إلى تسجيل الدخول</Link>
                </div>
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
        padding: '20px'
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '450px',
        maxWidth: '90%',
        textAlign: 'center'
    },
    header: {
        marginBottom: '25px'
    },
    title: {
        marginBottom: '15px',
        color: '#333',
        fontSize: '24px'
    },
    description: {
        marginBottom: '10px',
        color: '#666',
        fontSize: '14px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    inputGroup: {
        textAlign: 'right',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: '14px'
    },
    input: {
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '16px',
        width: '100%',
        boxSizing: 'border-box'
    },
    passwordWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    eyeButton: {
        position: 'absolute',
        left: '10px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '18px'
    },
    button: {
        padding: '12px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
    },
    success: {
        padding: '12px',
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        borderRadius: '5px',
        marginBottom: '15px',
        fontSize: '14px'
    },
    error: {
        padding: '12px',
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderRadius: '5px',
        marginBottom: '15px',
        fontSize: '14px'
    },
    backToLogin: {
        marginTop: '20px',
        textAlign: 'center'
    },
    link: {
        color: '#1976d2',
        textDecoration: 'none',
        display: 'inline-block',
        marginTop: '10px'
    },
    errorIcon: {
        fontSize: '48px',
        marginBottom: '15px'
    }
};

export default ResetPassword;