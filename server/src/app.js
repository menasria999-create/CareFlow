const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// استيراد المسارات
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const adminRoutes = require('./routes/admin');
const receptionistRoutes = require('./routes/receptionist'); // ✅ تمت الإضافة

// ============================================
// إعداد اتصال قاعدة البيانات
// ============================================
const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'careflow_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// ============================================
// Middleware للمصادقة
// ============================================
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'غير مصرح به' });
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
        if (err) return res.status(403).json({ message: 'توكن غير صالح' });
        req.user = user;
        next();
    });
};

const app = express();

// ============================================
// إعدادات عامة
// ============================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// ضبط ترميز UTF-8
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// ============================================
// خدمة الملفات مع تحديد نوع المحتوى وعرضها مباشرة
// ============================================
app.use('/uploads', (req, res, next) => {
    const filePath = path.join(__dirname, '../uploads', req.path);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // إجبار المتصفح على عرض الملف مباشرة (وليس تحميله)
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'].includes(ext)) {
        res.setHeader('Content-Disposition', 'inline');
    }
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(404).json({ error: 'File not found' });
        }
    });
});

// ============================================
// تسجيل المسارات الرئيسية
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/receptionist', receptionistRoutes); // ✅ تمت الإضافة

// ============================================
// مسارات إضافية للملف الشخصي وتغيير كلمة المرور
// ============================================
app.put('/api/users/profile', authenticate, async (req, res) => {
    try {
        const { full_name, phone } = req.body;
        const userId = req.user.id;

        const query = `
            UPDATE users 
            SET full_name = COALESCE($1, full_name),
                phone = COALESCE($2, phone),
                updated_at = NOW()
            WHERE id = $3
            RETURNING id, email, full_name, phone, role
        `;
        const values = [full_name, phone, userId];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        res.json({ success: true, message: 'تم تحديث الملف الشخصي', user: result.rows[0] });
    } catch (error) {
        console.error('خطأ في تحديث الملف الشخصي:', error);
        res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
});

app.put('/api/users/change-password', authenticate, async (req, res) => {
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
// نقاط النهاية العامة والصحة
// ============================================
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: '🚀 CareFlow Server is running',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

app.get('/', (req, res) => {
    res.json({ 
        name: 'CareFlow API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            patients: '/api/patients',
            doctors: '/api/doctors',
            admin: '/api/admin',
            receptionist: '/api/receptionist'  // ✅ تمت الإضافة
        }
    });
});

// ============================================
// معالجة المسارات غير الموجودة (404)
// ============================================
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'المسار غير موجود' 
    });
});

// ============================================
// معالجة الأخطاء العامة
// ============================================
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ 
            success: false, 
            message: 'الملف كبير جداً' 
        });
    }
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'حدث خطأ في الخادم',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;