import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [submitted, setSubmitted] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
            setMessage({ text: response.data.message, type: 'success' });
            
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) clearInterval(timer);
                    return prev - 1;
                });
            }, 1000);
            
        } catch (error) {
            setMessage({
                text: error.response?.data?.message || 'حدث خطأ، يرجى المحاولة مرة أخرى',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>نسيت كلمة المرور؟</h2>
                <p style={styles.description}>
                    أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                </p>

                {message.text && (
                    <div style={message.type === 'success' ? styles.success : styles.error}>
                        {message.text}
                    </div>
                )}

                {!submitted ? (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>البريد الإلكتروني</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={styles.input}
                                placeholder="example@email.com"
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} style={styles.button}>
                            {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                        </button>
                    </form>
                ) : (
                    <div style={styles.actions}>
                        <Link to="/login" style={styles.loginLink}>
                            العودة إلى صفحة تسجيل الدخول
                        </Link>
                    </div>
                )}

                {countdown > 0 && (
                    <p style={styles.countdown}>
                        يمكنك طلب رابط جديد بعد {countdown} ثانية
                    </p>
                )}

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
    title: {
        marginBottom: '15px',
        color: '#333',
        fontSize: '24px'
    },
    description: {
        marginBottom: '25px',
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
    button: {
        padding: '12px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: 'pointer'
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
    actions: {
        marginTop: '20px'
    },
    backToLogin: {
        marginTop: '20px',
        textAlign: 'center'
    },
    loginLink: {
        color: '#1976d2',
        textDecoration: 'none'
    },
    countdown: {
        marginTop: '15px',
        fontSize: '12px',
        color: '#666'
    }
};

export default ForgotPassword;