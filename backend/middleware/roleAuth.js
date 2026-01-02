// Role-based authorization middleware

// Require specific role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Specific role middleware
const requireAdmin = requireRole('admin');
const requireTeacher = requireRole('teacher');
const requireStudent = requireRole('student');
const requireAdminOrTeacher = requireRole('admin', 'teacher');

module.exports = {
  requireRole,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requireAdminOrTeacher
};