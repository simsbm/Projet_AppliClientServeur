// Student controller
const db = require('../config/database');

// Get student profile
const getProfile = async (req, res) => {
  const studentId = req.user.id;

  try {
    const [students] = await db.query(`
      SELECT s.id, s.matricule, s.first_name, s.last_name, s.email, s.phone,
             s.date_of_birth, s.address, s.tuition_total, s.tuition_paid, 
             s.financial_status, c.class_name, c.level
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `, [studentId]);

    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found.' 
      });
    }

    res.json({
      success: true,
      data: students[0]
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile.' 
    });
  }
};

// Get student grades
const getGrades = async (req, res) => {
  const studentId = req.user.id;

  try {
    const [grades] = await db.query(`
      SELECT g.grade, g.exam_type, g.academic_year, g.semester, g.created_at,
             s.subject_name, s.subject_code, s.credits,
             t.full_name as teacher_name
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      JOIN teachers t ON g.teacher_id = t.id
      WHERE g.student_id = ?
      ORDER BY g.academic_year DESC, g.semester DESC, s.subject_name
    `, [studentId]);

    res.json({
      success: true,
      data: grades
    });

  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch grades.' 
    });
  }
};

// Get student timetable
const getTimetable = async (req, res) => {
  const studentId = req.user.id;

  try {
    // Get student's class
    const [students] = await db.query(
      'SELECT class_id FROM students WHERE id = ?',
      [studentId]
    );

    if (students.length === 0 || !students[0].class_id) {
      return res.json({
        success: true,
        message: 'No class assigned yet.',
        data: []
      });
    }

    const classId = students[0].class_id;

    // Get timetable for the class
    const [timetable] = await db.query(`
      SELECT t.day_of_week, t.start_time, t.end_time, t.room,
             s.subject_name, s.subject_code,
             te.full_name as teacher_name
      FROM timetables t
      JOIN subjects s ON t.subject_id = s.id
      JOIN teachers te ON t.teacher_id = te.id
      WHERE t.class_id = ?
      ORDER BY 
        FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
        t.start_time
    `, [classId]);

    res.json({
      success: true,
      data: timetable
    });

  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch timetable.' 
    });
  }
};

// Get payment history
const getPaymentHistory = async (req, res) => {
  const studentId = req.user.id;

  try {
    const [payments] = await db.query(`
      SELECT p.receipt_number, p.bank_name, p.amount, p.payment_date, p.created_at,
             a.full_name as recorded_by
      FROM payments p
      JOIN admins a ON p.recorded_by = a.id
      WHERE p.student_id = ?
      ORDER BY p.payment_date DESC
    `, [studentId]);

    res.json({
      success: true,
      data: payments
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment history.' 
    });
  }
};

module.exports = {
  getProfile,
  getGrades,
  getTimetable,
  getPaymentHistory
};