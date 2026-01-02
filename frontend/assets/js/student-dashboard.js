// Student Dashboard JavaScript

// Check authentication on page load
if (!checkAuth('student')) {
  // Redirect handled by checkAuth
}

// Display user info
displayUserInfo();

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Load initial section
  loadProfile();
  
  // Setup navigation
  setupNavigation();
});

// Setup navigation between sections
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons and sections
      navButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Show corresponding section
      const sectionName = btn.dataset.section;
      document.getElementById(`${sectionName}-section`).classList.add('active');
      
      // Load section data
      switch(sectionName) {
        case 'profile':
          loadProfile();
          break;
        case 'grades':
          loadGrades();
          break;
        case 'timetable':
          loadTimetable();
          break;
        case 'payments':
          loadPayments();
          break;
      }
    });
  });
}

// Load student profile
async function loadProfile() {
  const content = document.getElementById('profileContent');
  showLoading('profileContent');
  
  try {
    const data = await apiCall(API_ENDPOINTS.STUDENT.PROFILE);
    const student = data.data;
    
    const remaining = student.tuition_total - student.tuition_paid;
    const statusClass = student.financial_status === 'SOLDÉ' ? 'solde' : 
                       student.financial_status === 'PAYÉ PARTIELLEMENT' ? 'partial' : 'non-solde';
    
    content.innerHTML = `
      <div class="info-grid">
        <div class="info-item">
          <label>Matricule</label>
          <div class="value">${student.matricule}</div>
        </div>
        <div class="info-item">
          <label>Full Name</label>
          <div class="value">${student.first_name} ${student.last_name}</div>
        </div>
        <div class="info-item">
          <label>Email</label>
          <div class="value">${student.email}</div>
        </div>
        <div class="info-item">
          <label>Phone</label>
          <div class="value">${student.phone || 'N/A'}</div>
        </div>
        <div class="info-item">
          <label>Date of Birth</label>
          <div class="value">${formatDate(student.date_of_birth)}</div>
        </div>
        <div class="info-item">
          <label>Class</label>
          <div class="value">${student.class_name || 'Not assigned'}</div>
        </div>
      </div>
      
      <div class="financial-status ${statusClass}" style="margin-top: 20px;">
        <h4>Financial Status: <span class="badge ${getFinancialStatusClass(student.financial_status)}">${student.financial_status}</span></h4>
        <div class="amount-display">
          <div>
            <label>Total Tuition:</label>
            <span>${formatCurrency(student.tuition_total)}</span>
          </div>
          <div>
            <label>Amount Paid:</label>
            <span>${formatCurrency(student.tuition_paid)}</span>
          </div>
          <div>
            <label>Remaining:</label>
            <span>${formatCurrency(remaining)}</span>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
}

// Load student grades
async function loadGrades() {
  const content = document.getElementById('gradesContent');
  showLoading('gradesContent');
  
  try {
    const data = await apiCall(API_ENDPOINTS.STUDENT.GRADES);
    const grades = data.data;
    
    if (grades.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3>No grades yet</h3>
          <p>Your grades will appear here once your teachers enter them.</p>
        </div>
      `;
      return;
    }
    
    // Group grades by academic year and semester
    const grouped = {};
    grades.forEach(grade => {
      const key = `${grade.academic_year} - ${grade.semester}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(grade);
    });
    
    let html = '';
    Object.keys(grouped).forEach(period => {
      html += `
        <div style="margin-bottom: 30px;">
          <h4 style="color: var(--primary-color); margin-bottom: 15px;">${period}</h4>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>Credits</th>
                <th>Exam Type</th>
                <th>Grade</th>
                <th>Teacher</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${grouped[period].map(grade => `
                <tr>
                  <td>${grade.subject_name}</td>
                  <td>${grade.subject_code}</td>
                  <td>${grade.credits}</td>
                  <td><span class="badge badge-${grade.exam_type.toLowerCase()}">${grade.exam_type}</span></td>
                  <td><strong>${grade.grade}</strong></td>
                  <td>${grade.teacher_name}</td>
                  <td>${formatDate(grade.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    });
    
    content.innerHTML = html;
  } catch (error) {
    content.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
}

// Load timetable
async function loadTimetable() {
  const content = document.getElementById('timetableContent');
  showLoading('timetableContent');
  
  try {
    const data = await apiCall(API_ENDPOINTS.STUDENT.TIMETABLE);
    const timetable = data.data;
    
    if (timetable.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <h3>No timetable available</h3>
          <p>${data.message || 'You have not been assigned to a class yet.'}</p>
        </div>
      `;
      return;
    }
    
    // Group by day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = {};
    days.forEach(day => grouped[day] = []);
    
    timetable.forEach(slot => {
      grouped[slot.day_of_week].push(slot);
    });
    
    let html = '<div class="timetable-grid">';
    days.forEach(day => {
      if (grouped[day].length > 0) {
        html += `
          <div class="timetable-day">
            <div class="day-header">${day}</div>
            ${grouped[day].map(slot => `
              <div class="timetable-slot">
                <div class="slot-time">${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}</div>
                <div class="slot-subject">${slot.subject_name}</div>
                <div class="slot-details">
                  ${slot.teacher_name} • ${slot.room || 'TBA'}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    });
    html += '</div>';
    
    content.innerHTML = html;
  } catch (error) {
    content.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
}

// Load payment history
async function loadPayments() {
  const content = document.getElementById('paymentsContent');
  showLoading('paymentsContent');
  
  try {
    const data = await apiCall(API_ENDPOINTS.STUDENT.PAYMENTS);
    const payments = data.data;
    
    if (payments.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💳</div>
          <h3>No payments recorded</h3>
          <p>Your payment history will appear here once payments are recorded by the administration.</p>
        </div>
      `;
      return;
    }
    
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    content.innerHTML = `
      <div class="alert alert-info" style="margin-bottom: 20px;">
        Total Amount Paid: <strong>${formatCurrency(totalPaid)}</strong>
      </div>
      <table>
        <thead>
          <tr>
            <th>Receipt Number</th>
            <th>Bank</th>
            <th>Amount</th>
            <th>Payment Date</th>
            <th>Recorded By</th>
            <th>Recorded On</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map(payment => `
            <tr>
              <td><strong>${payment.receipt_number}</strong></td>
              <td>${payment.bank_name}</td>
              <td><strong>${formatCurrency(payment.amount)}</strong></td>
              <td>${formatDate(payment.payment_date)}</td>
              <td>${payment.recorded_by}</td>
              <td>${formatDate(payment.created_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    content.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
}