import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterPatient = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showPopup, setShowPopup] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);
    const printRef = useRef(null);
    
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '123456',
        phone: '',
        date_of_birth: '',
        gender: 'male',
        blood_type: '',
        medical_history: '',
        allergies: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePrint = () => {
        setShowPrintPreview(true);
        setTimeout(() => {
            const printContent = printRef.current;
            if (printContent) {
                const printWindow = window.open('', '_blank', 'width=600,height=600');
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>معلومات حساب المريض</title>
                        <style>
                            body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
                            h2 { color: #1976d2; text-align: center; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                            th { background-color: #1976d2; color: white; }
                            .header { text-align: center; margin-bottom: 20px; }
                            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                        <div class="footer">تم إنشاء الحساب بواسطة  المنصة الرقمية لإدارة المرضى</div>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
                printWindow.close();
            }
            setShowPrintPreview(false);
        }, 100);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        const requiredFields = ['full_name', 'email', 'password', 'phone', 'date_of_birth', 'gender', 'blood_type', 'medical_history', 'allergies', 'emergency_contact_name', 'emergency_contact_phone'];
        for (let field of requiredFields) {
            if (!formData[field]) {
                setMessage({ text: `⚠️ حقل ${field} مطلوب`, type: 'error' });
                setLoading(false);
                setShowPopup(true);
                setTimeout(() => setShowPopup(false), 3000);
                return;
            }
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        if (!emailRegex.test(formData.email)) {
            setMessage({ text: '⚠️ البريد الإلكتروني غير صحيح. يجب أن يكون عنوان Gmail صالح', type: 'error' });
            setLoading(false);
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000);
            return;
        }

        const normalizedEmail = formData.email.toLowerCase();

        try {
            const regRes = await fetch('http://localhost:5000/api/auth/register/patient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    email: normalizedEmail,
                    password: formData.password,
                    phone: formData.phone,
                    date_of_birth: formData.date_of_birth,
                    gender: formData.gender,
                    blood_type: formData.blood_type,
                    medical_history: formData.medical_history,
                    allergies: formData.allergies,
                    emergency_contact_name: formData.emergency_contact_name,
                    emergency_contact_phone: formData.emergency_contact_phone
                })
            });
            const regData = await regRes.json();
            if (!regRes.ok) throw new Error(regData.message || 'فشل التسجيل');

            setCreatedUser({
                ...formData,
                email: normalizedEmail
            });
            
            setMessage({ text: '✅ تم إنشاء حساب المريض بنجاح!', type: 'success' });
            setShowPopup(true);
            
            setTimeout(() => {
                setShowPopup(false);
                setShowPrintPreview(true);
            }, 1500);
            
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: '', email: '', password: '123456', phone: '', date_of_birth: '',
            gender: 'male', blood_type: '', medical_history: '', allergies: '',
            emergency_contact_name: '', emergency_contact_phone: ''
        });
        setCreatedUser(null);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.titleContainer}>
                    <img src="/icons/register-3d.png" alt="تسجيل مريض" style={styles.titleIcon} />
                    <h2 style={styles.title}>إنشاء حساب مريض جديد</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label>الاسم الكامل <span style={styles.requiredStar}>*</span></label>
                        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                        <label>البريد الإلكتروني (Gmail) <span style={styles.requiredStar}>*</span></label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required pattern="[a-zA-Z0-9._%+-]+@gmail\.com" title="بريد Gmail صالح" style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                        <label>كلمة المرور <span style={styles.requiredStar}>*</span></label>
                        <input type="text" name="password" value={formData.password} onChange={handleChange} required style={styles.input} />
                        <small style={styles.hint}>الافتراضية 123456</small>
                    </div>
                    <div style={styles.formGroup}>
                        <label>رقم الهاتف <span style={styles.requiredStar}>*</span></label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="مثال: 0555123456" style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                        <label>تاريخ الميلاد <span style={styles.requiredStar}>*</span></label>
                        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                        <label>الجنس <span style={styles.requiredStar}>*</span></label>
                        <select name="gender" value={formData.gender} onChange={handleChange} required style={styles.select}>
                            <option value="male">ذكر</option>
                            <option value="female">أنثى</option>
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label>فصيلة الدم (الزمرة) <span style={styles.requiredStar}>*</span></label>
                        <select name="blood_type" value={formData.blood_type} onChange={handleChange} required style={styles.select}>
                            <option value="">-- اختر فصيلة الدم --</option>
                            {bloodTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div style={styles.formGroup}>
                        <label>التاريخ الطبي <span style={styles.requiredStar}>*</span></label>
                        <textarea name="medical_history" value={formData.medical_history} onChange={handleChange} rows="3" required placeholder="مثال: السكري، ضغط الدم..." style={styles.textarea} />
                    </div>
                    <div style={styles.formGroup}>
                        <label>الحساسية <span style={styles.requiredStar}>*</span></label>
                        <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows="2" required placeholder="مثال: البنسلين، الأسبرين..." style={styles.textarea} />
                    </div>
                    
                    {/* حقول جهة اتصال للطوارئ */}
                    <div style={styles.divider}>📞 جهة اتصال للطوارئ</div>
                    <div style={styles.formGroup}>
                        <label>اسم جهة الاتصال <span style={styles.requiredStar}>*</span></label>
                        <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} required style={styles.input} placeholder="مثال: أحمد محمد" />
                    </div>
                    <div style={styles.formGroup}>
                        <label>رقم هاتف الطوارئ <span style={styles.requiredStar}>*</span></label>
                        <input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} required style={styles.input} placeholder="مثال: 0555123456" />
                    </div>
                    
                    <button type="submit" disabled={loading} style={styles.button}>
                        <img src="/icons/save-3d.png" alt="حفظ" style={styles.buttonIcon} />
                        {loading ? 'جاري ...' : 'إنشاء حساب'}
                    </button>
                </form>
                <div style={styles.loginLink}>لديك حساب بالفعل؟ <a href="/login">تسجيل الدخول</a></div>
            </div>
            
            {showPopup && (
                <div style={styles.popupOverlay}>
                    <div style={message.type === 'success' ? styles.popupSuccess : styles.popupError}>
                        <img src={message.type === 'success' ? "/icons/success-3d.png" : "/icons/error-3d.png"} alt="" style={styles.popupIcon} />
                        {message.text}
                    </div>
                </div>
            )}
            
            {showPrintPreview && createdUser && (
                <div style={styles.printOverlay}>
                    <div style={styles.printModal}>
                        <div style={styles.printModalHeader}>
                            <h3>معاينة معلومات الحساب</h3>
                            <div style={styles.printButtons}>
                                <button onClick={handlePrint} style={styles.printButton}>🖨️ طباعة</button>
                                <button onClick={() => { setShowPrintPreview(false); resetForm(); }} style={styles.closePrintButton}>إغلاق</button>
                            </div>
                        </div>
                        <div ref={printRef} style={styles.printContent}>
                            <div style={styles.printHeader}>
                                <h2>المنصة الرقمية لإدارة المرضى</h2>
                                <p>🏥 عيادة الشفاء الطبية </p>
                                <hr />
                            </div>
                            <h3>معلومات حساب المريض</h3>
                            <table style={styles.printTable}>
                                <tbody>
                                    <tr><th>الاسم الكامل</th><td>{createdUser.full_name}</td></tr>
                                    <tr><th>البريد الإلكتروني</th><td>{createdUser.email}</td></tr>
                                    <tr><th>رقم الهاتف</th><td>{createdUser.phone}</td></tr>
                                    <tr><th>تاريخ الميلاد</th><td>{createdUser.date_of_birth}</td></tr>
                                    <tr><th>الجنس</th><td>{createdUser.gender === 'male' ? 'ذكر' : 'أنثى'}</td></tr>
                                    <tr><th>فصيلة الدم</th><td>{createdUser.blood_type}</td></tr>
                                    <tr><th>جهة اتصال للطوارئ</th><td>{createdUser.emergency_contact_name} - {createdUser.emergency_contact_phone}</td></tr>
                                </tbody>
                            </table>
                            <div style={styles.printFooter}>
                                <p>يرجى الاحتفاظ بهذه المعلومات في مكان آمن</p>
                                <p>تاريخ الإنشاء: {new Date().toLocaleDateString('ar-EG')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', direction: 'rtl', padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 15, padding: 40, width: '100%', maxWidth: 650, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', position: 'relative' },
    titleContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: 30 },
    titleIcon: { width: '32px', height: '32px', objectFit: 'contain' },
    title: { textAlign: 'center', margin: 0, fontSize: 24 },
    formGroup: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 15 },
    input: { padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, width: '100%' },
    select: { padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, width: '100%', backgroundColor: 'white' },
    textarea: { padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, resize: 'vertical', width: '100%', fontFamily: 'inherit' },
    divider: { fontSize: 18, fontWeight: 'bold', color: '#1976d2', margin: '15px 0 10px 0', paddingBottom: 5, borderBottom: '2px solid #1976d2' },
    button: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#28a745', color: 'white', padding: 14, borderRadius: 8, cursor: 'pointer', fontSize: 16, marginTop: 10, border: 'none', width: '100%' },
    buttonIcon: { width: '20px', height: '20px', objectFit: 'contain' },
    hint: { fontSize: 12, color: '#666', marginTop: 4 },
    requiredStar: { color: '#f44336', marginLeft: '4px' },
    loginLink: { textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid #eee', color: '#666' },
    popupOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, direction: 'rtl' },
    popupSuccess: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#4caf50', color: 'white', padding: '20px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', minWidth: '250px' },
    popupError: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f44336', color: 'white', padding: '20px 40px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', minWidth: '250px' },
    popupIcon: { width: '30px', height: '30px', objectFit: 'contain' },
    printOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, direction: 'rtl' },
    printModal: { backgroundColor: 'white', borderRadius: 15, width: '550px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto', padding: 20 },
    printModalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #eee' },
    printButtons: { display: 'flex', gap: 10 },
    printButton: { padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' },
    closePrintButton: { padding: '8px 16px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' },
    printContent: { padding: 20, fontFamily: 'Arial, sans-serif' },
    printHeader: { textAlign: 'center', marginBottom: 20 },
    printTable: { width: '100%', borderCollapse: 'collapse', marginTop: 15 },
    printFooter: { textAlign: 'center', marginTop: 30, fontSize: 12, color: '#666' }
};

export default RegisterPatient;