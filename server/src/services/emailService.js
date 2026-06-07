const nodemailer = require('nodemailer');

// إعداد الناقل (Transporter) للبريد
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * إرسال رابط إعادة تعيين كلمة المرور
 * @param {string} to - البريد الإلكتروني للمستلم
 * @param {string} resetLink - رابط إعادة التعيين
 */
async function sendPasswordResetEmail(to, resetLink) {
    const mailOptions = {
        from: `"CareFlow Support" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: '🔐 إعادة تعيين كلمة المرور - CareFlow',
        html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #1976d2; text-align: center;">🏥 CareFlow</h2>
                <h3 style="text-align: center;">إعادة تعيين كلمة المرور</h3>
                <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
                <p>لإعادة تعيين كلمة المرور، يرجى النقر على الرابط أدناه:</p>
                <div style="text-align: center; margin: 25px 0;">
                    <a href="${resetLink}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                        إعادة تعيين كلمة المرور
                    </a>
                </div>
                <p>هذا الرابط صالح لمدة <strong>ساعة واحدة فقط</strong>.</p>
                <hr style="margin: 20px 0;">
                <p style="color: #777; font-size: 12px; text-align: center;">
                    إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.\nلن تتغير كلمة المرور الخاصة بك.
                </p>
                <p style="color: #777; font-size: 12px; text-align: center;">© 2025 CareFlow - المنصة الرقمية لإدارة المرضى</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Email error:', error);
        return false;
    }
}

module.exports = { sendPasswordResetEmail };