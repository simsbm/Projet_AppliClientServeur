// Authentication routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Student routes
router.post('/register/student', authController.registerStudent);
router.post('/login/student', authController.loginStudent);

// Admin routes
router.post('/login/admin', authController.loginAdmin);

// Teacher routes
router.post('/login/teacher', authController.loginTeacher);

module.exports = router;