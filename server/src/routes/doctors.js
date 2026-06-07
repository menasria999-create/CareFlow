const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============================================
// إحصائيات الطبيب (معدل)
// ============================================
router.get('/stats', authenticate, authorize('doctor'), async (req, res) => {
    try {
        // الحصول على معرف الطبيب من جدول doctors
        const doctorQuery = `SELECT id FROM doctors WHERE user_id = $1`;
        const doctorResult = await pool.query(doctorQuery, [req.user.id]);
        
        if (doctorResult.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor record not found' });
        }
        
        const doctorId = doctorResult.rows[0].id;
        
        // إجمالي المرضى (مواعيد غير ملغاة)
        const totalPatientsQuery = `SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = $1 AND status != 'cancelled'`;
        const totalPatients = await pool.query(totalPatientsQuery, [doctorId]);
        
        // المرضى الذين تم فحصهم (status = 'completed')
        const examinedQuery = `SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = $1 AND status = 'completed'`;
        const examinedPatients = await pool.query(examinedQuery, [doctorId]);
        
        // المرضى في الانتظار (status = 'scheduled' OR 'confirmed')
        const waitingQuery = `SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = $1 AND status IN ('scheduled', 'confirmed')`;
        const waitingPatients = await pool.query(waitingQuery, [doctorId]);
        
        console.log('📊 Stats results:', {
            total: totalPatients.rows[0].count,
            examined: examinedPatients.rows[0].count,
            waiting: waitingPatients.rows[0].count
        });
        
        res.json({ 
            total_patients: parseInt(totalPatients.rows[0].count) || 0, 
            examined_patients: parseInt(examinedPatients.rows[0].count) || 0, 
            waiting_patients: parseInt(waitingPatients.rows[0].count) || 0 
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// الملف الشخصي للطبيب (GET)
// ============================================
router.get('/profile', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const query = `SELECT u.id as user_id, u.full_name, u.email, u.phone, u.profile_image, d.id as doctor_id, d.specialization, d.license_number, d.years_experience, d.bio, d.clinic_address FROM users u JOIN doctors d ON u.id = d.user_id WHERE u.id = $1 AND u.is_active = true`;
        const result = await pool.query(query, [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get doctor profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// تحديث الملف الشخصي للطبيب (PUT)
// ============================================
router.put('/profile', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const { full_name, phone, clinic_address, bio, specialization, license_number, years_experience } = req.body;
        await pool.query(`UPDATE users SET full_name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [full_name, phone, req.user.id]);
        const updates = [], values = [];
        if (clinic_address !== undefined) { updates.push(`clinic_address = $${updates.length+1}`); values.push(clinic_address); }
        if (bio !== undefined) { updates.push(`bio = $${updates.length+1}`); values.push(bio); }
        if (specialization !== undefined) { updates.push(`specialization = $${updates.length+1}`); values.push(specialization); }
        if (license_number !== undefined) { updates.push(`license_number = $${updates.length+1}`); values.push(license_number); }
        if (years_experience !== undefined) { updates.push(`years_experience = $${updates.length+1}`); values.push(years_experience); }
        if (updates.length === 0) return res.json({ success: true, message: 'لا توجد بيانات جديدة للتحديث' });
        const updateDoctorQuery = `UPDATE doctors SET ${updates.join(', ')} WHERE user_id = $${updates.length+1}`;
        values.push(req.user.id);
        await pool.query(updateDoctorQuery, values);
        res.json({ success: true, message: 'تم تحديث الملف الشخصي بنجاح' });
    } catch (error) {
        console.error('Update doctor profile error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// المرضى الذين تم فحصهم
// ============================================
router.get('/patients/examined', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const doctorResult = await pool.query(`SELECT id FROM doctors WHERE user_id = $1`, [req.user.id]);
        if (doctorResult.rows.length === 0) return res.status(404).json({ error: 'Doctor record not found' });
        const doctorId = doctorResult.rows[0].id;
        const query = `SELECT DISTINCT p.id as patient_id, u.id as user_id, u.full_name, u.email, u.phone, p.date_of_birth, p.blood_type, p.allergies, p.medical_history, a.id as appointment_id, a.status as appointment_status, MAX(a.appointment_date) as last_visit FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN users u ON p.user_id = u.id WHERE a.doctor_id = $1 AND a.status = 'completed' AND u.is_active = true GROUP BY p.id, u.id, u.full_name, u.email, u.phone, p.date_of_birth, p.blood_type, p.allergies, p.medical_history, a.id, a.status ORDER BY last_visit DESC`;
        const result = await pool.query(query, [doctorId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get examined patients error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// المرضى المنتظرين (لم يتم فحصهم بعد) - معدل
// ============================================
router.get('/patients/pending', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const doctorResult = await pool.query(`SELECT id FROM doctors WHERE user_id = $1`, [req.user.id]);
        if (doctorResult.rows.length === 0) return res.status(404).json({ error: 'Doctor record not found' });
        const doctorId = doctorResult.rows[0].id;
        
        // ✅ البحث عن المواعيد المرتبطة بالطبيب مباشرة
        const query = `
            SELECT 
                p.id as patient_id, 
                u.id as user_id, 
                u.full_name, 
                u.email, 
                u.phone, 
                p.date_of_birth, 
                p.blood_type, 
                p.allergies, 
                p.medical_history, 
                a.specialty, 
                a.appointment_date, 
                a.status, 
                a.id as appointment_id 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.id 
            JOIN users u ON p.user_id = u.id 
            WHERE a.status = 'scheduled' 
            AND a.doctor_id = $1
            ORDER BY a.appointment_date ASC
        `;
        const result = await pool.query(query, [doctorId]);
        
        console.log('📋 Pending patients found:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching pending patients:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// ============================================
// تفاصيل مريض معين (يدعم patient_id أو user_id)
// ============================================
router.get('/patients/:patientId/details', authenticate, authorize('doctor'), async (req, res) => {
    try {
        let identifier = req.params.patientId;
        let realPatientId = null;

        let patient = await pool.query(`SELECT id FROM patients WHERE id = $1`, [identifier]);
        if (patient.rows.length > 0) {
            realPatientId = patient.rows[0].id;
        } else {
            patient = await pool.query(`SELECT id FROM patients WHERE user_id = $1`, [identifier]);
            if (patient.rows.length > 0) {
                realPatientId = patient.rows[0].id;
            } else {
                const user = await pool.query(`SELECT id FROM users WHERE id = $1 AND role = 'patient' AND is_active = true`, [identifier]);
                if (user.rows.length === 0) {
                    return res.status(404).json({ error: 'Patient not found' });
                }
                const newPatient = await pool.query(`INSERT INTO patients (id, user_id, date_of_birth, gender) VALUES (uuid_generate_v4(), $1, CURRENT_DATE, 'male') RETURNING id`, [user.rows[0].id]);
                realPatientId = newPatient.rows[0].id;
            }
        }

        const doctorSpecialty = await pool.query(`SELECT specialization FROM doctors WHERE user_id = $1`, [req.user.id]);
        if (doctorSpecialty.rows.length === 0) return res.status(404).json({ error: 'Doctor record not found' });

        const query = `
            SELECT 
                p.id as patient_id, u.id as user_id, u.full_name, u.email, u.phone,
                p.date_of_birth, p.blood_type, p.allergies, p.medical_history,
                a.id as appointment_id, a.status as appointment_status, a.appointment_date, a.appointment_time
            FROM patients p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN appointments a ON a.patient_id = p.id 
                AND a.specialty = $1
                AND a.status IN ('scheduled', 'confirmed', 'completed')
            WHERE p.id = $2 AND u.is_active = true
            ORDER BY a.appointment_date DESC
            LIMIT 1
        `;
        const result = await pool.query(query, [doctorSpecialty.rows[0].specialization, realPatientId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Patient data not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get patient details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// تغيير حالة الموعد إلى "تم الفحص"
// ============================================
router.put('/appointments/:appointmentId/complete', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const result = await pool.query(`UPDATE appointments SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [req.params.appointmentId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        console.log('✅ Appointment completed:', result.rows[0].id);
        res.json({ success: true, message: 'تم تحديث حالة المريض إلى "تم الفحص"' });
    } catch (error) {
        console.error('Complete appointment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// إضافة وصفة طبية
// ============================================
router.post('/prescriptions', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const { patient_id, items } = req.body;
        const doctorResult = await pool.query(`SELECT id FROM doctors WHERE user_id = $1`, [req.user.id]);
        if (doctorResult.rows.length === 0) return res.status(404).json({ error: 'Doctor record not found' });
        const doctorId = doctorResult.rows[0].id;
        const prescriptionResult = await pool.query(`INSERT INTO prescriptions (patient_id, doctor_id) VALUES ($1, $2) RETURNING id`, [patient_id, doctorId]);
        const prescriptionId = prescriptionResult.rows[0].id;
        for (const item of items) {
            if (item.medication_name && item.dosage && item.frequency) {
                await pool.query(`INSERT INTO prescription_items (prescription_id, medication_name, dosage, frequency, duration_days, instructions) VALUES ($1, $2, $3, $4, $5, $6)`, [
                    prescriptionId, item.medication_name, item.dosage, item.frequency, item.duration_days || null, item.instructions || null
                ]);
            }
        }
        res.json({ success: true, message: 'تم إضافة الوصفة الطبية بنجاح' });
    } catch (error) {
        console.error('Create prescription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب الوصفات السابقة لمريض
// ============================================
router.get('/patients/:patientId/prescriptions', authenticate, authorize('doctor'), async (req, res) => {
    try {
        let patientId = req.params.patientId;
        let realPatientId = patientId;
        const patientCheck = await pool.query(`SELECT id FROM patients WHERE user_id = $1 OR id = $1`, [patientId]);
        if (patientCheck.rows.length === 0) return res.status(404).json({ error: 'Patient record not found' });
        realPatientId = patientCheck.rows[0].id;
        const query = `
            SELECT p.id, p.created_at, json_agg(json_build_object(
                'medication_name', pi.medication_name,
                'dosage', pi.dosage,
                'frequency', pi.frequency,
                'duration_days', pi.duration_days,
                'instructions', pi.instructions
            )) as items
            FROM prescriptions p
            JOIN prescription_items pi ON p.id = pi.prescription_id
            WHERE p.patient_id = $1
            GROUP BY p.id, p.created_at
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(query, [realPatientId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get prescriptions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب وثائق المريض
// ============================================
router.get('/patients/:patientId/documents', authenticate, authorize('doctor'), async (req, res) => {
    try {
        let patientId = req.params.patientId;
        let realPatientId = patientId;
        const patientCheck = await pool.query(`SELECT id FROM patients WHERE user_id = $1 OR id = $1`, [patientId]);
        if (patientCheck.rows.length === 0) return res.status(404).json({ error: 'Patient record not found' });
        realPatientId = patientCheck.rows[0].id;
        const query = `
            SELECT mr.id, mr.title, mr.content, mr.file_url, mr.report_type, mr.report_date, mr.created_at,
                   u.full_name as doctor_name, d.specialization,
                   CASE WHEN mr.doctor_id IS NULL THEN 'patient' ELSE 'doctor' END as source
            FROM medical_reports mr
            LEFT JOIN doctors d ON mr.doctor_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE mr.patient_id = $1
            ORDER BY mr.created_at DESC
        `;
        const result = await pool.query(query, [realPatientId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get patient documents error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// إضافة تقرير طبي من قبل الطبيب
// ============================================
router.post('/reports', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const { patient_id, title, content } = req.body;
        const doctorResult = await pool.query(`SELECT id FROM doctors WHERE user_id = $1`, [req.user.id]);
        if (doctorResult.rows.length === 0) return res.status(404).json({ error: 'Doctor record not found' });
        const doctorId = doctorResult.rows[0].id;
        const result = await pool.query(`INSERT INTO medical_reports (patient_id, doctor_id, title, content, report_type) VALUES ($1, $2, $3, $4, 'report') RETURNING *`, [patient_id, doctorId, title, content]);
        res.status(201).json({ success: true, message: 'تم إضافة التقرير الطبي بنجاح', report: result.rows[0] });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// إخراج المريض من النظام (تعطيل الحساب)
// ============================================
router.put('/patients/:patientId/discharge', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const patientResult = await pool.query(`SELECT user_id FROM patients WHERE id = $1`, [req.params.patientId]);
        if (patientResult.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
        const userId = patientResult.rows[0].user_id;
        await pool.query(`UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [userId]);
        res.json({ success: true, message: 'تم إخراج المريض من النظام بنجاح' });
    } catch (error) {
        console.error('Discharge patient error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// تغيير كلمة المرور للطبيب
// ============================================
router.put('/change-password', authenticate, authorize('doctor'), async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
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
// جلب مواعيد الطبيب الحالي (المواعيد القادمة فقط) - معدل
// ============================================
router.get('/my-appointments', authenticate, authorize('doctor'), async (req, res) => {
    try {
        // الحصول على معرف الطبيب من جدول doctors
        const doctorResult = await pool.query(`SELECT id FROM doctors WHERE user_id = $1`, [req.user.id]);
        if (doctorResult.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor record not found' });
        }
        const doctorId = doctorResult.rows[0].id;

        // ✅ جلب المواعيد القادمة فقط (من اليوم فصاعداً)
        const query = `
            SELECT 
                a.id, 
                a.appointment_date, 
                a.status, 
                a.specialty,
                p.id as patient_id,
                u.id as patient_user_id,
                u.full_name as patient_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE a.doctor_id = $1
            AND a.appointment_date >= CURRENT_DATE
            AND a.status IN ('scheduled', 'confirmed')
            ORDER BY a.appointment_date ASC
        `;
        const result = await pool.query(query, [doctorId]);
        
        console.log('📅 Upcoming appointments found:', result.rows.length);
        
        res.json({ 
            success: true, 
            appointments: result.rows 
        });
    } catch (error) {
        console.error('Error fetching doctor appointments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;