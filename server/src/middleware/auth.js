const jwt = require('jsonwebtoken');
const User = require('../models/User');

// مصادقة المستخدم (التحقق من التوكن)
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: '❌ خطأ: لم يتم توفير رمز المصادقة' 
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: '❌ خطأ: صيغة الرمز غير صحيحة' 
            });
        }
        
        // التحقق من صحة التوكن
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // البحث عن المستخدم
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: '❌ خطأ: المستخدم غير موجود' 
            });
        }
        
        // إضافة المستخدم إلى الـ request
        req.user = user;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: '❌ خطأ: الرمز غير صالح' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: '❌ خطأ: انتهت صلاحية الرمز' 
            });
        }
        
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            success: false, 
            message: '❌ خطأ في المصادقة' 
        });
    }
};

// التحقق من الصلاحيات (الأدوار المسموح لها)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: '❌ خطأ: ليس لديك صلاحية للوصول إلى هذه الصفحة' 
            });
        }
        next();
    };
};

module.exports = { authenticate, authorize };