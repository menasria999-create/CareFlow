const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ============================================
// دالة مساعدة للتحقق من وجود تخصص مكرر لطبيب جديد
// ✅ فقط الأطباء النشطاء (المعطلون لا يمنعون إضافة تخصص جديد)
// ============================================
const checkDoctorSpecialtyExists = async (specialization) => {
    if (!specialization) return false;
    const query = `
        SELECT d.id, d.user_id, d.specialization 
        FROM doctors d
        INNER JOIN users u ON d.user_id = u.id
        WHERE d.specialization = $1 AND u.is_active = true
    `;
    const result = await pool.query(query, [specialization]);
    return result.rows.length > 0;
};

// ============================================
// دالة مساعدة للتحقق من وجود تخصص مكرر عند التعديل (مع استثناء الطبيب الحالي)
// ✅ فقط الأطباء النشطاء الآخرين
// ============================================
const checkDoctorSpecialtyExistsForUpdate = async (specialization, currentUserId) => {
    if (!specialization) return false;
    const query = `
        SELECT d.id, d.user_id 
        FROM doctors d
        INNER JOIN users u ON d.user_id = u.id
        WHERE d.specialization = $1 
        AND d.user_id != $2
        AND u.is_active = true
    `;
    const result = await pool.query(query, [specialization, currentUserId]);
    return result.rows.length > 0;
};

// ============================================
// جلب إحصائيات عامة للإدارة
// ============================================
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
    try {
        const patientsQuery = `SELECT COUNT(*) as count FROM users WHERE role = 'patient' AND is_active = true`;
        const patientsResult = await pool.query(patientsQuery);
        
        const doctorsQuery = `SELECT COUNT(*) as count FROM users WHERE role = 'doctor' AND is_active = true`;
        const doctorsResult = await pool.query(doctorsQuery);
        
        const receptionistsQuery = `SELECT COUNT(*) as count FROM users WHERE role = 'receptionist' AND is_active = true`;
        const receptionistsResult = await pool.query(receptionistsQuery);
        
        res.json({
            patients: parseInt(patientsResult.rows[0].count),
            doctors: parseInt(doctorsResult.rows[0].count),
            receptionists: parseInt(receptionistsResult.rows[0].count),
        });
        
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب جميع المستخدمين حسب الدور (النشطاء فقط - المحذوفون ظاهرياً لا يظهرون)
// ============================================
router.get('/users/:role', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { role } = req.params;
        const allowedRoles = ['doctor', 'receptionist'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const query = `
            SELECT 
                u.id,
                u.email,
                u.full_name,
                u.phone,
                u.address,
                u.hire_date,
                u.employee_id,
                u.role,
                u.is_active,
                u.created_at,
                d.specialization,
                d.license_number
            FROM users u
            LEFT JOIN doctors d ON u.id = d.user_id
            WHERE u.role = $1 AND u.is_active = true
            ORDER BY u.created_at DESC
        `;
        
        const result = await pool.query(query, [role]);
        
        const rows = result.rows.map(row => {
            if (row.specialization) {
                const spec = row.specialization;
                if (spec === 'Orthopedics') row.specialization = 'العظام والمفاصل';
                else if (spec === 'Pediatrics') row.specialization = 'طب الأطفال';
                else if (spec === 'Dermatology') row.specialization = 'الأمراض الجلدية';
                else if (spec === 'Neurology') row.specialization = 'الأعصاب';
                else if (spec === 'Cardiology') row.specialization = 'القلبية';
                else if (spec === 'Chronic Diseases') row.specialization = 'الأمراض المزمنة';
            }
            return row;
        });
        
        res.json(rows);
        
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// جلب مستخدم واحد بالمعرف
// ============================================
router.get('/user/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                u.id,
                u.email,
                u.full_name,
                u.phone,
                u.role,
                u.is_active,
                u.address,
                u.hire_date,
                u.employee_id,
                u.created_at,
                d.specialization,
                d.license_number
            FROM users u
            LEFT JOIN doctors d ON u.id = d.user_id
            WHERE u.id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        
        let user = result.rows[0];
        if (user.specialization) {
            const spec = user.specialization;
            if (spec === 'Orthopedics') user.specialization = 'العظام والمفاصل';
            else if (spec === 'Pediatrics') user.specialization = 'طب الأطفال';
            else if (spec === 'Dermatology') user.specialization = 'الأمراض الجلدية';
            else if (spec === 'Neurology') user.specialization = 'الأعصاب';
            else if (spec === 'Cardiology') user.specialization = 'القلبية';
            else if (spec === 'Chronic Diseases') user.specialization = 'الأمراض المزمنة';
        }
        
        res.json({ success: true, user });
        
    } catch (error) {
        console.error('خطأ في جلب المستخدم:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
});

// ============================================
// إضافة مستخدم جديد
// ============================================
router.post('/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { email, password, full_name, phone, address, hire_date, employee_id, role, specialization, license_number } = req.body;
        
        if (role === 'cleaner') {
            return res.status(400).json({ error: 'لا يمكن إضافة عامل نظافة من هذه الواجهة' });
        }
        
        if (role === 'doctor' && specialization) {
            const specialtyExists = await checkDoctorSpecialtyExists(specialization);
            if (specialtyExists) {
                return res.status(400).json({ 
                    error: `❌ لا يمكن إضافة طبيب جديد. تخصص "${specialization}" موجود مسبقاً لطبيب نشط.`,
                    existing_specialty: true
                });
            }
        }
        
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        if (!gmailRegex.test(email)) {
            return res.status(400).json({ error: 'البريد الإلكتروني يجب أن يكون عنوان Gmail صالحاً (example@gmail.com)' });
        }
        
        const normalizedEmail = email.toLowerCase();
        
        const existingUser = await pool.query(`SELECT id, is_active FROM users WHERE email = $1`, [normalizedEmail]);
        
        if (existingUser.rows.length > 0) {
            const user = existingUser.rows[0];
            if (user.is_active === true) {
                return res.status(400).json({ error: 'البريد الإلكتروني موجود بالفعل وحسابه نشط. لا يمكن إضافة مستخدم بنفس البريد.' });
            }
            
            console.log(`🗑️ حذف حساب معطل وإنشاء حساب جديد: ${normalizedEmail}`);
            const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [user.id]);
            const userRole = roleCheck.rows[0]?.role;
            
            if (userRole === 'doctor') {
                await pool.query(`DELETE FROM appointments WHERE doctor_id IN (SELECT id FROM doctors WHERE user_id = $1)`, [user.id]);
                await pool.query(`DELETE FROM doctors WHERE user_id = $1`, [user.id]);
            }
            if (userRole === 'patient') {
                await pool.query(`DELETE FROM patients WHERE user_id = $1`, [user.id]);
            }
            await pool.query(`DELETE FROM users WHERE id = $1`, [user.id]);
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userQuery = `
            INSERT INTO users (id, email, password_hash, full_name, phone, address, hire_date, employee_id, role, is_active)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING id, email, full_name, phone, address, hire_date, employee_id, role
        `;
        const userResult = await pool.query(userQuery, [normalizedEmail, hashedPassword, full_name, phone, address || null, hire_date || null, employee_id || null, role]);
        const userId = userResult.rows[0].id;
        
        if (role === 'doctor') {
            const doctorQuery = `
                INSERT INTO doctors (id, user_id, specialization, license_number)
                VALUES (gen_random_uuid(), $1, $2, $3)
            `;
            await pool.query(doctorQuery, [userId, specialization || null, license_number || null]);
        }
        
        res.status(201).json({
            success: true,
            message: 'تم إضافة المستخدم بنجاح',
            user: userResult.rows[0]
        });
        
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// تحديث مستخدم
// ============================================
router.put('/users/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        let { full_name, phone, email, address, hire_date, employee_id, is_active, specialization, license_number } = req.body;
        
        if (email !== undefined) {
            const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
            if (!gmailRegex.test(email)) {
                return res.status(400).json({ error: 'البريد الإلكتروني يجب أن يكون عنوان Gmail صالحاً (example@gmail.com)' });
            }
            email = email.toLowerCase();
        }
        
        if (specialization !== undefined && specialization !== '') {
            const roleCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [id]);
            if (roleCheck.rows.length > 0 && roleCheck.rows[0].role === 'doctor') {
                const specialtyExists = await checkDoctorSpecialtyExistsForUpdate(specialization, id);
                if (specialtyExists) {
                    return res.status(400).json({ 
                        error: `❌ لا يمكن تغيير التخصص إلى "${specialization}". هذا التخصص موجود مسبقاً لطبيب نشط آخر.`,
                        existing_specialty: true
                    });
                }
            }
        }
        
        const userFields = [];
        const userValues = [];
        
        if (full_name !== undefined) { userFields.push(`full_name = $${userFields.length + 1}`); userValues.push(full_name); }
        if (phone !== undefined) { userFields.push(`phone = $${userFields.length + 1}`); userValues.push(phone); }
        if (email !== undefined) { userFields.push(`email = $${userFields.length + 1}`); userValues.push(email); }
        if (address !== undefined) { userFields.push(`address = $${userFields.length + 1}`); userValues.push(address); }
        if (hire_date !== undefined) { userFields.push(`hire_date = $${userFields.length + 1}`); userValues.push(hire_date); }
        if (employee_id !== undefined) { userFields.push(`employee_id = $${userFields.length + 1}`); userValues.push(employee_id); }
        if (is_active !== undefined) { userFields.push(`is_active = $${userFields.length + 1}`); userValues.push(is_active); }
        
        if (userFields.length > 0) {
            userFields.push(`updated_at = NOW()`);
            const userQuery = `
                UPDATE users 
                SET ${userFields.join(', ')}
                WHERE id = $${userFields.length + 1}
                RETURNING id, email, full_name, phone, role, is_active, address, hire_date, employee_id
            `;
            userValues.push(id);
            await pool.query(userQuery, userValues);
        }
        
        const roleResult = await pool.query(`SELECT role FROM users WHERE id = $1`, [id]);
        if (roleResult.rows.length > 0 && roleResult.rows[0].role === 'doctor') {
            const doctorFields = [];
            const doctorValues = [];
            if (specialization !== undefined && specialization !== '') {
                doctorFields.push(`specialization = $${doctorFields.length + 1}`);
                doctorValues.push(specialization);
            }
            if (license_number !== undefined && license_number !== '') {
                doctorFields.push(`license_number = $${doctorFields.length + 1}`);
                doctorValues.push(license_number);
            }
            if (doctorFields.length > 0) {
                const doctorQuery = `
                    UPDATE doctors 
                    SET ${doctorFields.join(', ')}
                    WHERE user_id = $${doctorFields.length + 1}
                `;
                doctorValues.push(id);
                await pool.query(doctorQuery, doctorValues);
            }
        }
        
        res.json({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح' });
        
    } catch (error) {
        console.error('خطأ في تحديث المستخدم:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم: ' + error.message });
    }
});

// ============================================
// ✅ حذف ظاهري (تعطيل) - يبدو للمدير كحذف حقيقي
// ============================================
router.delete('/users/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const userCheck = await pool.query(`SELECT id, role, is_active FROM users WHERE id = $1`, [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        
        const userRole = userCheck.rows[0].role;
        const isActive = userCheck.rows[0].is_active;
        
        // منع تعطيل حساب المدير الرئيسي
        if (userRole === 'admin') {
            return res.status(403).json({ error: 'لا يمكن حذف حساب المدير الرئيسي' });
        }
        
        if (isActive === false) {
            return res.status(400).json({ error: 'هذا المستخدم محذوف بالفعل' });
        }
        
        // ✅ تعطيل الحساب بدلاً من حذفه فعلياً
        await pool.query(`UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        
        res.json({
            success: true,
            message: 'تم حذف المستخدم بنجاح'
        });
        
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'حدث خطأ في حذف المستخدم: ' + error.message });
    }
});

// ============================================
// إعادة تفعيل مستخدم
// ============================================
router.put('/users/:id/activate', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const userCheck = await pool.query(`SELECT id, role, is_active FROM users WHERE id = $1`, [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        
        const isActive = userCheck.rows[0].is_active;
        
        if (isActive === true) {
            return res.status(400).json({ error: 'هذا الحساب نشط بالفعل' });
        }
        
        await pool.query(`UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        
        res.json({
            success: true,
            message: 'تم تفعيل المستخدم بنجاح. يمكنه الآن الدخول إلى النظام.'
        });
        
    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({ error: 'حدث خطأ في تفعيل المستخدم: ' + error.message });
    }
});

// ============================================
// إعدادات النظام
// ============================================
router.get('/settings', authenticate, authorize('admin'), async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY DEFAULT 1,
                clinic_name VARCHAR(255),
                clinic_phone VARCHAR(50),
                clinic_email VARCHAR(255),
                clinic_address TEXT,
                work_hours VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        const result = await pool.query(`SELECT * FROM settings LIMIT 1`);
        if (result.rows.length === 0) {
            await pool.query(`
                INSERT INTO settings (id, clinic_name, clinic_phone, clinic_email, clinic_address, work_hours)
                VALUES (1, 'عيادة الشفاء الطبية', '0555123456', 'clinic@careflow.com', 
                        'حي البشير الابراهيمي، الحجيرة، ولاية تقرت', 
                        'السبت - الخميس (9 صباحاً - 9 مساءً)')
            `);
            return res.json({
                clinic_name: 'عيادة الشفاء الطبية',
                clinic_phone: '0555123456',
                clinic_email: 'clinic@careflow.com',
                clinic_address: 'حي البشير الابراهيمي، الحجيرة، ولاية تقرت',
                work_hours: 'السبت - الخميس (9 صباحاً - 9 مساءً)'
            });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/settings', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { clinic_name, clinic_phone, clinic_email, clinic_address, work_hours } = req.body;
        
        if (!clinic_name || !clinic_phone || !clinic_email || !clinic_address || !work_hours) {
            return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
        }
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY DEFAULT 1,
                clinic_name VARCHAR(255),
                clinic_phone VARCHAR(50),
                clinic_email VARCHAR(255),
                clinic_address TEXT,
                work_hours VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await pool.query(`DELETE FROM settings`);
        await pool.query(`
            INSERT INTO settings (id, clinic_name, clinic_phone, clinic_email, clinic_address, work_hours)
            VALUES (1, $1, $2, $3, $4, $5)
        `, [clinic_name, clinic_phone, clinic_email, clinic_address, work_hours]);
        
        res.json({ success: true, message: 'تم تحديث إعدادات النظام بنجاح' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// ============================================
// تحديث الملف الشخصي للمدير
// ============================================
router.put('/profile', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { full_name, phone, email } = req.body;
        
        if (email) {
            const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
            if (!gmailRegex.test(email)) {
                return res.status(400).json({ error: 'البريد الإلكتروني يجب أن يكون عنوان Gmail صالحاً (example@gmail.com)' });
            }
            const normalizedEmail = email.toLowerCase();
            
            const existingUser = await pool.query(
                `SELECT id FROM users WHERE email = $1 AND id != $2`,
                [normalizedEmail, req.user.id]
            );
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر' });
            }
            
            const result = await pool.query(`
                UPDATE users 
                SET full_name = $1, phone = $2, email = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING id, email, full_name, phone, role
            `, [full_name, phone, normalizedEmail, req.user.id]);
            
            if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
            return res.json({ success: true, message: 'تم تحديث الملف الشخصي بنجاح', user: result.rows[0] });
        } else {
            const result = await pool.query(`
                UPDATE users 
                SET full_name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING id, email, full_name, phone, role
            `, [full_name, phone, req.user.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
            return res.json({ success: true, message: 'تم تحديث الملف الشخصي بنجاح', user: result.rows[0] });
        }
    } catch (error) {
        console.error('Update admin profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// تغيير كلمة المرور للمدير
// ============================================
router.put('/change-password', authenticate, authorize('admin'), async (req, res) => {
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

module.exports = router;