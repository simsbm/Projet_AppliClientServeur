// Admin controller - FIXED VERSION
const db = require('../config/database');
const { calculateFinancialStatus, validatePaymentAmount } = require('../utils/helpers');

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const [students] = await db.query(`
      SELECT s.id, s.matricule, s.first_name, s.last_name, s.email, s.phone,
             s.tuition_total, s.tuition_paid, s.financial_status, 
             c.class_name, s.created_at
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY s.created_at DESC
    `);

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch students.' 
    });
  }
};

// Get student by matricule
const getStudentByMatricule = async (req, res) => {
  const { matricule } = req.params;

  try {
    const [students] = await db.query(`
      SELECT s.*, c.class_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.matricule = ?
    `, [matricule]);

    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found.' 
      });
    }

    // Get payment history
    const [payments] = await db.query(`
      SELECT p.*, a.full_name as recorded_by_name
      FROM payments p
      JOIN admins a ON p.recorded_by = a.id
      WHERE p.student_id = ?
      ORDER BY p.payment_date DESC
    `, [students[0].id]);

    res.json({
      success: true,
      data: {
        student: students[0],
        payments
      }
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch student details.' 
    });
  }
};

// Record payment - FIXED VERSION
const recordPayment = async (req, res) => {
  const { matricule, receipt_number, bank_name, amount, payment_date } = req.body;
  const adminId = req.user.id;

  console.log('\n=== PAYMENT RECORDING ATTEMPT ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Admin ID:', adminId);
  console.log('Request Body:', req.body);

  try {
    // Step 1: Validate required fields
    console.log('\n[Step 1] Validating required fields...');
    if (!matricule || !receipt_number || !bank_name || !amount || !payment_date) {
      console.log('✗ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'All payment fields are required.' 
      });
    }
    console.log('✓ All required fields present');

    // Step 2: Convert amount to number and validate
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      console.log('✗ Invalid amount:', amount);
      return res.status(400).json({ 
        success: false, 
        message: 'Payment amount must be a valid positive number.' 
      });
    }
    console.log('✓ Payment amount valid:', paymentAmount);

    // Step 3: Find student
    console.log('\n[Step 2] Finding student with matricule:', matricule);
    const [students] = await db.query(
      'SELECT * FROM students WHERE matricule = ?',
      [matricule]
    );

    if (students.length === 0) {
      console.log('✗ Student not found');
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found.' 
      });
    }

    const student = students[0];
    console.log('✓ Student found:', {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      current_paid: student.tuition_paid,
      total: student.tuition_total
    });

    // Step 4: Convert existing amounts to numbers for calculation
    const currentPaid = parseFloat(student.tuition_paid) || 0;
    const totalTuition = parseFloat(student.tuition_total) || 500000;
    const remaining = totalTuition - currentPaid;

    console.log('\n[Step 3] Financial calculation:');
    console.log('Current paid (parsed):', currentPaid);
    console.log('Total tuition:', totalTuition);
    console.log('Remaining balance:', remaining);
    console.log('New payment:', paymentAmount);

    // Step 5: Validate payment amount
    const validation = validatePaymentAmount(paymentAmount, totalTuition, currentPaid);

    if (!validation.valid) {
      console.log('✗ Payment validation failed:', validation.message);
      return res.status(400).json({ 
        success: false, 
        message: validation.message 
      });
    }
    console.log('✓ Payment amount valid');

    // Step 6: Check if receipt number already exists
    console.log('\n[Step 4] Checking receipt number uniqueness...');
    const [existingReceipt] = await db.query(
      'SELECT id FROM payments WHERE receipt_number = ?',
      [receipt_number]
    );

    if (existingReceipt.length > 0) {
      console.log('✗ Receipt number already exists:', receipt_number);
      return res.status(400).json({ 
        success: false, 
        message: 'Receipt number already exists.' 
      });
    }
    console.log('✓ Receipt number is unique');

    // Step 7: Calculate new totals
    const newTotalPaid = currentPaid + paymentAmount;
    const newRemaining = totalTuition - newTotalPaid;
    const newFinancialStatus = calculateFinancialStatus(totalTuition, newTotalPaid);

    console.log('\n[Step 5] New calculations:');
    console.log('New total paid:', newTotalPaid);
    console.log('New remaining:', newRemaining);
    console.log('Old status:', student.financial_status);
    console.log('New status:', newFinancialStatus);

    // Step 8: Start transaction
    console.log('\n[Step 6] Starting database transaction...');
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      console.log('✓ Transaction started');

      // Step 9: Insert payment record
      console.log('\n[Step 7] Inserting payment record...');
      const [insertResult] = await connection.query(
        `INSERT INTO payments (student_id, receipt_number, bank_name, amount, payment_date, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [student.id, receipt_number, bank_name, paymentAmount, payment_date, adminId]
      );
      console.log('✓ Payment record inserted, ID:', insertResult.insertId);

      // Step 10: Update student financial status with DECIMAL conversion
      console.log('\n[Step 8] Updating student financial status...');
      console.log('UPDATE query values:', {
        tuition_paid: newTotalPaid,
        financial_status: newFinancialStatus,
        student_id: student.id
      });

      const [updateResult] = await connection.query(
        `UPDATE students 
         SET tuition_paid = ?, financial_status = ?
         WHERE id = ?`,
        [newTotalPaid.toFixed(2), newFinancialStatus, student.id]
      );
      
      console.log('✓ Student record updated, affected rows:', updateResult.affectedRows);

      // Step 11: Verify the update
      console.log('\n[Step 9] Verifying update...');
      const [verifyStudent] = await connection.query(
        'SELECT tuition_paid, financial_status FROM students WHERE id = ?',
        [student.id]
      );
      console.log('Verified data:', verifyStudent[0]);

      // Step 12: Commit transaction
      console.log('\n[Step 10] Committing transaction...');
      await connection.commit();
      console.log('✓ Transaction committed successfully');

      console.log('\n=== PAYMENT RECORDED SUCCESSFULLY ===\n');

      res.json({
        success: true,
        message: 'Payment recorded successfully',
        data: {
          payment_id: insertResult.insertId,
          total_paid: parseFloat(newTotalPaid.toFixed(2)),
          remaining: parseFloat(newRemaining.toFixed(2)),
          financial_status: newFinancialStatus,
          old_paid: parseFloat(currentPaid.toFixed(2)),
          payment_amount: parseFloat(paymentAmount.toFixed(2))
        }
      });

    } catch (error) {
      console.log('\n✗ TRANSACTION ERROR - Rolling back...');
      console.error('Transaction error:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.log('\n=== PAYMENT RECORDING FAILED ===');
    console.error('Error:', error);
    console.log('===================================\n');
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to record payment.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all classes
const getAllClasses = async (req, res) => {
  try {
    const [classes] = await db.query(`
      SELECT c.*, 
             COUNT(DISTINCT cs.student_id) as student_count,
             COUNT(DISTINCT tc.teacher_id) as teacher_count
      FROM classes c
      LEFT JOIN class_students cs ON c.id = cs.class_id
      LEFT JOIN teacher_classes tc ON c.id = tc.class_id
      GROUP BY c.id
      ORDER BY c.class_name
    `);

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch classes.' 
    });
  }
};

// Assign student to class
const assignStudentToClass = async (req, res) => {
  const { matricule, class_id } = req.body;

  try {
    if (!matricule || !class_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Matricule and class ID are required.' 
      });
    }

    // Find student
    const [students] = await db.query(
      'SELECT * FROM students WHERE matricule = ?',
      [matricule]
    );

    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found.' 
      });
    }

    const student = students[0];
    const currentPaid = parseFloat(student.tuition_paid) || 0;

    // Check if student has made at least one payment
    if (currentPaid === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student must make at least one payment before class assignment.' 
      });
    }

    // Check if class exists
    const [classes] = await db.query(
      'SELECT * FROM classes WHERE id = ?',
      [class_id]
    );

    if (classes.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found.' 
      });
    }

    // Check class capacity
    const [studentCount] = await db.query(
      'SELECT COUNT(*) as count FROM class_students WHERE class_id = ?',
      [class_id]
    );

    if (studentCount[0].count >= classes[0].capacity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Class is at full capacity.' 
      });
    }

    // Update student's class
    await db.query(
      'UPDATE students SET class_id = ? WHERE id = ?',
      [class_id, student.id]
    );

    // Add to class_students table
    await db.query(
      'INSERT INTO class_students (class_id, student_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE class_id = class_id',
      [class_id, student.id]
    );

    res.json({
      success: true,
      message: 'Student assigned to class successfully',
      data: {
        student: `${student.first_name} ${student.last_name}`,
        class: classes[0].class_name
      }
    });

  } catch (error) {
    console.error('Error assigning student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign student to class.' 
    });
  }
};

// Generate school certificate - AVEC PDF
const generateCertificate = async (req, res) => {
  const { matricule } = req.params;

  try {
    // Find student
    const [students] = await db.query(`
      SELECT s.*, c.class_name, c.level
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.matricule = ?
    `, [matricule]);

    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found.' 
      });
    }

    const student = students[0];

    // Check if financial status is SOLDÉ or SOLDE
    if (student.financial_status !== 'SOLDÉ' && student.financial_status !== 'SOLDE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Certificate can only be generated for students with SOLDÉ/SOLDE status.' 
      });
    }

    // Générer le PDF
    const { generateCertificate: generateCertPDF } = require('../utils/pdfGenerator');
    
    // Définir les headers pour le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=certificat_${matricule}.pdf`);
    
    // Générer et envoyer le PDF directement au navigateur
    await generateCertPDF(student, res);

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate certificate.' 
    });
  }
};

// Generate transcript - AVEC PDF
const generateTranscript = async (req, res) => {
  const { matricule } = req.params;

  try {
    // Find student
    const [students] = await db.query(`
      SELECT s.*, c.class_name, c.level
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.matricule = ?
    `, [matricule]);

    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found.' 
      });
    }

    const student = students[0];

    // Check if financial status is SOLDÉ or SOLDE
    if (student.financial_status !== 'SOLDÉ' && student.financial_status !== 'SOLDE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Transcript can only be generated for students with SOLDÉ/SOLDE status.' 
      });
    }

    // Get student grades
    const [grades] = await db.query(`
      SELECT g.*, s.subject_name, s.subject_code, t.full_name as teacher_name
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      JOIN teachers t ON g.teacher_id = t.id
      WHERE g.student_id = ?
      ORDER BY g.academic_year DESC, g.semester DESC
    `, [student.id]);

    // Générer le PDF
    const { generateTranscript: generateTransPDF } = require('../utils/pdfGenerator');
    
    // Définir les headers pour le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=releve_notes_${matricule}.pdf`);
    
    // Générer et envoyer le PDF directement au navigateur
    await generateTransPDF(student, grades, res);

  } catch (error) {
    console.error('Error generating transcript:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate transcript.' 
    });
  }
};

const getAllTeachers = async (req, res) => {
    try {
        const [teachers] = await db.query(`
            SELECT t.id, t.full_name, t.email, t.phone, t.specialization, COUNT(tc.class_id) as class_count
            FROM teachers t
            LEFT JOIN teacher_classes tc ON t.id = tc.teacher_id
            GROUP BY t.id
            ORDER BY t.full_name
        `);
        res.json({ success: true, data: teachers });
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch teachers.' });
    }
};

const getAllSubjects = async (req, res) => {
    try {
        const [subjects] = await db.query('SELECT * FROM subjects ORDER BY subject_name');
        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subjects.' });
    }
};

const assignTeacherToClass = async (req, res) => {
    const { teacher_id, class_id, subject_id } = req.body;

    try {
        if (!teacher_id || !class_id || !subject_id) {
            return res.status(400).json({ success: false, message: 'Teacher, class, and subject are required.' });
        }

        // Check for duplicates
        const [existing] = await db.query(
            'SELECT id FROM teacher_classes WHERE teacher_id = ? AND class_id = ? AND subject_id = ?',
            [teacher_id, class_id, subject_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'This teacher is already assigned to this class and subject.' });
        }

        await db.query(
            'INSERT INTO teacher_classes (teacher_id, class_id, subject_id) VALUES (?, ?, ?)',
            [teacher_id, class_id, subject_id]
        );

        res.json({ success: true, message: 'Teacher assigned to class successfully.' });

    } catch (error) {
        console.error('Error assigning teacher to class:', error);
        res.status(500).json({ success: false, message: 'Failed to assign teacher to class.' });
    }
};

module.exports = {
  getAllStudents,
  getStudentByMatricule,
  recordPayment,
  getAllClasses,
  assignStudentToClass,
  generateCertificate,
  generateTranscript,
  getAllTeachers,
  getAllSubjects,
  assignTeacherToClass
};