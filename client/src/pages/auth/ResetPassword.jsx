import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('رابط غير صالح');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (password !== confirmPassword) {
            setError('كلمة المرور الجديدة غير متطابقة');
            return;
        }
        
        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await api.post('/auth/reset-password', {
                token: token,
                new_password: password
            });
            
            setSuccess(response.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setError(error.response?.data?.message || error.response?.data?.error || 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2>رابط غير صالح</h2>
                    <p>الرابط الذي استخدمته غير صالح أو منتهي الصلاحية.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logoContainer}>
                    <span style={styles.logoIcon}>🏥</span>
                    <span style={styles.logoIcon}>🩺</span>
                    <span style={styles.logoIcon}>💊</span>
                </div>
                <h2 style={styles.title}>إعادة تعيين كلمة المرور</h2>
                
                {error && <div style={styles.error}>{error}</div>}
                {success && <div style={styles.success}>{success}</div>}
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label>كلمة المرور الجديدة</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            required
                            placeholder="********"
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label>تأكيد كلمة المرور الجديدة</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={styles.input}
                            required
                            placeholder="********"
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '40px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
    },
    logoContainer: {
        marginBottom: '20px',
    },
    logoIcon: {
        fontSize: '40px',
        margin: '0 10px',
    },
    title: {
        fontSize: '24px',
        color: '#333',
        marginBottom: '30px',
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
        textAlign: 'right',
    },
    input: {
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '16px',
        outline: 'none',
    },
    button: {
        padding: '12px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
    },
    error: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
    },
    success: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
    },
};

export default ResetPassword;