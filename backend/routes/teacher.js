// Teacher routes
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticateToken } = require('../middleware/auth');
const { requireTeacher } = require('../middleware/roleAuth');

// All teacher routes require authentication and teacher role
router.use(authenticateToken);
router.use(requireTeacher);

// Teacher endpoints
router.get('/profile', teacherController.getProfile);
router.get('/classes', teacherController.getAssignedClasses);
router.get('/classes/:classId/students', teacherController.getClassStudents);
router.get('/subjects', teacherController.getSubjects);
router.post('/grades', teacherController.enterGrade);
router.get('/students/:studentId/grades', teacherController.getStudentGrades);

module.exports = router;