// Admin routes
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleAuth');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Student management
router.get('/students', adminController.getAllStudents);
router.get('/students/:matricule', adminController.getStudentByMatricule);
router.post('/students/assign-class', adminController.assignStudentToClass);

// Payment management
router.post('/payments/record', adminController.recordPayment);

// Class management
router.get('/classes', adminController.getAllClasses);

// Teacher management
router.get('/teachers', adminController.getAllTeachers);
router.post('/teachers/assign-class', adminController.assignTeacherToClass);

// Subject management
router.get('/subjects', adminController.getAllSubjects);

// Document generation
router.get('/documents/certificate/:matricule', adminController.generateCertificate);
router.get('/documents/transcript/:matricule', adminController.generateTranscript);

module.exports = router;