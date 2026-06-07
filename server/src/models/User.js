const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // إنشاء مستخدم جديد
    static async create(userData) {
        const { email, password, full_name, phone, role } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO users (email, password_hash, full_name, phone, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, full_name, phone, role, created_at
        `;
        
        const values = [email, hashedPassword, full_name, phone, role];
        const result = await pool.query(query, values);
        return result.rows[0];
    }
    
    // البحث عن مستخدم بالبريد الإلكتروني
    static async findByEmail(email) {
        const query = `SELECT * FROM users WHERE email = $1 AND is_active = true`;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }
    
    // البحث عن مستخدم بالمعرف
    static async findById(id) {
        const query = `
            SELECT id, email, full_name, phone, role, profile_image, is_active, created_at
            FROM users 
            WHERE id = $1 AND is_active = true
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
    
    // التحقق من كلمة المرور
    static async verifyPassword(email, password) {
        const user = await this.findByEmail(email);
        if (!user) return null;
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return null;
        
        // إزالة password_hash من النتيجة
        const { password_hash, ...userWithoutPassword } = user;
        
        // تحديث آخر تسجيل دخول
        await pool.query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);
        
        return userWithoutPassword;
    }
}

module.exports = User;