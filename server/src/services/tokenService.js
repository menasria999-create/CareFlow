const crypto = require('crypto');

/**
 * إنشاء توكن عشوائي آمن لإعادة تعيين كلمة المرور
 * @returns {string} توكن عشوائي بطول 64 حرفًا (32 بايت)
 */
function generateResetToken() {
    // randomBytes يولد 32 بايت (256 بت) وهو آمن جداً
    // toString('hex') يحولها إلى نص مكون من 64 حرفاً
    return crypto.randomBytes(32).toString('hex');
}

/**
 * التحقق من صلاحية التوكن
 * @param {Date} expiresAt - تاريخ انتهاء الصلاحية
 * @returns {boolean} - true إذا كان التوكن لا يزال صالحاً
 */
function isTokenValid(expiresAt) {
    if (!expiresAt) return false;
    // مقارنة الوقت الحالي مع وقت انتهاء الصلاحية
    return new Date() < new Date(expiresAt);
}

module.exports = { generateResetToken, isTokenValid };