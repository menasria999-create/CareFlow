const app = require('./src/app');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// إعداد اتصال قاعدة البيانات
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'careflow_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// Middleware للتحقق من التوكن
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'غير مصرح به' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'توكن غير صالح' });
        }
        req.user = user;
        next();
    });
};

const PORT = process.env.PORT || 5000;

// ✅ Middleware لضبط ترميز UTF-8 لكل الردود JSON
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// ============================================
// مسار جلب قائمة الأطباء (للاستقبال)
// ============================================
app.get('/api/users/doctors', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, full_name, email, phone FROM users WHERE role = 'doctor' AND is_active = true"
        );
        res.json(result.rows);
    } catch (error) {
        console.error('خطأ في جلب الأطباء:', error);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// ============================================
// تسجيل مريض جديد (بواسطة موظف الاستقبال)
// ============================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { full_name, email, password, phone, date_of_birth, gender, medical_history, allergies, role } = req.body;
        
        console.log('محاولة تسجيل مريض جديد:', { email, full_name });
        
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'البريد الإلكتروني موجود بالفعل' });
        }
        
        const password_hash = bcrypt.hashSync(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, date_of_birth, gender) 
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true, $6, $7) RETURNING id, email, full_name, role`,
            [email, password_hash, full_name, phone, role || 'patient', date_of_birth, gender]
        );
        
        console.log('تم إنشاء المريض بنجاح:', result.rows[0]);
        
        res.status(201).json({ 
            message: 'تم إنشاء الحساب بنجاح', 
            user: result.rows[0],
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('خطأ في التسجيل:', error);
        res.status(500).json({ message: 'خطأ في الخادم: ' + error.message });
    }
});

// ============================================
// حجز موعد (عام - قد لا يستخدم)
// ============================================
app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_date, appointment_time, reason, status } = req.body;
        
        console.log('محاولة حجز موعد:', { patient_id, doctor_id, appointment_date });
        
        const result = await pool.query(
            `INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, reason, status, created_by) 
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [patient_id, doctor_id, appointment_date, appointment_time, reason, status || 'scheduled', req.user.id]
        );
        
        res.status(201).json({ message: 'تم حجز الموعد بنجاح', appointment: result.rows[0] });
    } catch (error) {
        console.error('خطأ في حجز الموعد:', error);
        res.status(500).json({ message: 'خطأ في حجز الموعد: ' + error.message });
    }
});

// ============================================
// تحديث الملف الشخصي للمستخدم (لأي دور: receptionist, doctor, patient)
// ============================================
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { full_name, phone, address, hire_date, employee_id } = req.body;
        const userId = req.user.id;

        // استخدام COALESCE لتجنب فرض null على الحقول غير المرسلة
        const result = await pool.query(
            `UPDATE users 
             SET full_name = COALESCE($1, full_name),
                 phone = COALESCE($2, phone),
                 address = COALESCE($3, address),
                 hire_date = COALESCE($4, hire_date),
                 employee_id = COALESCE($5, employee_id),
                 updated_at = NOW()
             WHERE id = $6
             RETURNING id, email, full_name, phone, role, address, hire_date, employee_id`,
            [full_name, phone, address, hire_date, employee_id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        res.json({ success: true, message: 'تم تحديث الملف الشخصي', user: result.rows[0] });
    } catch (error) {
        console.error('خطأ في تحديث الملف الشخصي:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
});

// ============================================
// تغيير كلمة المرور للمستخدم (لأي دور)
// ============================================
app.put('/api/users/change-password', authenticateToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const userId = req.user.id;

        const userQuery = `SELECT password_hash FROM users WHERE id = $1`;
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        const isValid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [hashedPassword, userId]);

        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (error) {
        console.error('خطأ في تغيير كلمة المرور:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
});
// ============================================
// مسار جلب الأطباء الذين فحصوا المريض
// ============================================
app.get('/api/patients/my-doctors', authenticateToken, async (req, res) => {
    try {
        const patientResult = await pool.query(`SELECT id FROM patients WHERE user_id = $1`, [req.user.id]);
        if (patientResult.rows.length === 0) {
            return res.json([]);
        }
        const patientId = patientResult.rows[0].id;
        const query = `
            SELECT DISTINCT
                d.id as doctor_id,
                u.full_name as doctor_name,
                d.specialization
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = $1 AND a.status = 'completed'
        `;
        const result = await pool.query(query, [patientId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error in /my-doctors:', error);
        res.status(500).json({ error: error.message });
    }
});

// تشغيل الخادم
const server = app.listen(PORT, () => {
    console.log(`
    ════════════════════════════════════════════════════
    🚀 CareFlow Server is running successfully!
    ════════════════════════════════════════════════════
    📡 Port: ${PORT}
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    🔗 API URL: http://localhost:${PORT}
    📝 Health Check: http://localhost:${PORT}/health
    ════════════════════════════════════════════════════
    `);
});

// معالجة إغلاق الخادم بشكل آمن
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});