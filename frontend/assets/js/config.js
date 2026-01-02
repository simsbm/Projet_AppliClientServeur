// Frontend configuration
const API_BASE_URL = 'http://localhost:3000/api';

const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER_STUDENT: `${API_BASE_URL}/auth/register/student`,
    LOGIN_STUDENT: `${API_BASE_URL}/auth/login/student`,
    LOGIN_ADMIN: `${API_BASE_URL}/auth/login/admin`,
    LOGIN_TEACHER: `${API_BASE_URL}/auth/login/teacher`
  },
  
  // Student endpoints
  STUDENT: {
    PROFILE: `${API_BASE_URL}/student/profile`,
    GRADES: `${API_BASE_URL}/student/grades`,
    TIMETABLE: `${API_BASE_URL}/student/timetable`,
    PAYMENTS: `${API_BASE_URL}/student/payments`
  },
  
  // Admin endpoints
  ADMIN: {
    STUDENTS: `${API_BASE_URL}/admin/students`,
    STUDENT_BY_MATRICULE: (matricule) => `${API_BASE_URL}/admin/students/${matricule}`,
    ASSIGN_CLASS: `${API_BASE_URL}/admin/students/assign-class`,
    RECORD_PAYMENT: `${API_BASE_URL}/admin/payments/record`,
    CLASSES: `${API_BASE_URL}/admin/classes`,
    TEACHERS: `${API_BASE_URL}/admin/teachers`,
    ASSIGN_TEACHER_TO_CLASS: `${API_BASE_URL}/admin/teachers/assign-class`,
    SUBJECTS: `${API_BASE_URL}/admin/subjects`,
    CERTIFICATE: (matricule) => `${API_BASE_URL}/admin/documents/certificate/${matricule}`,
    TRANSCRIPT: (matricule) => `${API_BASE_URL}/admin/documents/transcript/${matricule}`
  },
  
  // Teacher endpoints
  TEACHER: {
    PROFILE: `${API_BASE_URL}/teacher/profile`,
    CLASSES: `${API_BASE_URL}/teacher/classes`,
    CLASS_STUDENTS: (classId) => `${API_BASE_URL}/teacher/classes/${classId}/students`,
    SUBJECTS: `${API_BASE_URL}/teacher/subjects`,
    ENTER_GRADE: `${API_BASE_URL}/teacher/grades`,
    STUDENT_GRADES: (studentId) => `${API_BASE_URL}/teacher/students/${studentId}/grades`
  }
};

// Helper function to get authorization header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to make API calls
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeader(),
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Get current user info
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Logout function
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};