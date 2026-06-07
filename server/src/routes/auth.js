const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { Resend } = require('resend');

// ============================================
// خدمات البريد والتوكن (لإعادة تعيين كلمة المرور)
// ============================================
const { sendPasswordResetEmail } = require('../services/emailService');
const { generateResetToken, isTokenValid } = require('../services/tokenService');
const crypto = require('crypto');

router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Auth route is working' });
});

// ============================================
// طلب إعادة تعيين كلمة المرور (نسيت كلمة المرور)
// ============================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'البريد الإلكتروني مطلوب' 
            });
        }
        
        // البحث عن المستخدم (لا نظهر إن وجد أم لا لأسباب أمنية)
        const userQuery = `SELECT id, email FROM users WHERE email = $1`;
        const userResult = await pool.query(userQuery, [email.toLowerCase()]);
        
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            
            // إنشاء توكن عشوائي
            const resetToken = generateResetToken();
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة
            
            // حفظ التوكن في قاعدة البيانات
            await pool.query(
                `UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3`,
                [resetToken, expiresAt, user.id]
            );
            
            // إنشاء رابط إعادة التعيين
            const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
            
            // إرسال البريد
            await sendPasswordResetEmail(email, resetLink);
            
            console.log(`📧 Reset email sent to: ${email}`);
        }
        
        // دائماً نرسل نفس الرسالة (لمنع معرفة وجود البريد)
        res.json({
            success: true,
            message: 'إذا كان البريد الإلكتروني مسجلاً في نظامنا، سيصلك رابط إعادة تعيين كلمة المرور خلال بضع دقائق.'
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى' 
        });
    }
});

// ============================================
// تأكيد إعادة تعيين كلمة المرور (وضع كلمة مرور جديدة)
// ============================================
router.post('/reset-password', async (req, res) => {
    try {
        const { token, new_password } = req.body;
        
        // التحقق من صحة البيانات
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'رابط إعادة التعيين غير صالح'
            });
        }
        
        if (!new_password || new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
            });
        }
        
        // البحث عن المستخدم بواسطة التوكن
        const userQuery = `
            SELECT id, email, reset_token, reset_token_expires_at 
            FROM users 
            WHERE reset_token = $1
        `;
        const userResult = await pool.query(userQuery, [token]);
        
        if (userResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'رابط إعادة التعيين غير صالح أو تم استخدامه مسبقاً'
            });
        }
        
        const user = userResult.rows[0];
        
        // التحقق من صلاحية التوكن
        if (!isTokenValid(user.reset_token_expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'انتهت صلاحية رابط إعادة التعيين. يرجى طلب رابط جديد.'
            });
        }
        
        // تشفير كلمة المرور الجديدة
        const hashedPassword = await bcrypt.hash(new_password, 10);
        
        // تحديث كلمة المرور وحذف التوكن (لمنع إعادة استخدامه)
        await pool.query(
            `UPDATE users 
             SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL 
             WHERE id = $2`,
            [hashedPassword, user.id]
        );
        
        console.log(`✅ Password reset successfully for: ${user.email}`);
        
        res.json({
            success: true,
            message: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى'
        });
    }
});

// ============================================
// تسجيل الدخول - الترتيب الصحيح:
// 1. التحقق من صحة البريد وكلمة المرور
// 2. التحقق من تطابق الدور مع الواجهة (expected_role)
// 3. التحقق من نشاط الحساب (is_active)
// ============================================
router.post('/login', [
    body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
    body('expected_role').optional().isIn(['patient', 'employee']).withMessage('الدور المتوقع يجب أن يكون patient أو employee')
], async (req, res) => {
    console.log('📥 /login received, body:', req.body);
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        
        const { email, password, expected_role } = req.body;
        console.log(`Attempting login for: ${email}, expected_role: ${expected_role || 'not specified'}`);
        
        // ============================================
        // الخطوة 1: التحقق من وجود البريد وصحة كلمة المرور
        // ============================================
        const userQuery = `SELECT id, email, password_hash, full_name, role, phone, profile_image, is_active FROM users WHERE email = $1`;
        const userResult = await pool.query(userQuery, [email]);
        
        if (userResult.rows.length === 0) {
            console.log('User not found');
            return res.status(401).json({ success: false, message: 'خطأ في البريد الإلكتروني أو كلمة المرور' });
        }
        
        const user = userResult.rows[0];
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            console.log('Invalid password');
            return res.status(401).json({ success: false, message: 'خطأ في البريد الإلكتروني أو كلمة المرور' });
        }
        
        // ============================================
        // الخطوة 2: التحقق من تطابق الدور مع الواجهة (قبل فحص النشاط)
        // ============================================
        if (expected_role) {
            const isPatient = user.role === 'patient';
            const isEmployee = user.role === 'doctor' || user.role === 'receptionist' || user.role === 'admin';
            
            // إذا كانت الواجهة خاصة بالمرضى ولكن المستخدم موظف
            if (expected_role === 'patient' && !isPatient) {
                console.log(`Role mismatch: ${user.role} trying to access patient interface`);
                return res.status(403).json({ 
                    success: false, 
                    message: 'هذا الحساب ليس حساب مريض',
                    role_mismatch: true
                });
            }
            
            // إذا كانت الواجهة خاصة بالموظفين ولكن المستخدم مريض
            if (expected_role === 'employee' && !isEmployee) {
                console.log(`Role mismatch: ${user.role} trying to access employee interface`);
                return res.status(403).json({ 
                    success: false, 
                    message: 'هذا الحساب ليس حساب موظف',
                    role_mismatch: true
                });
            }
        }
        
        // ============================================
        // الخطوة 3: التحقق من نشاط الحساب (بعد التأكد من تطابق الدور)
        // ============================================
        if (!user.is_active) {
            console.log('User is inactive');
            let customMessage = '';
            if (user.role === 'patient') {
                customMessage = '🌿 لقد تحسنت حالتك الصحية، وتم إخراجك من المنصة. نشكرك على ثقتك. للاستفسار، تواصل مع العيادة.';
            } else if (user.role === 'doctor' || user.role === 'receptionist' || user.role === 'admin') {
                customMessage = '📋 تم إنهاء عقد العمل معنا، شكرًا على تفانيكم في العمل والجد، وللاستفسار أكثر تواصل مع العيادة.';
            } else {
                customMessage = 'هذا الحساب غير نشط. يرجى الاتصال بالإدارة.';
            }
            return res.status(401).json({ 
                success: false, 
                message: customMessage,
                account_disabled: true,
                role: user.role
            });
        }
        
        // ============================================
        // جميع التحققات نجحت - تسجيل الدخول ناجح
        // ============================================
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        console.log(`Login successful for ${email}`);
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                phone: user.phone,
                profile_image: user.profile_image
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
});

router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({ success: true, user: req.user });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
});

router.post('/register/patient', [
    body('email').matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/i).withMessage('البريد الإلكتروني يجب أن يكون عنوان Gmail صالحاً (example@gmail.com)'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('full_name').notEmpty().withMessage('الاسم الكامل مطلوب'),
    body('date_of_birth').isDate().withMessage('تاريخ الميلاد غير صحيح'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('الجنس غير صحيح')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password, full_name, phone, date_of_birth, gender, blood_type, medical_history, allergies, emergency_contact_name, emergency_contact_phone } = req.body;
        const normalizedEmail = email.toLowerCase();

        const existingUser = await pool.query(`SELECT id, is_active FROM users WHERE email = $1`, [normalizedEmail]);

        if (existingUser.rows.length > 0) {
            const user = existingUser.rows[0];
            if (user.is_active === true) {
                return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل بالفعل في حساب نشط. استخدم بريد الكتروني آخر.' });
            }
            console.log(`🗑️ حذف حساب معطل (${normalizedEmail}) وإنشاء حساب جديد.`);
            await pool.query(`DELETE FROM medical_reports WHERE patient_id IN (SELECT id FROM patients WHERE user_id = $1)`, [user.id]);
            await pool.query(`DELETE FROM appointments WHERE patient_id IN (SELECT id FROM patients WHERE user_id = $1)`, [user.id]);
            await pool.query(`DELETE FROM prescriptions WHERE patient_id IN (SELECT id FROM patients WHERE user_id = $1)`, [user.id]);
            await pool.query(`DELETE FROM prescription_items WHERE prescription_id IN (SELECT id FROM prescriptions WHERE patient_id IN (SELECT id FROM patients WHERE user_id = $1))`, [user.id]);
            await pool.query(`DELETE FROM patients WHERE user_id = $1`, [user.id]);
            await pool.query(`DELETE FROM password_resets WHERE email = $1`, [normalizedEmail]);
            await pool.query(`DELETE FROM users WHERE id = $1`, [user.id]);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await pool.query(`
            INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
            VALUES ($1, $2, $3, $4, 'patient', true)
            RETURNING id, email, full_name, role
        `, [normalizedEmail, hashedPassword, full_name, phone || null]);

        const userId = userResult.rows[0].id;

        await pool.query(`
            INSERT INTO patients (user_id, date_of_birth, gender, blood_type, medical_history, allergies, emergency_contact, emergency_phone)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [userId, date_of_birth, gender, blood_type || null, medical_history || null, allergies || null, emergency_contact_name || null, emergency_contact_phone || null]);

        const token = jwt.sign(
            { id: userId, email: normalizedEmail, role: 'patient' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(201).json({
            success: true,
            message: 'تم إنشاء حساب المريض بنجاح',
            token,
            user: userResult.rows[0]
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم: ' + error.message });
    }
});

module.exports = router;