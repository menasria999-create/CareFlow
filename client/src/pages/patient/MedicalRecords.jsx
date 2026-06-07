import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MedicalRecords = () => {
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('reports');
    const [newReport, setNewReport] = useState({ title: '', content: '' });
    const [newFile, setNewFile] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [uploading, setUploading] = useState(false);
    const [patientId, setPatientId] = useState(null);

    useEffect(() => {
        fetchDoctors();
        fetchPatientId();
    }, []);

    useEffect(() => {
        if (selectedDoctor && patientId) {
            fetchDoctorData();
        }
    }, [selectedDoctor, patientId]);

    const fetchPatientId = async () => {
        try {
            const response = await api.get(`/patients/by-user/${user.id}`);
            if (response.data && response.data.id) {
                setPatientId(response.data.id);
                return response.data.id;
            }
            return null;
        } catch (error) {
            console.error('Error fetching patient id:', error);
            try {
                const appointmentsRes = await api.get('/patients/my-appointments');
                if (appointmentsRes.data && appointmentsRes.data.length > 0 && appointmentsRes.data[0].patient_id) {
                    setPatientId(appointmentsRes.data[0].patient_id);
                    return appointmentsRes.data[0].patient_id;
                }
            } catch (err) {
                console.error('Alternative fetch also failed:', err);
            }
            return null;
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/patients/my-doctors');
            console.log('📋 Doctors list:', res.data);
            setDoctors(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setLoading(false);
        }
    };

    const fetchDoctorData = async () => {
        try {
            if (!patientId || !selectedDoctor) {
                console.log('Waiting for data...');
                return;
            }
            
            console.log('Selected Doctor:', selectedDoctor);
            
            const docsRes = await api.get(`/patients/reports`);
            const allDocs = docsRes.data || [];
            
            const allReports = allDocs.filter(doc => doc.report_type === 'report');
            const allDocuments = allDocs.filter(doc => doc.report_type !== 'report' && doc.file_url);
            
            // تصفية حسب اسم الطبيب
            const filteredReports = allReports.filter(report => 
                report.doctor_name === selectedDoctor?.doctor_name
            );
            
            console.log('All reports:', allReports.length);
            console.log('Filtered reports by doctor name:', filteredReports.length);
            
            setReports(filteredReports);
            setDocuments(allDocuments);
            
        } catch (error) {
            console.error('❌ Error fetching data:', error);
            setReports([]);
            setDocuments([]);
        }
    };

    const handleDoctorClick = (doctor) => {
        setSelectedDoctor(doctor);
    };

    const handleAddReport = async (e) => {
        e.preventDefault();
        if (!newReport.title.trim() || !newReport.content.trim()) {
            setMessage({ text: '⚠️ الرجاء إدخال عنوان ومحتوى التقرير', type: 'error' });
            return;
        }
        
        if (!patientId) {
            setMessage({ text: '⚠️ حدث خطأ في تحديد هوية المريض', type: 'error' });
            return;
        }
        
        try {
            const response = await api.post('/doctors/reports', {
                patient_id: patientId,
                title: newReport.title,
                content: newReport.content
            });
            if (response.data.success) {
                setMessage({ text: '✅ تم إضافة التقرير الطبي بنجاح', type: 'success' });
                setNewReport({ title: '', content: '' });
                if (selectedDoctor) fetchDoctorData();
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            }
        } catch (error) {
            console.error('Add report error:', error);
            setMessage({ text: '❌ حدث خطأ في إضافة التقرير', type: 'error' });
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!newFile) {
            setMessage({ text: '⚠️ الرجاء اختيار ملف', type: 'error' });
            return;
        }
        
        if (!patientId) {
            setMessage({ text: '⚠️ حدث خطأ في تحديد هوية المريض', type: 'error' });
            return;
        }
        
        const formData = new FormData();
        formData.append('file', newFile);
        formData.append('title', newFile.name);
        formData.append('report_type', 'document');
        formData.append('patient_id', patientId);

        try {
            setUploading(true);
            const response = await api.post(`/patients/reports`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                setMessage({ text: '✅ تم رفع المستند بنجاح', type: 'success' });
                setNewFile(null);
                if (selectedDoctor) fetchDoctorData();
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ text: '❌ حدث خطأ في رفع المستند', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/patient', icon: '/icons/home-3d.png' },
        { name: 'ملفي الشخصي', path: '/patient/profile', icon: '/icons/profile-3d.png' },
        { name: 'المواعيد', path: '/patient/appointments', icon: '/icons/appointments-3d.png' },
        { name: 'الوصفات', path: '/patient/prescriptions', icon: '/icons/prescriptions-3d.png' },
        { name: 'السجل الطبي', path: '/patient/records', icon: '/icons/records-3d.png' },
        { name: 'الاستشارات', path: '/patient/consultations', icon: '/icons/consultations-3d.png' },
    ];

    if (loading) {
        return <div style={styles.loadingContainer}>جاري التحميل...</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}><div style={styles.logoHealth}></div></div>
                <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>
                        <img src="/icons/patient-avatar-3d.png" alt="صورة المريض" style={styles.avatarImg} />
                    </div>
                    <div style={styles.userName}>{user?.full_name}</div>
                    <div style={styles.userRole}>مريض(ة)</div>
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
                    <img src="/icons/records-3d.png" alt="السجل الطبي" style={styles.headerIcon} />
                    <h1>السجل الطبي</h1>
                </div>
                {!selectedDoctor ? (
                    <>
                        <p>اختر الطبيب لعرض سجلك الطبي معه</p>
                        {doctors.length === 0 ? (
                            <div style={styles.empty}>لا يوجد أطباء قمت بزيارتهم بعد</div>
                        ) : (
                            <div style={styles.doctorsList}>
                                {doctors.map(doctor => (
                                    <div key={doctor.doctor_id} style={styles.doctorCard} onClick={() => handleDoctorClick(doctor)}>
                                        <div style={styles.doctorIcon}>
                                            <img src="/icons/doctor-avatar-3d.png" alt="طبيب" style={styles.doctorIconImg} />
                                        </div>
                                        <div style={styles.doctorInfo}>
                                            <div style={styles.doctorName}>د. {doctor.doctor_name}</div>
                                            <div style={styles.doctorSpecialty}>{doctor.specialization}</div>
                                        </div>
                                        <div style={styles.arrow}>
                                            <img src="/icons/arrow-3d.png" alt="اختيار" style={styles.arrowImg} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <button onClick={() => setSelectedDoctor(null)} style={styles.backButton}>
                            <img src="/icons/back-3d.png" alt="رجوع" style={styles.backIcon} />
                            العودة إلى قائمة الأطباء
                        </button>
                        <h2>السجل الطبي مع د. {selectedDoctor.doctor_name}</h2>
                        <p>التخصص: {selectedDoctor.specialization}</p>

                        {message.text && (
                            <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                                {message.text}
                            </div>
                        )}

                        <div style={styles.tabs}>
                            <button onClick={() => setActiveTab('reports')} style={{...styles.tab, ...(activeTab === 'reports' && styles.tabActive)}}>
                                <img src="/icons/reports-tab-3d.png" alt="تقارير" style={styles.tabIcon} />
                                التقارير الطبية
                            </button>
                            <button onClick={() => setActiveTab('documents')} style={{...styles.tab, ...(activeTab === 'documents' && styles.tabActive)}}>
                                <img src="/icons/documents-tab-3d.png" alt="وثائق" style={styles.tabIcon} />
                                الوثائق المرفوعة
                            </button>
                            <button onClick={() => setActiveTab('upload')} style={{...styles.tab, ...(activeTab === 'upload' && styles.tabActive)}}>
                                <img src="/icons/upload-3d.png" alt="رفع" style={styles.tabIcon} />
                                رفع مستند
                            </button>
                        </div>

                        <div style={styles.tabContent}>
                            {activeTab === 'reports' && (
                                <>
                                    {reports.length === 0 ? <div>لا توجد تقارير طبية</div> : reports.map(report => (
                                        <div key={report.id} style={styles.card}>
                                            <div><strong>{report.title}</strong></div>
                                            <div>{report.content}</div>
                                            <div>{formatDate(report.created_at)}</div>
                                            {report.file_url && <a href={`http://localhost:5000${report.file_url}`} target="_blank" rel="noopener noreferrer">📎 عرض المرفق</a>}
                                        </div>
                                    ))}
                                </>
                            )}

                            {activeTab === 'documents' && (
                                <>
                                    {documents.length === 0 ? <div>لا توجد وثائق مرفوعة</div> : documents.map(doc => (
                                        <div key={doc.id} style={styles.card}>
                                            <div><strong>{doc.title}</strong></div>
                                            {doc.content && <div>{doc.content}</div>}
                                            {doc.file_url && <a href={`http://localhost:5000${doc.file_url}`} target="_blank" rel="noopener noreferrer">📂 فتح الملف</a>}
                                            <div>{formatDate(doc.created_at)}</div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {activeTab === 'upload' && (
                                <form onSubmit={handleFileUpload} style={styles.form}>
                                    <div style={styles.inputGroup}>
                                        <label>اختر ملف (صورة أو PDF)</label>
                                        <input type="file" onChange={(e) => setNewFile(e.target.files[0])} accept="image/*,application/pdf" />
                                    </div>
                                    <button type="submit" disabled={uploading} style={styles.submitButton}>
                                        <img src="/icons/upload-3d.png" alt="رفع" style={styles.buttonIcon} />
                                        {uploading ? 'جاري الرفع...' : 'رفع الملف'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5', direction: 'rtl' },
    sidebar: { width: '280px', backgroundColor: '#1a1a2e', color: 'white', padding: '20px 0', display: 'flex', flexDirection: 'column' },
    logo: { padding: '20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' },
    logoHealth: { fontSize: '28px', marginBottom: '5px' },
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
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', transition: 'backgroundColor 0.3s' },
    navIconImg: { width: '24px', height: '24px', marginLeft: '8px' },
    logoutButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', marginTop: '20px', transition: 'backgroundColor 0.3s' },
    mainContent: { flex: 1, padding: '30px' },
    header: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
    headerIcon: { width: '32px', height: '32px' },
    backButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' },
    backIcon: { width: '18px', height: '18px' },
    doctorsList: { display: 'flex', flexDirection: 'column', gap: '15px' },
    doctorCard: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'transform 0.2s' },
    doctorIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    doctorIconImg: { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' },
    doctorInfo: { flex: 1 },
    doctorName: { fontSize: '18px', fontWeight: 'bold' },
    doctorSpecialty: { fontSize: '14px', color: '#666' },
    arrow: { display: 'flex', alignItems: 'center' },
    arrowImg: { width: '24px', height: '24px' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px', flexWrap: 'wrap' },
    tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    tabActive: { backgroundColor: '#1976d2', color: 'white' },
    tabIcon: { width: '20px', height: '20px' },
    tabContent: { backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    card: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #eee' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    submitButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' },
    buttonIcon: { width: '20px', height: '20px' },
    successMessage: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '5px', marginBottom: '15px' },
    errorMessage: { backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '15px' },
    empty: { textAlign: 'center', padding: '40px', color: '#999' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
};

export default MedicalRecords;