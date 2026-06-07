import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PatientDetails = () => {
    const { id } = useParams();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [appointmentId, setAppointmentId] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [prescriptionItems, setPrescriptionItems] = useState([
        { medication_name: '', dosage: '', frequency: '', duration_days: '', instructions: '' }
    ]);
    const [report, setReport] = useState({ title: '', content: '' });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('prescription');
    const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);
    const [savedPrescriptions, setSavedPrescriptions] = useState([]);
    const [selectedPrescriptionForPreview, setSelectedPrescriptionForPreview] = useState(null);
    const [expandedReports, setExpandedReports] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successModalText, setSuccessModalText] = useState('');

    const doctorReports = documents.filter(doc => doc.source === 'doctor' && doc.report_type === 'report');
    const patientDocuments = documents.filter(doc => doc.source === 'patient');

    useEffect(() => {
        fetchPatientDetails();
        fetchDoctorInfo();
    }, []);

    useEffect(() => {
        if (patient && patient.appointment_status === 'completed') {
            fetchSavedPrescriptions();
            fetchDocuments();
        }
    }, [patient]);

    const fetchPatientDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/doctors/patients/${id}/details`);
            setPatient(response.data);
            setAppointmentId(response.data.appointment_id);
        } catch (error) {
            console.error('Error fetching patient:', error);
            setMessage({ text: '❌ حدث خطأ في تحميل بيانات المريض', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctorInfo = async () => {
        try {
            const response = await api.get('/doctors/profile');
            setDoctor(response.data);
        } catch (error) {
            console.error('Error fetching doctor:', error);
        }
    };

    const fetchSavedPrescriptions = async () => {
        if (!patient) return;
        try {
            const response = await api.get(`/doctors/patients/${patient.patient_id}/prescriptions`);
            setSavedPrescriptions(response.data || []);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        }
    };

    const fetchDocuments = async () => {
        if (!patient) return;
        try {
            const response = await api.get(`/doctors/patients/${patient.patient_id}/documents`);
            setDocuments(response.data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const addPrescriptionItem = () => {
        setPrescriptionItems([...prescriptionItems, { medication_name: '', dosage: '', frequency: '', duration_days: '', instructions: '' }]);
    };

    const removePrescriptionItem = (index) => {
        const newItems = prescriptionItems.filter((_, i) => i !== index);
        setPrescriptionItems(newItems);
    };

    const updatePrescriptionItem = (index, field, value) => {
        const newItems = [...prescriptionItems];
        if (field === 'duration_days') {
            if (value === '') {
                newItems[index][field] = '';
                setPrescriptionItems(newItems);
                return;
            }
            const cleaned = value.toString().replace(/[^0-9]/g, '');
            if (cleaned === '') {
                newItems[index][field] = '';
            } else {
                let num = parseInt(cleaned, 10);
                if (num < 1) num = 1;
                newItems[index][field] = num;
            }
        } else {
            newItems[index][field] = value;
        }
        setPrescriptionItems(newItems);
    };

    const handleAddPrescription = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        const validItems = prescriptionItems.filter(item => item.medication_name && item.dosage && item.frequency);
        if (validItems.length === 0) {
            setMessage({ text: '⚠️ يرجى إضافة دواء واحد على الأقل', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            return;
        }
        for (const item of prescriptionItems) {
            if (item.duration_days !== undefined && item.duration_days !== '') {
                const duration = parseInt(item.duration_days, 10);
                if (isNaN(duration) || duration < 1) {
                    setMessage({ text: '⚠️ المدة بالأيام يجب أن تكون رقماً موجباً (1 فأكثر)', type: 'error' });
                    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
                    return;
                }
            }
        }
        try {
            const response = await api.post('/doctors/prescriptions', {
                patient_id: patient.patient_id,
                items: prescriptionItems
            });
            if (response.data.success) {
                setSuccessModalText('✅ تم حفظ الوصفة الطبية بنجاح!');
                setShowSuccessModal(true);
                setPrescriptionItems([{ medication_name: '', dosage: '', frequency: '', duration_days: '', instructions: '' }]);
                fetchSavedPrescriptions();
                setTimeout(() => setShowSuccessModal(false), 2500);
            }
        } catch (error) {
            setMessage({ text: error.response?.data?.message || '❌ حدث خطأ في حفظ الوصفة', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    const handleAddReport = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/doctors/reports', {
                patient_id: patient.patient_id,
                title: report.title,
                content: report.content
            });
            if (response.data.success) {
                setSuccessModalText('✅ تم حفظ التقرير الطبي بنجاح!');
                setShowSuccessModal(true);
                setReport({ title: '', content: '' });
                await fetchDocuments();
                setTimeout(() => setShowSuccessModal(false), 2500);
            }
        } catch (error) {
            setMessage({ text: '❌ حدث خطأ في حفظ التقرير', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    const handleMarkAsExamined = async () => {
        if (!appointmentId) {
            setMessage({ text: '⚠️ لا يوجد موعد نشط لهذا المريض', type: 'error' });
            return;
        }
        try {
            const response = await api.put(`/doctors/appointments/${appointmentId}/complete`);
            if (response.data.success) {
                setMessage({ text: '✅ تم الفحص بنجاح. جاري التوجيه...', type: 'success' });
                setTimeout(() => navigate('/doctor/patients'), 1500);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            setMessage({ text: '❌ حدث خطأ', type: 'error' });
        }
    };

    const handleDischargePatient = async () => {
        if (!patient) return;
        if (window.confirm('هل أنت متأكد من إخراج هذا المريض من النظام؟')) {
            try {
                const response = await api.put(`/doctors/patients/${patient.patient_id}/discharge`);
                if (response.data.success) {
                    setMessage({ text: '✅ تم إخراج المريض من النظام', type: 'success' });
                    setTimeout(() => navigate('/doctor/patients'), 2000);
                }
            } catch (error) {
                setMessage({ text: '❌ حدث خطأ', type: 'error' });
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return '';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const handlePrint = () => {
        const printContent = document.getElementById('prescription-content-unique');
        if (printContent) {
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(`
                <html>
                <head>
                    <title>وصفة طبية</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; padding: 20px; margin: 0; }
                        @media print { body { margin: 0; padding: 0; } }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                        th { background-color: #1976d2; color: white; }
                        .clinic-name { font-size: 24px; font-weight: bold; color: #1976d2; text-align: center; }
                        .signature-line { margin-top: 40px; text-align: center; border-top: 1px solid #000; width: 200px; margin-left: auto; margin-right: auto; padding-top: 5px; }
                    </style>
                </head>
                <body>${printContent.innerHTML}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
        }
    };

    const menuItems = [
        { name: 'الرئيسية', path: '/doctor', icon: '/icons/home-3d.png' },
        { name: 'ملفي الشخصي', path: '/doctor/profile', icon: '/icons/profile-3d.png' },
        { name: 'سجلات المرضى', path: '/doctor/patients', icon: '/icons/records-3d.png' },
        { name: 'الاستشارات', path: '/doctor/consultations', icon: '/icons/consultations-3d.png' },
    ];

    if (loading) return <div style={styles.loadingContainer}><div style={styles.loader}>جاري التحميل...</div></div>;
    if (!patient) return <div style={styles.errorState}>المريض غير موجود</div>;

    const isCompleted = patient.appointment_status === 'completed';

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}><div style={styles.logoHealth}></div></div>
                <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>
                        <img src="/icons/doctor-avatar-3d.png" alt="صورة الطبيب" style={styles.avatarImg} />
                    </div>
                    <div style={styles.userName}>{user?.full_name}</div>
                    <div style={styles.userRole}>طبيب(ة)</div>
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
                    <h1>ملف المريض</h1>
                    <p>عرض وتحديث بيانات المريض</p>
                </div>

                {message.text && (
                    <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {message.text}
                    </div>
                )}

                <div style={styles.patientInfo}>
                    <h2>معلومات المريض</h2>
                    <div style={styles.infoGrid}>
                        <div><strong>الاسم:</strong> {patient.full_name}</div>
                        <div><strong>العمر:</strong> {calculateAge(patient.date_of_birth)} سنة</div>
                        <div><strong>البريد الإلكتروني:</strong> {patient.email}</div>
                        <div><strong>الهاتف:</strong> {patient.phone || 'غير متوفر'}</div>
                        <div><strong>تاريخ الميلاد:</strong> {formatDate(patient.date_of_birth)}</div>
                        <div><strong>فصيلة الدم:</strong> {patient.blood_type || 'غير متوفر'}</div>
                        {patient.allergies && <div><strong>الحساسية:</strong> {patient.allergies}</div>}
                        <div><strong>حالة الموعد:</strong>
                            <span style={{
                                ...styles.statusBadge,
                                backgroundColor: isCompleted ? '#4caf50' : '#ff9800'
                            }}>
                                {isCompleted ? 'تم الفحص' : 'قيد الانتظار'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={styles.actionButtons}>
                    {!isCompleted && (
                        <button onClick={handleMarkAsExamined} style={styles.examinedButton}>
                            <img src="/icons/examined-check-3d.png" alt="تم الفحص" style={styles.buttonIcon} />
                            تم الفحص
                        </button>
                    )}
                    {isCompleted && (
                        <button onClick={handleDischargePatient} style={styles.dischargeButton}>
                            <img src="/icons/discharge-3d.png" alt="إخراج المريض" style={styles.buttonIcon} />
                            إخراج المريض
                        </button>
                    )}
                </div>

                {isCompleted ? (
                    <>
                        <div style={styles.tabs}>
                            <button onClick={() => setActiveTab('prescription')} style={{...styles.tab, ...(activeTab === 'prescription' && styles.tabActive)}}>
                                <img src="/icons/prescription-tab-3d.png" alt="وصفة طبية" style={styles.tabIcon} />
                                وصفة طبية
                            </button>
                            <button onClick={() => setActiveTab('report')} style={{...styles.tab, ...(activeTab === 'report' && styles.tabActive)}}>
                                <img src="/icons/report-tab-3d.png" alt="تقرير طبي" style={styles.tabIcon} />
                                تقرير طبي جديد
                            </button>
                            <button onClick={() => setActiveTab('documents')} style={{...styles.tab, ...(activeTab === 'documents' && styles.tabActive)}}>
                                <img src="/icons/documents-tab-3d.png" alt="وثائق" style={styles.tabIcon} />
                                وثائق المريض
                            </button>
                            <button onClick={() => setActiveTab('saved')} style={{...styles.tab, ...(activeTab === 'saved' && styles.tabActive)}}>
                                <img src="/icons/prescriptions-saved-3d.png" alt="وصفات سابقة" style={styles.tabIcon} />
                                الوصفات السابقة
                            </button>
                            <button onClick={() => setActiveTab('reports')} style={{...styles.tab, ...(activeTab === 'reports' && styles.tabActive)}}>
                                <img src="/icons/reports-saved-3d.png" alt="تقارير سابقة" style={styles.tabIcon} />
                                التقارير السابقة
                            </button>
                        </div>
                        <div style={styles.tabContent}>
                            {activeTab === 'prescription' && (
                                <form onSubmit={handleAddPrescription}>
                                    <div style={styles.prescriptionHeader}><h3>عيادة الشفاء الطبية</h3><p>استشارات قلبية - أطفال - جلدية</p></div>
                                    {prescriptionItems.map((item, index) => (
                                        <div key={index} style={styles.prescriptionItem}>
                                            <div style={styles.itemHeader}><h4>الدواء {index+1}</h4>{index > 0 && <button type="button" onClick={() => removePrescriptionItem(index)} style={styles.removeButton}>حذف</button>}</div>
                                            <div style={styles.row}>
                                                <div style={styles.halfInput}><label>اسم الدواء *</label><input type="text" value={item.medication_name} onChange={(e) => updatePrescriptionItem(index, 'medication_name', e.target.value)} required /></div>
                                                <div style={styles.halfInput}><label>الجرعة *</label><input type="text" value={item.dosage} onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)} required /></div>
                                            </div>
                                            <div style={styles.row}>
                                                <div style={styles.halfInput}><label>التكرار *</label><input type="text" value={item.frequency} onChange={(e) => updatePrescriptionItem(index, 'frequency', e.target.value)} required /></div>
                                                <div style={styles.halfInput}>
                                                    <label>المدة (أيام)</label>
                                                    <input type="text" inputMode="numeric" value={item.duration_days} onChange={(e) => updatePrescriptionItem(index, 'duration_days', e.target.value)} style={styles.input} placeholder="مثال: 7" />
                                                    <small style={styles.hintText}>أدخل عدداً صحيحاً موجباً (1 أو أكثر)</small>
                                                </div>
                                            </div>
                                            <div style={styles.inputGroup}><label>تعليمات خاصة</label><textarea value={item.instructions} onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)} rows="2" /></div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addPrescriptionItem} style={styles.addButton}>+ إضافة دواء آخر</button>
                                    <button type="submit" style={styles.submitButton}>💾 حفظ الوصفة</button>
                                </form>
                            )}
                            {activeTab === 'report' && (
                                <form onSubmit={handleAddReport}>
                                    <div style={styles.inputGroup}><label>عنوان التقرير *</label><input type="text" value={report.title} onChange={(e) => setReport({...report, title: e.target.value})} required /></div>
                                    <div style={styles.inputGroup}><label>محتوى التقرير *</label><textarea value={report.content} onChange={(e) => setReport({...report, content: e.target.value})} rows="6" required /></div>
                                    <button type="submit" style={styles.submitButton}>💾 حفظ التقرير</button>
                                </form>
                            )}
                            {activeTab === 'documents' && (
                                <div style={styles.documentsList}>
                                    {patientDocuments.length === 0 ? <div style={styles.emptyDocs}>لا توجد وثائق مرفوعة من المريض</div> :
                                        patientDocuments.map(doc => (
                                            <div key={doc.id} style={styles.documentCard}>
                                                <div style={styles.documentHeader}><div style={styles.documentTitle}>{doc.title}</div><div>{formatDate(doc.created_at)}</div></div>
                                                {doc.content && <div>{doc.content.length > 200 ? `${doc.content.substring(0,200)}...` : doc.content}</div>}
                                                {doc.file_url && <a href={`http://localhost:5000${doc.file_url}`} target="_blank" style={styles.downloadButton}>📎 عرض الملف</a>}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                            {activeTab === 'saved' && (
                                <div style={styles.savedPrescriptions}>
                                    {savedPrescriptions.length === 0 ? <div>لا توجد وصفات سابقة</div> :
                                        savedPrescriptions.map(p => (
                                            <div key={p.id} style={styles.savedPrescriptionCard}>
                                                <div><strong>التاريخ:</strong> {formatDate(p.created_at)}</div>
                                                <div>{p.items?.map(item => <div key={item.medication_name}>💊 {item.medication_name} - {item.dosage} ({item.frequency})</div>)}</div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                            {activeTab === 'reports' && (
                                <div style={styles.savedReports}>
                                    {doctorReports.length === 0 ? <div>لا توجد تقارير سابقة</div> :
                                        doctorReports.map(r => (
                                            <div key={r.id} style={styles.savedReportCard}>
                                                <div><strong>{r.title}</strong></div>
                                                <div>{r.content.substring(0,200)}...</div>
                                                <div>{formatDate(r.created_at)}</div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={styles.notExaminedMessage}>
                        ⚠️ ملاحظة : عند الضغظ على زر تم الفحص سيتم توجيه المريض تلقائيا الى قائمة المرضى الذين تم فحصهم لتلقى العلاج المناسب .
                    </div>
                )}
            </div>

            {showPrescriptionPreview && doctor && selectedPrescriptionForPreview && (
                <div style={styles.modalOverlay}>
                    <div style={styles.prescriptionModal}>
                        <div style={styles.modalHeader}>
                            <h2>تفاصيل الوصفة الطبية</h2>
                            <button onClick={() => setShowPrescriptionPreview(false)} style={styles.closeButton}>✕</button>
                        </div>
                        <div id="prescription-content-unique" style={styles.prescriptionPaper}>
                            <div style={styles.prescriptionHeaderPrint}>
                                <div style={styles.clinicInfo}>
                                    <h2 style={styles.clinicName}>عيادة الشفاء الطبية</h2>
                                    <p>حي البشير الابراهيمي - الحجيرة - تقرت</p>
                                    <p>هاتف: 0555123456 | البريد: clinic@careflow.com</p>
                                </div>
                                <div style={styles.prescriptionTitlePrint}><h3>وصفة طبية</h3></div>
                            </div>
                            <div style={styles.prescriptionMetaPrint}>
                                <div style={styles.metaRow}><span><strong>التاريخ:</strong> {formatDate(selectedPrescriptionForPreview.created_at)}</span><span><strong>رقم الوصفة:</strong> {selectedPrescriptionForPreview.id.slice(0,8)}</span></div>
                                <div style={styles.metaRow}><span><strong>المريض:</strong> {patient.full_name}</span><span><strong>العمر:</strong> {calculateAge(patient.date_of_birth)} سنة</span></div>
                                <div style={styles.metaRow}><span><strong>الطبيب المعالج:</strong> د. {doctor.full_name}</span><span><strong>التخصص:</strong> {doctor.specialization}</span></div>
                            </div>
                            <table style={styles.medicationsTable}>
                                <thead>
                                    <tr>
                                        <th style={styles.tableHeader}>الدواء</th>
                                        <th style={styles.tableHeader}>الجرعة</th>
                                        <th style={styles.tableHeader}>التكرار</th>
                                        <th style={styles.tableHeader}>المدة (أيام)</th>
                                        <th style={styles.tableHeader}>تعليمات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPrescriptionForPreview.items && selectedPrescriptionForPreview.items.length > 0 ? (
                                        selectedPrescriptionForPreview.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={styles.tableCell}>{item.medication_name}</td>
                                                <td style={styles.tableCell}>{item.dosage}</td>
                                                <td style={styles.tableCell}>{item.frequency}</td>
                                                <td style={styles.tableCell}>{item.duration_days || '---'}</td>
                                                <td style={styles.tableCell}>{item.instructions || '---'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={styles.tableCell}>لا توجد أدوية مسجلة</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <div style={styles.signatureSectionPrint}>
                                <div style={styles.signatureBlock}>
                                    <div>توقيع الطبيب</div>
                                    <div style={styles.signatureLineDoc}>د. {doctor.full_name}</div>
                                </div>
                                <div style={styles.stampBlock}>
                                    <div>ختم العيادة</div>
                                    <div style={styles.stamp}>● ختم ●</div>
                                </div>
                            </div>
                            <div style={styles.footerNote}><p> </p></div>
                        </div>
                        <div style={styles.modalFooter}>
                            <button onClick={handlePrint} style={styles.printButton}>🖨️ طباعة الوصفة</button>
                            <button onClick={() => setShowPrescriptionPreview(false)} style={styles.closeModalButton}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div style={styles.successModalOverlay}>
                    <div style={styles.successModal}>
                        <img src="/icons/success-3d.png" alt="نجاح" style={styles.successIconImg} />
                        <div style={styles.successModalText}>{successModalText}</div>
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
    navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', transition: 'background-color 0.3s' },
    navIconImg: { width: '24px', height: '24px', marginLeft: '8px' },
    logoutButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', textAlign: 'right', marginTop: '20px', transition: 'background-color 0.3s' },
    mainContent: { flex: 1, padding: '30px' },
    header: { marginBottom: '30px' },
    patientInfo: { backgroundColor: 'white', borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px' },
    statusBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '5px', color: 'white', fontSize: '12px', marginLeft: '8px' },
    actionButtons: { display: 'flex', gap: '15px', marginBottom: '20px' },
    examinedButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.3s' },
    dischargeButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.3s' },
    buttonIcon: { width: '20px', height: '20px', objectFit: 'contain' },
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px', flexWrap: 'wrap' },
    tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
    tabActive: { backgroundColor: '#1976d2', color: 'white' },
    tabIcon: { width: '20px', height: '20px', marginLeft: '5px' },
    tabContent: { backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' },
    row: { display: 'flex', gap: '15px', marginBottom: '15px' },
    halfInput: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
    input: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px' },
    textarea: { padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical' },
    submitButton: { padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', marginTop: '10px' },
    addButton: { padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', marginBottom: '15px' },
    removeButton: { padding: '4px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
    prescriptionHeader: { textAlign: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #1976d2' },
    prescriptionItem: { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px' },
    itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    documentsList: { minHeight: '200px' },
    documentCard: { backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '15px', marginBottom: '15px', border: '1px solid #eee' },
    documentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #eee' },
    documentTitle: { fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    downloadButton: { display: 'inline-block', padding: '6px 12px', backgroundColor: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' },
    emptyDocs: { textAlign: 'center', padding: '40px', color: '#999' },
    savedPrescriptions: { display: 'flex', flexDirection: 'column', gap: '15px' },
    savedPrescriptionCard: { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#f9f9f9' },
    savedReports: { display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' },
    savedReportCard: { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#f9f9f9' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
    loader: { fontSize: '18px', color: '#1976d2' },
    errorState: { textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '10px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    prescriptionModal: { backgroundColor: 'white', borderRadius: '10px', width: '850px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '20px' },
    prescriptionPaper: { padding: '20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: 'white', direction: 'rtl' },
    prescriptionHeaderPrint: { textAlign: 'center', borderBottom: '2px solid #1976d2', paddingBottom: '15px', marginBottom: '20px' },
    clinicInfo: { marginBottom: '10px' },
    clinicName: { color: '#1976d2', margin: 0, fontSize: '24px' },
    prescriptionTitlePrint: { borderTop: '1px dashed #ccc', paddingTop: '10px' },
    prescriptionMetaPrint: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
    metaRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
    medicationsTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '30px' },
    tableHeader: { backgroundColor: '#1976d2', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #ddd' },
    tableCell: { padding: '10px', textAlign: 'center', border: '1px solid #ddd', fontSize: '14px' },
    signatureSectionPrint: { display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ccc' },
    signatureBlock: { textAlign: 'center', width: '45%' },
    signatureLineDoc: { marginTop: '10px', fontFamily: 'cursive', fontSize: '16px', borderTop: '1px solid #000', paddingTop: '5px', display: 'inline-block', width: '80%' },
    stampBlock: { textAlign: 'center', width: '45%' },
    stamp: { marginTop: '10px', fontSize: '16px', fontFamily: 'monospace', border: '1px dashed #999', padding: '5px', borderRadius: '5px', display: 'inline-block', width: '80%' },
    footerNote: { textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#777' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px', borderTop: '1px solid #eee' },
    printButton: { padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    closeModalButton: { padding: '10px 20px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    closeButton: { backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' },
    successMessage: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '5px', marginBottom: '20px' },
    errorMessage: { backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '5px', marginBottom: '20px' },
    successModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
    successModal: { backgroundColor: '#e8f5e9', padding: '30px 50px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
    successIconImg: { width: '50px', height: '50px', marginBottom: '15px' },
    successModalText: { fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' },
    notExaminedMessage: {
        backgroundColor: '#fff3e0',
        color: '#e65100',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        marginTop: '20px',
        border: '1px solid #ffcc80',
        fontSize: '16px'
    },
    hintText: { fontSize: '12px', color: '#666', marginTop: '4px' }
};

export default PatientDetails;