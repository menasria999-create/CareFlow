import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
const Login = () => {
    const [userType, setUserType] = useState('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [showDisabledModal, setShowDisabledModal] = useState(false);
    const [disabledMessage, setDisabledMessage] = useState('');
    const [disabledRole, setDisabledRole] = useState('');
    const { login, employeeLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (email) setEmailError('');
    }, [email]);

    useEffect(() => {
        if (password) setPasswordError('');
    }, [password]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const validateForm = () => {
        let isValid = true;
        if (!email.trim()) {
            setEmailError('البريد الإلكتروني مطلوب');
            isValid = false;
        }
        if (!password.trim()) {
            setPasswordError('كلمة المرور مطلوبة');
            isValid = false;
        }
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setEmailError('');
        setPasswordError('');
        setShowDisabledModal(false);

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        const normalizedEmail = email.toLowerCase();

        let result;
        if (userType === 'patient') {
            result = await login(normalizedEmail, password);
        } else {
            result = await employeeLogin(normalizedEmail, password);
        }
        
        console.log('Login result:', result);

        if (result.success) {
            const userRole = result.user.role;
            const isEmployee = ['doctor', 'admin', 'receptionist'].includes(userRole);
            
            if (userType === 'patient' && isEmployee) {
                setError('⚠️ هذا الحساب ليس حساب مريض. يرجى اختيار "موظف" أو استخدام حساب مريض صحيح.');
                setLoading(false);
                return;
            }
            
            if (userType === 'employee' && !isEmployee) {
                setError('⚠️ هذا الحساب ليس حساب موظف. يرجى اختيار "مريض" أو استخدام حساب موظف صحيح.');
                setLoading(false);
                return;
            }
            
            switch (result.user.role) {
                case 'patient': navigate('/patient'); break;
                case 'doctor': navigate('/doctor'); break;
                case 'admin': navigate('/admin'); break;
                case 'receptionist': navigate('/receptionist'); break;
                default: navigate('/');
            }
        } else {
            if (result.role_mismatch === true) {
                if (userType === 'patient') {
                    setError('⚠️ هذا الحساب ليس حساب مريض. يرجى اختيار "موظف" أو استخدام حساب مريض صحيح.');
                } else {
                    setError('⚠️ هذا الحساب ليس حساب موظف. يرجى اختيار "مريض" أو استخدام حساب موظف صحيح.');
                }
            }
            else if (result.account_disabled === true) {
                console.log('Account disabled detected. Role:', result.role);
                if (result.role === 'patient') {
                    setDisabledMessage('🌿 لقد تحسنت حالتك الصحية، وتم إخراجك من المنصة. نشكرك على ثقتك. للاستفسار، تواصل مع العيادة.');
                    setDisabledRole('patient');
                } 
                else if (result.role === 'doctor' || result.role === 'receptionist') {
                    setDisabledMessage('📋 تم إنهاء عقد العمل معنا، شكرًا على تفانيكم في العمل والجد، وللاستفسار أكثر تواصل مع العيادة.');
                    setDisabledRole('employee');
                }
                else {
                    setDisabledMessage(result.message || 'تم تعطيل هذا الحساب. للاستفسار، تواصل مع الإدارة.');
                    setDisabledRole('other');
                }
                setShowDisabledModal(true);
                setTimeout(() => setShowDisabledModal(false), 5000);
            } else {
                setError('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة');
            }
        }

        setLoading(false);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotMessage('');
        setForgotLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', { email: forgotEmail });
            setForgotMessage(response.data.message);
            setTimeout(() => {
                setShowForgotModal(false);
                setForgotEmail('');
                setForgotMessage('');
            }, 3000);
        } catch (error) {
            setForgotMessage(error.response?.data?.error || 'حدث خطأ');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.overlay}></div>
            <div style={styles.header}>
                <div style={styles.republicTitle}>الجمهورية الجزائرية الديمقراطية الشعبية</div>
                <div style={styles.ministryTitle}>وزارة الصحة</div>
                <div style={styles.platformTitle}>  </div>
            </div>

            <div style={styles.card}>
                <div style={styles.logoContainer}>
                    <img src="/icons/clinic-logo.png" alt="شعار العيادة" style={styles.logoImage} />
                    <img src="/icons/stethoscope.png" alt="سماعات طبية" style={styles.logoImage} />
                    <img src="/icons/hospital-building.png" alt="مبنى المستشفى" style={styles.logoImage} />
                </div>
                <div style={styles.clinicName}>المنصة الرقمية لادارة المرضى </div>
                
                <h2 style={styles.loginTitle}>تسجيل الدخول</h2>
                
                <div style={styles.userTypeContainer}>
                    <label style={styles.userTypeLabel}>
                        <input type="radio" value="patient" checked={userType === 'patient'} onChange={(e) => setUserType(e.target.value)} style={styles.radio} />
                        <span style={styles.userTypeText}>مريض</span>
                    </label>
                    <label style={styles.userTypeLabel}>
                        <input type="radio" value="employee" checked={userType === 'employee'} onChange={(e) => setUserType(e.target.value)} style={styles.radio} />
                        <span style={styles.userTypeText}>موظف</span>
                    </label>
                </div>
                
                {error && <div style={styles.error}>{error}</div>}
                
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>✉️ البريد الإلكتروني</label>
                        <input 
                            type="text" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            style={{...styles.input, ...(emailError && styles.inputError)}} 
                            required 
                            placeholder="example@email.com" 
                        />
                        {emailError && <div style={styles.fieldError}>{emailError}</div>}
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>🔒 كلمة المرور</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            style={{...styles.input, ...(passwordError && styles.inputError)}} 
                            required 
                            placeholder="********" 
                        />
                        {passwordError && <div style={styles.fieldError}>{passwordError}</div>}
                    </div>
                    
                    <div style={styles.forgotPasswordContainer}>
                        <button type="button" onClick={() => setShowForgotModal(true)} style={styles.forgotButton}>نسيت كلمة المرور؟</button>
                    </div>
                    
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
                    </button>
                </form>
            </div>

            {showForgotModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3>استعادة كلمة المرور</h3>
                            <button onClick={() => setShowForgotModal(false)} style={styles.modalClose}>✕</button>
                        </div>
                        <form onSubmit={handleForgotPassword}>
                            <div style={styles.inputGroup}>
                                <label>البريد الإلكتروني</label>
                                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} style={styles.input} required placeholder="example@email.com" />
                            </div>
                            {forgotMessage && <div style={forgotMessage.includes('تم') ? styles.successMessage : styles.error}>{forgotMessage}</div>}
                            <button type="submit" disabled={forgotLoading} style={styles.button}>
                                {forgotLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showDisabledModal && (
                <div style={styles.disabledModalOverlay}>
                    <div style={disabledRole === 'patient' ? styles.disabledModalPatient : styles.disabledModalEmployee}>
                        <div style={styles.disabledIcon}>{disabledRole === 'patient' ? '🌿' : '📋'}</div>
                        <h2 style={styles.disabledTitle}>
                            {disabledRole === 'patient' ? 'تم تحسين حالتك الصحية!' : 'إنهاء عقد العمل'}
                        </h2>
                        <p style={styles.disabledMessage}>{disabledMessage}</p>
                        <div style={styles.disabledDivider}></div>
                        <button onClick={() => setShowDisabledModal(false)} style={styles.disabledCloseButton}>إغلاق</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundImage: 'url("/icons/clinic-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        direction: 'rtl',
        padding: '20px',
        position: 'relative',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(5px)',
        zIndex: 1,
    },
    header: {
        textAlign: 'center',
        marginBottom: '30px',
        color: 'white',
        position: 'relative',
        zIndex: 2,
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    },
    republicTitle: { fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' },
    ministryTitle: { fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' },
    platformTitle: { fontSize: '14px', opacity: 0.9 },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(12px)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    logoContainer: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: '15px',
        gap: '15px'
    },
    logoImage: {
        width: '60px',
        height: '60px',
        objectFit: 'contain',
        margin: '0 5px',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
    },
    clinicName: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: '30px',
        borderBottom: '2px solid rgba(255,255,255,0.3)',
        display: 'inline-block',
        paddingBottom: '10px',
        textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
    },
    loginTitle: { fontSize: '20px', color: '#fff', marginBottom: '25px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' },
    userTypeContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        marginBottom: '25px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '12px',
        borderRadius: '12px',
        backdropFilter: 'blur(5px)',
    },
    userTypeLabel: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    userTypeText: { fontSize: '16px', fontWeight: 'bold', color: '#fff', textShadow: '1px 1px 1px rgba(0,0,0,0.2)' },
    radio: { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#1976d2' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'right' },
    label: { fontSize: '14px', fontWeight: 'bold', color: '#fff', textShadow: '1px 1px 1px rgba(0,0,0,0.2)' },




input: {
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    fontSize: '16px',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#333',
    transition: 'all 0.3s ease',
},



    inputError: {
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
    },
    fieldError: {
        color: '#ffcccc',
        fontSize: '12px',
        marginTop: '4px',
        textAlign: 'right',
    },
    forgotPasswordContainer: { textAlign: 'left', marginTop: '-10px' },
    forgotButton: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', textShadow: '1px 1px 1px rgba(0,0,0,0.2)' },
    button: {
        padding: '12px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
        transition: 'background-color 0.3s ease',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    },
    error: { 
        backgroundColor: 'rgba(239, 68, 68, 0.2)', 
        color: '#ffcccc', 
        padding: '12px', 
        borderRadius: '8px', 
        marginBottom: '20px', 
        fontSize: '14px', 
        backdropFilter: 'blur(5px)',
    },
    successMessage: { 
        backgroundColor: 'rgba(34, 197, 94, 0.2)', 
        color: '#ccffcc', 
        padding: '12px', 
        borderRadius: '8px', 
        marginBottom: '20px', 
        fontSize: '14px', 
        backdropFilter: 'blur(5px)',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: { 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        backdropFilter: 'blur(15px)', 
        borderRadius: '20px', 
        padding: '30px', 
        width: '400px', 
        maxWidth: '90%', 
        border: '1px solid rgba(255,255,255,0.3)',
    },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: '#fff' },
    modalClose: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#fff' },
    disabledModalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
    },
    disabledModalPatient: {
        backgroundColor: 'rgba(46, 125, 50, 0.95)',
        borderRadius: '20px',
        padding: '35px',
        width: '450px',
        maxWidth: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        border: '2px solid #81c784',
    },
    disabledModalEmployee: {
        backgroundColor: 'rgba(25, 118, 210, 0.95)',
        borderRadius: '20px',
        padding: '35px',
        width: '450px',
        maxWidth: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        border: '2px solid #64b5f6',
    },
    disabledIcon: { fontSize: '60px', marginBottom: '15px' },
    disabledTitle: { fontSize: '24px', color: '#fff', marginBottom: '15px', fontWeight: 'bold' },
    disabledMessage: { fontSize: '16px', color: '#fff', lineHeight: '1.6', marginBottom: '15px' },
    disabledDivider: { width: '50px', height: '3px', backgroundColor: 'rgba(255,255,255,0.5)', margin: '15px auto', borderRadius: '3px' },
    disabledCloseButton: { padding: '12px 24px', backgroundColor: '#fff', color: '#1976d2', border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%', marginTop: '10px' },
};

export default Login;
