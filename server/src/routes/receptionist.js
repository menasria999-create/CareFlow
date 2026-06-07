const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');

// ============================================
// إحصائيات موظف الاستقبال
// ============================================
router.get('/stats', authenticate, authorize('receptionist'), async (req, res) => {
    try {
        // مرضى اليوم (المرضى الذين تم تسجيلهم اليوم)
        const patientsTodayQuery = `
            SELECT COUNT(*) as count 
            FROM users 
            WHERE role = 'patient' 
            AND DATE(created_at) = CURRENT_DATE
        `;
        const patientsToday = await pool.query(patientsTodayQuery);
        
        // مواعيد اليوم
        const appointmentsTodayQuery = `
            SELECT COUNT(*) as count 
            FROM appointments 
            WHERE appointment_date = CURRENT_DATE
        `;
        const appointmentsToday = await pool.query(appointmentsTodayQuery);
        
        // مواعيد في الانتظار (غير مكتملة وغير ملغاة)
        const pendingAppointmentsQuery = `
            SELECT COUNT(*) as count 
            FROM appointments 
            WHERE status IN ('scheduled', 'confirmed') 
            AND appointment_date >= CURRENT_DATE
        `;
        const pendingAppointments = await pool.query(pendingAppointmentsQuery);
        
        res.json({
            patients_today: parseInt(patientsToday.rows[0].count) || 0,
            appointments_today: parseInt(appointmentsToday.rows[0].count) || 0,
            pending_appointments: parseInt(pendingAppointments.rows[0].count) || 0
        });
        
    } catch (error) {
        console.error('Get receptionist stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;