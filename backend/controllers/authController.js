// Authentication controller
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { generateMatricule, isValidEmail } = require('../utils/helpers');

// Student pre-registration
const registerStudent = async (req, res) => {
  const { first_name, last_name, email, phone, date_of_birth, address, password } = req.body;

  try {
    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be provided.' 
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format.' 
      });
    }

    // Check if email already exists
    const [existingStudent] = await db.query(
      'SELECT id FROM students WHERE email = ?',
      [email]
    );

    if (existingStudent.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered.' 
      });
    }

    // Generate unique matricule
    let matricule;
    let isUnique = false;
    
    while (!isUnique) {
      matricule = generateMatricule();
      const [existing] = await db.query(
        'SELECT id FROM students WHERE matricule = ?',
        [matricule]
      );
      if (existing.length === 0) isUnique = true;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert student
    await db.query(
      `INSERT INTO students 
       (matricule, password, first_name, last_name, email, phone, date_of_birth, address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [matricule, hashedPassword, first_name, last_name, email, phone, date_of_birth, address]
    );

    res.status(201).json({
      success: true,
      message: 'Pre-registration successful!',
      data: {
        matricule,
        message: 'Please save your matricule for login.'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
  }
};

// Student login
const loginStudent = async (req, res) => {
  const { matricule, password } = req.body;

  try {
    if (!matricule || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Matricule and password are required.' 
      });
    }

    // Find student
    const [students] = await db.query(
      'SELECT * FROM students WHERE matricule = ?',
      [matricule]
    );

    if (students.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials.' 
      });
    }

    const student = students[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: student.id, 
        matricule: student.matricule,
        role: 'student' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: student.id,
          matricule: student.matricule,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          role: 'student'
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
};

// Admin login
const loginAdmin = async (req, res) => {
  //console.log(req.body);
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required.'
      });
    }
    // Find admin
    const [admins] = await db.query(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );

    if (admins.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials.'
      });
    }

    const admin = admins[0];
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log('Password valid?', isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          role: 'admin'
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
};

// Teacher login
const loginTeacher = async (req, res) => {
  const { identifier, password } = req.body; // Can be email or username

  try {
    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email/username and password are required.' 
      });
    }

    // Find teacher by email or username
    const [teachers] = await db.query(
      'SELECT * FROM teachers WHERE email = ? OR username = ?',
      [identifier, identifier]
    );

    if (teachers.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials.' 
      });
    }

    const teacher = teachers[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, teacher.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: teacher.id, 
        username: teacher.username,
        role: 'teacher' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: teacher.id,
          username: teacher.username,
          full_name: teacher.full_name,
          email: teacher.email,
          role: 'teacher'
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  loginAdmin,
  loginTeacher
};