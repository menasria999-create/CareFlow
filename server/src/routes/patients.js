const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // أضفنا fs لفحص وجود الملفات

// ============================================
// ✅ إضافة middleware لضبط ترميز UTF-8 لكل الردود JSON
// ============================================
router.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// ============================================
// إعداد تخزين الملفات
// ============================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('نوع الملف غير مدعوم. يرجى رفع صور أو PDF فقط'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ============================================
// جلب قائمة جميع التخصصات الطبية
// ============================================
router.get('/specialties', authenticate, async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT 
                specialization,
                COUNT(*) as doctors_count
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE u.is_active = true
            GROUP BY specialization
            ORDER BY specialization
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Get specialties error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب قائمة التخصصات لموظف الاستقبال
// ============================================
router.get('/specialties/receptionist', authenticate, authorize(['receptionist', 'admin']), async (req, res) => {
    try {
        const specialties = [
            { id: 1, name: 'العظام والمفاصل' },
            { id: 2, name: 'طب الأطفال' },
            { id: 3, name: 'الأمراض المزمنة' }
        ];
        res.json(specialties);
    } catch (error) {
        console.error('Get specialties for receptionist error:', error);
        res.json([
            { id: 1, name: 'العظام والمفاصل' },
            { id: 2, name: 'طب الأطفال' },
            { id: 3, name: 'الأمراض المزمنة' }
        ]);
    }
});

// ============================================
// جلب الأطباء حسب التخصص
// ============================================
router.get('/doctors/by-specialty/:specialty', authenticate, async (req, res) => {
    try {
        const { specialty } = req.params;
        const query = `
            SELECT 
                d.id,
                u.full_name,
                d.specialization,
                d.consultation_fee,
                d.years_experience,
                d.bio
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            WHERE d.specialization = $1 AND u.is_active = true
            ORDER BY u.full_name
        `;
        const result = await pool.query(query, [specialty]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get doctors by specialty error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب المواعيد القادمة للمريض
// ============================================
router.get('/appointments/upcoming', authenticate, authorize('patient'), async (req, res) => {
    try {
        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient record not found' });
        }
        const patientId = patientResult.rows[0].id;
        const query = `
            SELECT 
                a.id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.type,
                a.specialty,
                u.full_name as doctor_name,
                d.specialization
            FROM appointments a
            LEFT JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = $1 
                AND a.status IN ('scheduled', 'confirmed')
                AND a.appointment_date >= CURRENT_DATE
            ORDER BY a.appointment_date ASC, a.appointment_time ASC
        `;
        const result = await pool.query(query, [patientId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get upcoming appointments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// حجز موعد جديد للمريض (بواسطة المريض نفسه)
// ============================================
router.post('/appointments', authenticate, authorize('patient'), async (req, res) => {
    try {
        const { doctor_id, appointment_date, appointment_time, type, notes } = req.body;

        const doctorQuery = `SELECT specialization FROM doctors WHERE id = $1`;
        const doctorResult = await pool.query(doctorQuery, [doctor_id]);
        if (doctorResult.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        const doctorSpecialty = doctorResult.rows[0].specialization;

        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient record not found' });
        }
        const patientId = patientResult.rows[0].id;

        const checkQuery = `
            SELECT id FROM appointments 
            WHERE patient_id = $1 AND doctor_id = $2 AND appointment_date = $3 AND status != 'cancelled'
        `;
        const checkResult = await pool.query(checkQuery, [patientId, doctor_id, appointment_date]);
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ error: 'لديك بالفعل موعد مع هذا الطبيب في هذا اليوم' });
        }

        const insertQuery = `
            INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, notes, status, specialty)
            VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7)
            RETURNING *
        `;
        const result = await pool.query(insertQuery, [
            patientId, doctor_id, appointment_date, appointment_time, type, notes, doctorSpecialty
        ]);

        res.status(201).json({
            success: true,
            message: 'تم حجز الموعد بنجاح',
            appointment: result.rows[0]
        });
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب جميع مواعيد المريض النشطة فقط (غير ملغاة)
// ============================================
router.get('/my-appointments', authenticate, authorize('patient'), async (req, res) => {
    try {
        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient record not found' });
        }
        const patientId = patientResult.rows[0].id;
        const query = `
            SELECT a.id, a.specialty, a.status, a.appointment_date, a.created_at, u.full_name as created_by_name
            FROM appointments a
            LEFT JOIN users u ON a.created_by = u.id
            WHERE a.patient_id = $1 AND a.status != 'cancelled'
            ORDER BY a.created_at DESC
        `;
        const result = await pool.query(query, [patientId]);
        res.json({ success: true, appointments: result.rows });
    } catch (error) {
        console.error('خطأ في جلب مواعيد المريض:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب مواعيد مريض معين (للاستقبال والإدارة)
// ============================================
router.get('/:patientId/appointments', authenticate, authorize(['receptionist', 'admin', 'doctor']), async (req, res) => {
    try {
        const { patientId } = req.params;
        let patientRecordId = patientId;
        const checkPatient = await pool.query(`SELECT id FROM patients WHERE user_id = $1 OR id = $1`, [patientId]);
        if (checkPatient.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المريض غير موجود' });
        }
        patientRecordId = checkPatient.rows[0].id;
        const query = `
            SELECT a.id, a.specialty, a.status, a.appointment_date, a.created_at, u.full_name as created_by_name
            FROM appointments a
            LEFT JOIN users u ON a.created_by = u.id
            WHERE a.patient_id = $1
            ORDER BY a.created_at DESC
        `;
        const result = await pool.query(query, [patientRecordId]);
        res.json({ success: true, appointments: result.rows });
    } catch (error) {
        console.error('خطأ في جلب المواعيد:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
});

// ============================================
// جلب مواعيد الطبيب (لصفحة الطبيب)
// ============================================
router.get('/doctor/appointments', authenticate, async (req, res) => {
    try {
        console.log('===== جلب مواعيد الطبيب =====');
        const doctorResult = await pool.query(`SELECT d.id, d.specialization FROM doctors d WHERE d.user_id = $1`, [req.user.id]);
        if (doctorResult.rows.length === 0) return res.status(404).json({ success: false, message: 'سجل الطبيب غير موجود' });
        const doctorId = doctorResult.rows[0].id;
        const doctorSpecialty = doctorResult.rows[0].specialization;
        let query = `
            SELECT a.id, a.specialty, a.status, a.appointment_date, a.created_at,
                   u.id as patient_user_id, u.full_name as patient_name, u.email as patient_email, u.phone as patient_phone,
                   p.medical_history, p.allergies, p.date_of_birth as patient_dob, p.gender as patient_gender
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE a.status = 'scheduled'
        `;
        const params = [];
        if (doctorSpecialty) {
            query += ` AND a.specialty = $1`;
            params.push(doctorSpecialty);
        }
        query += ` ORDER BY a.created_at DESC`;
        const result = await pool.query(query, params);
        res.json({ success: true, appointments: result.rows });
    } catch (error) {
        console.error('خطأ في جلب مواعيد الطبيب:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم: ' + error.message });
    }
});

// ============================================
// جلب مواعيد المريض مع تفاصيل كاملة (للمريض)
// ============================================
router.get('/patient/appointments/details', authenticate, authorize('patient'), async (req, res) => {
    try {
        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Patient record not found' });
        const patientId = patientResult.rows[0].id;
        const query = `
            SELECT a.id, a.specialty, a.status, a.appointment_date, a.created_at,
                   u.full_name as created_by_name, doc.full_name as doctor_name, d.specialization as doctor_specialty
            FROM appointments a
            LEFT JOIN users u ON a.created_by = u.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN users doc ON d.user_id = doc.id
            WHERE a.patient_id = $1
            ORDER BY a.created_at DESC
        `;
        const result = await pool.query(query, [patientId]);
        res.json({ success: true, appointments: result.rows });
    } catch (error) {
        console.error('خطأ في جلب تفاصيل مواعيد المريض:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
});

// ============================================
// إلغاء موعد
// ============================================
router.put('/appointments/:id/cancel', authenticate, authorize('patient'), async (req, res) => {
    try {
        const { id } = req.params;
        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) return res.status(404).json({ error: 'Patient record not found' });
        const patientId = patientResult.rows[0].id;
        const checkResult = await pool.query(`SELECT id FROM appointments WHERE id = $1 AND patient_id = $2 AND status != 'cancelled'`, [id, patientId]);
        if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Appointment not found or already cancelled' });
        const result = await pool.query(`UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING id, status`, [id]);
        res.json({ success: true, message: 'تم إلغاء الموعد بنجاح', appointment: result.rows[0] });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب الوصفات الطبية للمريض مع تفاصيل الأدوية
// ============================================
router.get('/prescriptions', authenticate, authorize('patient'), async (req, res) => {
    try {
        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) return res.status(404).json({ error: 'Patient record not found' });
        const patientId = patientResult.rows[0].id;
        const query = `
            SELECT p.id, p.created_at, u.full_name as doctor_name, d.specialization,
                   json_agg(json_build_object(
                       'medication_name', pi.medication_name,
                       'dosage', pi.dosage,
                       'frequency', pi.frequency,
                       'duration_days', pi.duration_days,
                       'instructions', pi.instructions
                   )) as items
            FROM prescriptions p
            JOIN doctors d ON p.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
            WHERE p.patient_id = $1
            GROUP BY p.id, p.created_at, u.full_name, d.specialization
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(query, [patientId]);
        const prescriptions = result.rows.map(row => {
            if (row.items && row.items.length > 0 && row.items[0].medication_name !== null) {
                return { ...row, all_items: row.items };
            }
            return row;
        });
        res.json(prescriptions);
    } catch (error) {
        console.error('Get prescriptions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// إضافة مستند طبي من قبل المريض (معدل)
// ============================================
router.post('/reports', authenticate, authorize('patient'), upload.single('file'), async (req, res) => {
    try {
        const { title, content, report_type } = req.body;
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient record not found' });
        }
        const patientId = patientResult.rows[0].id;
        
        // استخدام COALESCE لتجنب NULL في عمود content
        const result = await pool.query(
            `INSERT INTO medical_reports (patient_id, doctor_id, title, content, file_url, report_type)
             VALUES ($1, NULL, $2, COALESCE($3, ''), $4, $5) RETURNING *`,
            [patientId, title, content || '', fileUrl, report_type || 'image']
        );
        res.status(201).json({ 
            success: true, 
            message: 'تم إضافة المستند الطبي بنجاح', 
            report: result.rows[0] 
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// عرض الملف المرفوع
// ============================================
router.get('/file/:filename', authenticate, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../../uploads', filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'الملف غير موجود' });
        }
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.pdf') contentType = 'application/pdf';
        res.setHeader('Content-Type', contentType);
        res.sendFile(filePath);
    } catch (error) {
        console.error('File error:', error);
        res.status(500).json({ error: 'خطأ في عرض الملف' });
    }
});

// ============================================
// جلب جميع التقارير الطبية للمريض
// ============================================
router.get('/reports', authenticate, authorize('patient'), async (req, res) => {
    try {
        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) return res.status(404).json({ error: 'Patient record not found' });
        const patientId = patientResult.rows[0].id;
        const query = `
            SELECT mr.id, mr.title, mr.content, mr.file_url, mr.report_type, mr.report_date, mr.created_at,
                   u.full_name as doctor_name, d.specialization
            FROM medical_reports mr
            LEFT JOIN doctors d ON mr.doctor_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE mr.patient_id = $1
            ORDER BY mr.report_date DESC, mr.created_at DESC
        `;
        const result = await pool.query(query, [patientId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب عدد تقارير الأطباء للمريض
// ============================================
router.get('/reports/count', authenticate, authorize('patient'), async (req, res) => {
    try {
        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) return res.status(404).json({ error: 'Patient record not found' });
        const patientId = patientResult.rows[0].id;
        const result = await pool.query(`SELECT COUNT(*) as count FROM medical_reports WHERE patient_id = $1 AND doctor_id IS NOT NULL`, [patientId]);
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Get reports count error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب تقرير واحد بالمعرف
// ============================================
router.get('/reports/:id', authenticate, authorize('patient'), async (req, res) => {
    try {
        const { id } = req.params;
        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) return res.status(404).json({ error: 'Patient record not found' });
        const patientId = patientResult.rows[0].id;
        const query = `
            SELECT mr.id, mr.title, mr.content, mr.file_url, mr.report_type, mr.report_date, mr.created_at,
                   u.full_name as doctor_name, d.specialization, pat.full_name as patient_name
            FROM medical_reports mr
            LEFT JOIN doctors d ON mr.doctor_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            JOIN patients p ON mr.patient_id = p.id
            JOIN users pat ON p.user_id = pat.id
            WHERE mr.id = $1 AND mr.patient_id = $2
        `;
        const result = await pool.query(query, [id, patientId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب بيانات المريض الشخصية
// ============================================
router.get('/profile', authenticate, authorize('patient'), async (req, res) => {
    try {
        const query = `
            SELECT u.id as user_id, u.full_name, u.email, u.phone, u.profile_image,
                   p.id as patient_id, p.date_of_birth, p.gender, p.blood_type, p.national_id,
                   p.emergency_contact, p.emergency_phone, p.address, p.medical_history, p.allergies
            FROM users u
            JOIN patients p ON u.id = p.user_id
            WHERE u.id = $1 AND u.is_active = true
        `;
        const result = await pool.query(query, [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// تحديث بيانات المريض الشخصية (مع دعم تاريخ الميلاد)
// ============================================
router.put('/profile', authenticate, authorize('patient'), async (req, res) => {
    try {
        const { full_name, phone, address, blood_type, allergies, medical_history, emergency_contact, emergency_phone, date_of_birth } = req.body;
        await pool.query(`UPDATE users SET full_name = $1, phone = $2, updated_at = NOW() WHERE id = $3`, [full_name, phone, req.user.id]);
        await pool.query(`
            UPDATE patients 
            SET address = $1, blood_type = $2, allergies = $3, medical_history = $4, 
                emergency_contact = $5, emergency_phone = $6, date_of_birth = $7, updated_at = NOW()
            WHERE user_id = $8
        `, [address, blood_type, allergies, medical_history, emergency_contact, emergency_phone, date_of_birth, req.user.id]);
        res.json({ success: true, message: 'تم تحديث الملف الشخصي بنجاح' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// تغيير كلمة المرور
// ============================================
router.put('/change-password', authenticate, authorize('patient'), async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const bcrypt = require('bcryptjs');
        const userResult = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [req.user.id]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const isValid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
        if (!isValid) return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashedPassword, req.user.id]);
        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب معلومات الطبيب المعالج للمريض
// ============================================
router.get('/my-doctor', authenticate, authorize('patient'), async (req, res) => {
    try {
        const patientQuery = `SELECT id FROM patients WHERE user_id = $1`;
        const patientResult = await pool.query(patientQuery, [req.user.id]);
        if (patientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient record not found' });
        }
        const patientId = patientResult.rows[0].id;
        const query = `
            SELECT u.id as user_id, u.full_name, u.email, u.phone, d.specialization, d.clinic_address, d.consultation_fee
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = $1 AND a.status = 'completed'
            ORDER BY a.appointment_date DESC
            LIMIT 1
        `;
        const result = await pool.query(query, [patientId]);
        if (result.rows.length === 0) {
            return res.json({ full_name: 'غير متوفر', email: 'غير متوفر', phone: 'غير متوفر', specialization: 'غير متوفر', clinic_address: 'حي البشير لابراهيمي بالحجيرة -تقرت-' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get my doctor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب الأطباء الذين فحصوا المريض (للسجل الطبي)
// ============================================
router.get('/my-doctors', authenticate, authorize('patient'), async (req, res) => {
    try {
        const patientRes = await pool.query(`SELECT id FROM patients WHERE user_id = $1`, [req.user.id]);
        if (patientRes.rows.length === 0) {
            return res.json([]);
        }
        const patientId = patientRes.rows[0].id;
        const query = `
            SELECT DISTINCT d.id as doctor_id, u.full_name as doctor_name, d.specialization
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = $1 AND a.status = 'completed'
        `;
        const result = await pool.query(query, [patientId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error in /my-doctors:', error);
        res.status(200).json([]);
    }
});

// ============================================
// ✅ جلب patient_id من user_id (للاستخدام في السجل الطبي)
// ============================================
router.get('/by-user/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // التحقق من أن المستخدم يطلب بياناته الخاصة أو هو admin/doctor
        if (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'doctor') {
            return res.status(403).json({ error: 'غير مصرح لك بالوصول إلى هذه البيانات' });
        }
        
        const result = await pool.query(`SELECT id FROM patients WHERE user_id = $1`, [userId]);
        
        if (result.rows.length === 0) {
            // إذا لم يكن للمريض سجل في جدول patients، قم بإنشائه
            const newPatient = await pool.query(
                `INSERT INTO patients (id, user_id, date_of_birth, gender) 
                 VALUES (uuid_generate_v4(), $1, CURRENT_DATE, 'male') 
                 RETURNING id`,
                [userId]
            );
            return res.json({ id: newPatient.rows[0].id });
        }
        
        res.json({ id: result.rows[0].id });
    } catch (error) {
        console.error('Error fetching patient by user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// حجز موعد لمريض بواسطة موظف الاستقبال (نسخة مبسطة)
// ============================================
router.post('/appointment/simple', async (req, res) => {
    try {
        const { patient_email, specialty } = req.body;
        if (!patient_email || !specialty) {
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني والتخصص مطلوبان' });
        }
        const userCheck = await pool.query(`SELECT id, full_name FROM users WHERE email = $1 AND role = 'patient'`, [patient_email]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المريض غير موجود' });
        }
        const userId = userCheck.rows[0].id;
        const patientName = userCheck.rows[0].full_name;
        let patientRecordId = null;
        let patientCheck = await pool.query(`SELECT id FROM patients WHERE user_id = $1`, [userId]);
        if (patientCheck.rows.length > 0) {
            patientRecordId = patientCheck.rows[0].id;
        } else {
            const newPatient = await pool.query(`INSERT INTO patients (user_id, date_of_birth, gender) VALUES ($1, CURRENT_DATE, 'male') RETURNING id`, [userId]);
            patientRecordId = newPatient.rows[0].id;
        }
        const result = await pool.query(
            `INSERT INTO appointments (id, patient_id, specialty, status, appointment_date) 
             VALUES (uuid_generate_v4(), $1, $2, 'scheduled', CURRENT_DATE) 
             RETURNING id, patient_id, specialty, status, appointment_date`,
            [patientRecordId, specialty]
        );
        res.status(201).json({ success: true, message: 'تم حجز الموعد بنجاح', appointment: result.rows[0] });
    } catch (error) {
        console.error('خطأ في حجز الموعد:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم: ' + error.message });
    }
});

module.exports = router;