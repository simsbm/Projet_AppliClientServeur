// Teacher controller
const db = require('../config/database');

// Get teacher profile
const getProfile = async (req, res) => {
  const teacherId = req.user.id;

  try {
    const [teachers] = await db.query(
      'SELECT id, username, email, full_name, phone, specialization FROM teachers WHERE id = ?',
      [teacherId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found.' 
      });
    }

    res.json({
      success: true,
      data: teachers[0]
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile.' 
    });
  }
};

// Get assigned classes
const getAssignedClasses = async (req, res) => {
  const teacherId = req.user.id;

  try {
    const [classes] = await db.query(`
      SELECT DISTINCT c.id, c.class_name, c.level, c.academic_year,
             COUNT(DISTINCT cs.student_id) as student_count
      FROM teacher_classes tc
      JOIN classes c ON tc.class_id = c.id
      LEFT JOIN class_students cs ON c.id = cs.class_id
      WHERE tc.teacher_id = ?
      GROUP BY c.id, c.class_name, c.level, c.academic_year
      ORDER BY c.class_name
    `, [teacherId]);

    res.json({
      success: true,
      data: classes
    });

  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch assigned classes.' 
    });
  }
};

// Get students in a class
const getClassStudents = async (req, res) => {
  const teacherId = req.user.id;
  const { classId } = req.params;

  try {
    // Verify teacher is assigned to this class
    const [assignment] = await db.query(
      'SELECT id FROM teacher_classes WHERE teacher_id = ? AND class_id = ?',
      [teacherId, classId]
    );

    if (assignment.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You are not assigned to this class.' 
      });
    }

    // Get students who have paid (financial_status != 'NON SOLDÉ')
    const [students] = await db.query(`
      SELECT s.id, s.matricule, s.first_name, s.last_name, s.email, 
             s.financial_status
      FROM students s
      JOIN class_students cs ON s.id = cs.student_id
      WHERE cs.class_id = ? AND s.tuition_paid > 0
      ORDER BY s.last_name, s.first_name
    `, [classId]);

    res.json({
      success: true,
      data: students
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch class students.' 
    });
  }
};

// Get subjects taught by teacher
const getSubjects = async (req, res) => {
  const teacherId = req.user.id;

  try {
    const [subjects] = await db.query(`
      SELECT DISTINCT s.id, s.subject_name, s.subject_code, s.credits
      FROM teacher_classes tc
      JOIN subjects s ON tc.subject_id = s.id
      WHERE tc.teacher_id = ?
      ORDER BY s.subject_name
    `, [teacherId]);

    res.json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subjects.' 
    });
  }
};

// Enter/update grade
const enterGrade = async (req, res) => {
  const teacherId = req.user.id;
  const { student_id, subject_id, grade, exam_type, academic_year, semester } = req.body;

  try {
    // Validate required fields
    if (!student_id || !subject_id || !grade || !exam_type || !academic_year || !semester) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required.' 
      });
    }

    // Validate grade range (0-100)
    if (grade < 0 || grade > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Grade must be between 0 and 100.' 
      });
    }

    // Verify teacher teaches this subject
    const [teacherSubjects] = await db.query(
      'SELECT id FROM teacher_classes WHERE teacher_id = ? AND subject_id = ?',
      [teacherId, subject_id]
    );

    if (teacherSubjects.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to grade this subject.' 
      });
    }

    // Verify student exists and has paid
    const [students] = await db.query(
      'SELECT id, tuition_paid FROM students WHERE id = ?',
      [student_id]
    );

    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found.' 
      });
    }

    if (students[0].tuition_paid === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot enter grades for students who have not paid.' 
      });
    }

    // Insert grade
    await db.query(`
      INSERT INTO grades (student_id, subject_id, teacher_id, grade, exam_type, academic_year, semester)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [student_id, subject_id, teacherId, grade, exam_type, academic_year, semester]);

    res.json({
      success: true,
      message: 'Grade entered successfully'
    });

  } catch (error) {
    console.error('Error entering grade:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to enter grade.' 
    });
  }
};

// Get grades for a student in teacher's subjects
const getStudentGrades = async (req, res) => {
  const teacherId = req.user.id;
  const { studentId } = req.params;

  try {
    const [grades] = await db.query(`
      SELECT g.id, g.grade, g.exam_type, g.academic_year, g.semester, g.created_at,
             s.subject_name, s.subject_code
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      WHERE g.student_id = ? AND g.teacher_id = ?
      ORDER BY g.academic_year DESC, g.semester DESC, s.subject_name
    `, [studentId, teacherId]);

    res.json({
      success: true,
      data: grades
    });

  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch student grades.' 
    });
  }
};

module.exports = {
  getProfile,
  getAssignedClasses,
  getClassStudents,
  getSubjects,
  enterGrade,
  getStudentGrades
};