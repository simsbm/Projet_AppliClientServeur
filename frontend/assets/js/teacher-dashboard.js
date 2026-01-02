// Teacher Dashboard JavaScript

// Check authentication on page load
if (!checkAuth('teacher')) {
  // Redirect handled by checkAuth
}

// Display user info
displayUserInfo();

// Global variables
let currentClassId = null;
let allStudents = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadClasses();
  loadSubjects();
  setupNavigation();
  setupForms();
});

// Setup navigation
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      
      btn.classList.add('active');
      const sectionName = btn.dataset.section;
      document.getElementById(`${sectionName}-section`).classList.add('active');
      
      switch(sectionName) {
        case 'classes':
          loadClasses();
          break;
        case 'subjects':
          loadSubjects();
          break;
      }
    });
  });
}

// Setup forms
function setupForms() {
  // Grade form
  document.getElementById('gradeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitGrade();
  });
}

// Load teacher's classes
async function loadClasses() {
  const content = document.getElementById('classesContent');
  showLoading('classesContent');
  
  try {
    const data = await apiCall(API_ENDPOINTS.TEACHER.CLASSES);
    const classes = data.data;
    
    if (classes.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏫</div>
          <h3>No classes assigned yet</h3>
          <p>You will see your assigned classes here once the administration assigns them to you.</p>
        </div>
      `;
      return;
    }
    
    content.innerHTML = `
      <div class="alert alert-info" style="margin-bottom: 20px;">
        You are teaching <strong>${classes.length}</strong> class${classes.length > 1 ? 'es' : ''}
      </div>
      <div class="grid grid-2">
        ${classes.map(c => `
          <div class="card" style="cursor: pointer; transition: transform 0.3s;" onclick="viewClassStudents(${c.id}, '${c.class_name}')">
            <h3 style="color: var(--primary-color); margin-bottom: 10px;">${c.class_name}</h3>
            <div style="color: #7f8c8d; font-size: 14px;">
              <p>Level: ${c.level}</p>
              <p>Academic Year: ${c.academic_year}</p>
              <p>Students: <strong>${c.student_count}</strong></p>
            </div>
            <button class="btn btn-primary" style="margin-top: 15px; width: 100%;">View Students</button>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
}

// View students in a class
async function viewClassStudents(classId, className) {
  const modal = document.getElementById('studentsModal');
  const content = document.getElementById('studentsModalContent');
  
  modal.classList.add('show');
  content.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
  
  currentClassId = classId;
  
  try {
    const data = await apiCall(API_ENDPOINTS.TEACHER.CLASS_STUDENTS(classId));
    const students = data.data;
    
    allStudents = students; // Store for grade form
    
    // Update student dropdown in grade form
    const studentSelect = document.getElementById('student_id');
    studentSelect.innerHTML = '<option value="">Select a student</option>' +
      students.map(s => `<option value="${s.id}">${s.first_name} ${s.last_name} (${s.matricule})</option>`).join('');
    
    if (students.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>No students in this class</h3>
          <p>Students who have paid will appear here.</p>
        </div>
      `;
      return;
    }
    
    content.innerHTML = `
      <h4 style="margin-bottom: 15px;">Class: ${className}</h4>
      <p style="color: #7f8c8d; margin-bottom: 20px;">Total Students: ${students.length}</p>
      <table>
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Name</th>
            <th>Email</th>
            <th>Financial Status</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td><strong>${s.matricule}</strong></td>
              <td>${s.first_name} ${s.last_name}</td>
              <td>${s.email}</td>
              <td><span class="badge ${getFinancialStatusClass(s.financial_status)}">${s.financial_status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    content.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
}

// Close modal
function closeModal() {
  document.getElementById('studentsModal').classList.remove('show');
}

// Load subjects
async function loadSubjects() {
  const content = document.getElementById('subjectsContent');
  showLoading('subjectsContent');
  
  try {
    const data = await apiCall(API_ENDPOINTS.TEACHER.SUBJECTS);
    const subjects = data.data;
    
    // Update subject dropdown in grade form
    const subjectSelect = document.getElementById('subject_id');
    subjectSelect.innerHTML = '<option value="">Select a subject</option>' +
      subjects.map(s => `<option value="${s.id}">${s.subject_name} (${s.subject_code})</option>`).join('');
    
    if (subjects.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📖</div>
          <h3>No subjects assigned</h3>
          <p>Your assigned subjects will appear here.</p>
        </div>
      `;
      return;
    }
    
    content.innerHTML = `
      <div class="grid grid-3">
        ${subjects.map(s => `
          <div class="card">
            <h3 style="color: var(--primary-color); margin-bottom: 10px;">${s.subject_name}</h3>
            <p style="color: #7f8c8d; font-size: 14px;">
              Code: <strong>${s.subject_code}</strong><br>
              Credits: <strong>${s.credits}</strong>
            </p>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
}

// Submit grade
async function submitGrade() {
  const alertDiv = document.getElementById('alert');
  alertDiv.classList.remove('show');
  
  const gradeData = {
    student_id: parseInt(document.getElementById('student_id').value),
    subject_id: parseInt(document.getElementById('subject_id').value),
    grade: parseFloat(document.getElementById('grade').value),
    exam_type: document.getElementById('exam_type').value,
    academic_year: document.getElementById('academic_year').value,
    semester: document.getElementById('semester').value
  };
  
  // Validation
  if (!gradeData.student_id || !gradeData.subject_id) {
    showAlert('Please select both a student and a subject', 'error');
    return;
  }
  
  if (gradeData.grade < 0 || gradeData.grade > 100) {
    showAlert('Grade must be between 0 and 100', 'error');
    return;
  }
  
  try {
    await apiCall(API_ENDPOINTS.TEACHER.ENTER_GRADE, {
      method: 'POST',
      body: JSON.stringify(gradeData)
    });
    
    showAlert('Grade submitted successfully!', 'success');
    document.getElementById('gradeForm').reset();
    
    // Reset student dropdown
    document.getElementById('student_id').innerHTML = '<option value="">Select a class first...</option>';
    
  } catch (error) {
    showAlert(error.message, 'error');
  }
}