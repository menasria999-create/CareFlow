import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Prescriptions = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/patients/prescriptions');
            setPrescriptions(response.data || []);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleViewPrescription = (prescription) => {
        setSelectedPrescription(prescription);
        setShowModal(true);
    };

    const handlePrint = () => {
        const printContent = document.getElementById('prescription-content');
        if (printContent) {
            const originalTitle = document.title;
            document.title = 'وصفة طبية';
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(`
                <html>
                <head>
                    <title>وصفة طبية</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; padding: 20px; margin: 0; }
                        @media print { body { margin: 0; padding: 0; } }
                    </style>
                </head>
                <body>${printContent.innerHTML}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
            document.title = originalTitle;
        }
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
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loader}>جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}>
                    <h2></h2>
                </div>
                <div style={styles.userInfo}>
                    <div style={styles.userAvatar}>
                        <img src="/icons/patient-avatar-3d.png" alt="صورة المريض" style={styles.avatarImg} />
                    </div>
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
                    <div style={styles.headerTop}>
                        <h1>الوصفات الطبية</h1>
                    </div>
                    <p>جميع الوصفات الطبية الموصوفة لك من قبل الأطباء</p>
                </div>

                {prescriptions.length === 0 ? (
                    <div style={styles.emptyState}>
                        <img src="/icons/prescriptions-3d.png" alt="وصفات" style={styles.emptyIconImg} />
                        <h3>لا توجد وصفات طبية</h3>
                        <p>سيظهر هنا الوصفات الطبية التي يصفها الأطباء لك</p>
                    </div>
                ) : (
                    <div style={styles.prescriptionsList}>
                        {prescriptions.map((prescription) => {
                            const firstItem = prescription.items && prescription.items.length > 0 ? prescription.items[0] : null;
                            return (
                                <div key={prescription.id} style={styles.prescriptionCard}>
                                    <div style={styles.prescriptionHeader}>
                                        <div style={styles.prescriptionTitle}>
                                            <img src="/icons/prescriptions-3d.png" alt="وصفة" style={styles.prescriptionIconImg} />
                                            {firstItem ? firstItem.medication_name : 'وصفة طبية'}
                                        </div>
                                        <div style={styles.prescriptionDate}>
                                            {formatDate(prescription.created_at)}
                                        </div>
                                    </div>
                                    <div style={styles.prescriptionInfo}>
                                        <div style={styles.prescriptionDoctor}>
                                            👨‍⚕️ د. {prescription.doctor_name} - {prescription.specialization}
                                        </div>
                                        {firstItem && (
                                            <div style={styles.prescriptionDetails}>
                                                <span>💊 الجرعة: {firstItem.dosage}</span>
                                                <span>⏰ التكرار: {firstItem.frequency}</span>
                                                {firstItem.duration_days && (
                                                    <span>📅 المدة: {firstItem.duration_days} يوم</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleViewPrescription(prescription)}
                                        style={styles.viewButton}
                                    >
                                        <img src="/icons/view-3d.png" alt="عرض" style={styles.buttonIcon} />
                                        عرض الوصفة
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showModal && selectedPrescription && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h2>تفاصيل الوصفة الطبية</h2>
                            <button onClick={() => setShowModal(false)} style={styles.closeButton}>✕</button>
                        </div>
                        <div id="prescription-content" style={styles.prescriptionPaper}>
                            <div style={styles.prescriptionHeaderPrint}>
                                <div style={styles.clinicInfo}>
                                    <h2 style={styles.clinicName}>عيادة الشفاء الطبية</h2>
                                    <p>حي البشير الابراهيمي - الحجيرة - تقرت</p>
                                    <p>هاتف: 0555123456 | البريد: clinic@gmail.com</p>
                                </div>
                                <div style={styles.prescriptionTitlePrint}>
                                    <h3>وصفة طبية</h3>
                                </div>
                            </div>

                            <div style={styles.prescriptionMetaPrint}>
                                <div style={styles.metaRow}>
                                    <span><strong>التاريخ:</strong> {formatDate(selectedPrescription.created_at)}</span>
                                    <span><strong>رقم الوصفة:</strong> {selectedPrescription.id.slice(0, 8)}</span>
                                </div>
                                <div style={styles.metaRow}>
                                    <span><strong>المريض:</strong> {user?.full_name}</span>
                                    <span><strong>العمر:</strong> {user?.age || '---'}</span>
                                </div>
                                <div style={styles.metaRow}>
                                    <span><strong>الطبيب المعالج:</strong> د. {selectedPrescription.doctor_name}</span>
                                    <span><strong>التخصص:</strong> {selectedPrescription.specialization}</span>
                                </div>
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
                                    {selectedPrescription.items && selectedPrescription.items.length > 0 ? (
                                        selectedPrescription.items.map((item, idx) => (
                                            <tr key={idx} style={styles.tableRow}>
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
                                    <div style={styles.signatureLine}>د. {selectedPrescription.doctor_name}</div>
                                </div>
                                <div style={styles.stampBlock}>
                                    <div>ختم العيادة</div>
                                    <div style={styles.stamp}>● ختم ●</div>
                                </div>
                            </div>
                            <div style={styles.footerNote}>
                                <p></p>
                            </div>
                        </div>
                        <div style={styles.modalFooter}>
                            <button onClick={handlePrint} style={styles.printButton}>🖨️ طباعة الوصفة</button>
                            <button onClick={() => setShowModal(false)} style={styles.closeModalButton}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
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
    logo: { padding: '20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' },
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
        transition: 'background-color 0.3s',
    },
    navIconImg: { width: '24px', height: '24px', marginLeft: '8px' },
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
        transition: 'background-color 0.3s',
    },
    mainContent: { flex: 1, padding: '30px' },
    header: { marginBottom: '30px' },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    prescriptionsList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    prescriptionCard: {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    prescriptionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        paddingBottom: '10px',
        borderBottom: '1px solid #eee',
    },
    prescriptionTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    prescriptionIconImg: { width: '24px', height: '24px' },
    prescriptionDate: { fontSize: '14px', color: '#666' },
    prescriptionInfo: { marginBottom: '15px' },
    prescriptionDoctor: { fontSize: '14px', color: '#1976d2', marginBottom: '10px' },
    prescriptionDetails: { display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '14px', color: '#555' },
    viewButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
    },
    buttonIcon: { width: '18px', height: '18px' },
    emptyState: { textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '10px' },
    emptyIconImg: { width: '80px', height: '80px', marginBottom: '20px' },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: { backgroundColor: 'white', borderRadius: '10px', width: '800px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #eee' },
    closeButton: { backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' },

    prescriptionPaper: {
        padding: '30px',
        fontFamily: "'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif",
        backgroundColor: 'white',
        direction: 'rtl',
    },
    prescriptionHeaderPrint: {
        textAlign: 'center',
        borderBottom: '2px solid #1976d2',
        paddingBottom: '15px',
        marginBottom: '20px',
    },
    clinicInfo: { marginBottom: '10px' },
    clinicName: { color: '#1976d2', margin: 0, fontSize: '24px' },
    prescriptionTitlePrint: { borderTop: '1px dashed #ccc', paddingTop: '10px' },
    prescriptionMetaPrint: {
        backgroundColor: '#f9f9f9',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
    },
    metaRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
    medicationsTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '30px' },
    tableHeader: {
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '10px',
        textAlign: 'center',
        fontWeight: 'bold',
        border: '1px solid #ddd',
    },
    tableRow: { borderBottom: '1px solid #eee' },
    tableCell: { padding: '10px', textAlign: 'center', border: '1px solid #ddd', fontSize: '14px' },
    signatureSectionPrint: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '30px',
        paddingTop: '20px',
        borderTop: '1px solid #ccc',
    },
    signatureBlock: { textAlign: 'center', width: '45%' },
    signatureLine: {
        marginTop: '10px',
        fontFamily: 'cursive',
        fontSize: '16px',
        borderTop: '1px solid #000',
        paddingTop: '5px',
        display: 'inline-block',
        width: '80%',
    },
    stampBlock: { textAlign: 'center', width: '45%' },
    stamp: {
        marginTop: '10px',
        fontSize: '16px',
        fontFamily: 'monospace',
        border: '1px dashed #999',
        padding: '5px',
        borderRadius: '5px',
        display: 'inline-block',
        width: '80%',
    },
    footerNote: { textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#777' },
    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        padding: '20px',
        borderTop: '1px solid #eee',
    },
    printButton: { padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    closeModalButton: { padding: '10px 20px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
    loader: { fontSize: '18px', color: '#1976d2' },
};

export default Prescriptions;