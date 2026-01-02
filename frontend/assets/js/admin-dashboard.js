// Admin Dashboard JavaScript - Complete Implementation

// Check authentication on page load
if (!checkAuth('admin')) {
  // Redirect handled by checkAuth
}

// Display user info
displayUserInfo();

// Global variables
let currentStudents = [];
let currentClasses = [];
let currentTeachers = [];
let currentSubjects = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadStudents();
  setupNavigation();
  setupForms();
  loadInitialData();
});

// Load initial data
async function loadInitialData() {
  await loadClasses();
  await loadTeachers();
  await loadSubjects();
}

// Setup navigation between sections
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
        case 'students':
          loadStudents();
          break;
        case 'classes':
          loadClasses();
          break;
        case 'teachers':
          loadTeachers();
          break;
      }
    });
  });
}

// Setup forms
function setupForms() {
  // Payment form
  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) {
    paymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await recordPayment();
    });
  }
  
  // Assign class form
  const assignForm = document.getElementById('assignClassForm');
  if (assignForm) {
    assignForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await assignClass();
    });
  }

  // Assign teacher form
  const assignTeacherForm = document.getElementById('assignTeacherForm');
  if (assignTeacherForm) {
    assignTeacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await assignTeacherToClass();
    });
  }
}

// Load all students
async function loadStudents() {
  const content = document.getElementById('studentsContent');
  showLoading('studentsContent');
  
  try {
    const data = await apiCall(API_ENDPOINTS.ADMIN.STUDENTS);
    currentStudents = data.data;
    
    if (currentStudents.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👨‍🎓</div>
          <h3>No students registered yet</h3>
          <p>Students will appear here after they complete pre-registration.</p>
        </div>
      `;
      return;
    }
    
    // Statistics - Calculate based on ACTUAL payment amounts (most reliable)
    let soldeCount = 0;
    let partialCount = 0;
    let nonSoldeCount = 0;
    let totalPaidSum = 0;
    
    currentStudents.forEach(student => {
      const tuitionTotal = parseFloat(student.tuition_total) || 500000;
      const tuitionPaid = parseFloat(student.tuition_paid) || 0;
      
      totalPaidSum += tuitionPaid;
      
      // Calculate status based on payment amount (more reliable than text comparison)
      if (tuitionPaid === 0) {
        nonSoldeCount++;
      } else if (tuitionPaid >= tuitionTotal) {
        soldeCount++;
      } else {
        partialCount++;
      }
    });
    
    console.log('Statistics calculated:', {
      total: currentStudents.length,
      solde: soldeCount,
      partial: partialCount,
      nonSolde: nonSoldeCount,
      totalPaid: totalPaidSum,
      students: currentStudents.map(s => ({
        matricule: s.matricule,
        paid: s.tuition_paid,
        status: s.financial_status
      }))
    });
    
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="flex: 1;">
          <div class="grid grid-4" style="margin-bottom: 0;">
            <div class="stat-box" style="background: linear-gradient(135deg, #3498db, #5dade2);">
              <h3>${currentStudents.length}</h3>
              <p>Total Students</p>
            </div>
            <div class="stat-box" style="background: linear-gradient(135deg, #27ae60, #52c77c);">
              <h3>${soldeCount}</h3>
              <p>Fully Paid (SOLDÉ)</p>
            </div>
            <div class="stat-box" style="background: linear-gradient(135deg, #f39c12, #f5b041);">
              <h3>${partialCount}</h3>
              <p>Partially Paid</p>
            </div>
            <div class="stat-box" style="background: linear-gradient(135deg, #e74c3c, #ec7063);">
              <h3>${nonSoldeCount}</h3>
              <p>Not Paid</p>
            </div>
          </div>
        </div>
        <button onclick="loadStudents()" class="btn btn-primary" style="margin-left: 20px; white-space: nowrap;">
          🔄 Refresh Data
        </button>
      </div>
      
      <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center;">
        <input type="text" id="searchStudent" placeholder="Search by name, matricule, or email..." 
               style="flex: 1; padding: 10px; border: 1px solid #bdc3c7; border-radius: 6px;">
        <button onclick="filterStudents()" class="btn btn-primary">Search</button>
        <button onclick="loadStudents()" class="btn btn-secondary">Reset</button>
      </div>
      
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Class</th>
              <th>Financial Status</th>
              <th>Paid Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="studentsTableBody">
            ${renderStudentsTable(currentStudents)}
          </tbody>
        </table>
      </div>
    `;
    
  } catch (error) {
    content.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
}

// Render students table rows
function renderStudentsTable(students) {
  return students.map(student => `
    <tr>
      <td><strong>${student.matricule}</strong></td>
      <td>${student.first_name} ${student.last_name}</td>
      <td>${student.email}</td>
      <td>${student.phone || 'N/A'}</td>
      <td>${student.class_name || '<em style="color: #95a5a6;">Not assigned</em>'}</td>
      <td><span class="badge ${getFinancialStatusClass(student.financial_status)}">${student.financial_status}</span></td>
      <td>
        <strong>${formatCurrency(student.tuition_paid)}</strong>
        <br>
        <small style="color: #7f8c8d;">/ ${formatCurrency(student.tuition_total)}</small>
      </td>
      <td>
        <button class="btn btn-primary" onclick="viewStudentDetails('${student.matricule}')" 
                style="padding: 6px 12px; font-size: 12px; white-space: nowrap;">
          View Details
        </button>
      </td>
    </tr>
  `).join('');
}

// Filter students
function filterStudents() {
  const searchTerm = document.getElementById('searchStudent').value.toLowerCase();
  
  if (!searchTerm) {
    loadStudents();
    return;
  }
  
  const filtered = currentStudents.filter(s => 
    s.matricule.toLowerCase().includes(searchTerm) ||
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm) ||
    s.email.toLowerCase().includes(searchTerm)
  );
  
  const tbody = document.getElementById('studentsTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No students found matching your search.</td></tr>';
  } else {
    tbody.innerHTML = renderStudentsTable(filtered);
  }
}

// View student details in modal
async function viewStudentDetails(matricule) {
  const modal = document.getElementById('studentModal');
  const content = document.getElementById('studentModalContent');
  
  modal.classList.add('show');
  content.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading student details...</p></div>';
  
  try {
    const data = await apiCall(API_ENDPOINTS.ADMIN.STUDENT_BY_MATRICULE(matricule));
    const student = data.data.student;
    const payments = data.data.payments;
    
    const remaining = parseFloat(student.tuition_total) - parseFloat(student.tuition_paid);
    const statusClass = student.financial_status === 'SOLDÉ' ? 'solde' : 
                       student.financial_status === 'PAYÉ PARTIELLEMENT' ? 'partial' : 'non-solde';
    
    content.innerHTML = `
      <h3 style="color: var(--primary-color); margin-bottom: 20px;">
        ${student.first_name} ${student.last_name}
      </h3>
      
      <div class="info-grid" style="margin-bottom: 25px;">
        <div class="info-item">
          <label>Matricule</label>
          <div class="value">${student.matricule}</div>
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
          <div class="value">${student.class_name || '<em>Not assigned</em>'}</div>
        </div>
        <div class="info-item">
          <label>Registered</label>
          <div class="value">${formatDate(student.created_at)}</div>
        </div>
      </div>
      
      ${student.address ? `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
          <label style="font-size: 12px; color: #7f8c8d; text-transform: uppercase; margin-bottom: 5px; display: block;">Address</label>
          <div>${student.address}</div>
        </div>
      ` : ''}
      
      <div class="financial-status ${statusClass}" style="margin-bottom: 25px;">
        <h4 style="margin-bottom: 15px;">
          Financial Status: 
          <span class="badge ${getFinancialStatusClass(student.financial_status)}">${student.financial_status}</span>
        </h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 15px;">
          <div>
            <label style="font-size: 12px; color: rgba(0,0,0,0.6); display: block; margin-bottom: 5px;">Total Tuition</label>
            <div style="font-size: 22px; font-weight: 700;">${formatCurrency(student.tuition_total)}</div>
          </div>
          <div>
            <label style="font-size: 12px; color: rgba(0,0,0,0.6); display: block; margin-bottom: 5px;">Amount Paid</label>
            <div style="font-size: 22px; font-weight: 700; color: #27ae60;">${formatCurrency(student.tuition_paid)}</div>
          </div>
          <div>
            <label style="font-size: 12px; color: rgba(0,0,0,0.6); display: block; margin-bottom: 5px;">Remaining</label>
            <div style="font-size: 22px; font-weight: 700; color: #e74c3c;">${formatCurrency(remaining)}</div>
          </div>
        </div>
      </div>
      
      <h4 style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ecf0f1;">
        Payment History (${payments.length} payment${payments.length !== 1 ? 's' : ''})
      </h4>
      
      ${payments.length === 0 ? `
        <div style="text-align: center; padding: 40px; color: #7f8c8d;">
          <div style="font-size: 48px; margin-bottom: 10px;">💳</div>
          <p>No payments recorded yet.</p>
        </div>
      ` : `
        <div style="max-height: 300px; overflow-y: auto;">
          <table style="font-size: 14px;">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Bank</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td><strong>${p.receipt_number}</strong></td>
                  <td>${p.bank_name}</td>
                  <td><strong style="color: var(--success-color);">${formatCurrency(p.amount)}</strong></td>
                  <td>${formatDate(p.payment_date)}</td>
                  <td>${p.recorded_by_name}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
      
      <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #ecf0f1; display: flex; gap: 10px;">
        <button onclick="quickRecordPayment('${student.matricule}')" class="btn btn-success">
          💳 Record Payment
        </button>
        <button onclick="quickAssignClass('${student.matricule}')" class="btn btn-primary">
          🏫 Assign to Class
        </button>
        <button onclick="closeModal()" class="btn btn-secondary" style="margin-left: auto;">
          Close
        </button>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="alert alert-error">${error.message}</div>
      <button onclick="closeModal()" class="btn btn-secondary" style="margin-top: 15px;">Close</button>
    `;
  }
}

// Quick record payment (from modal)
function quickRecordPayment(matricule) {
  closeModal();
  // Switch to payments section
  document.querySelector('[data-section="payments"]').click();
  // Pre-fill matricule
  setTimeout(() => {
    document.getElementById('matricule').value = matricule;
    document.getElementById('matricule').focus();
  }, 100);
}

// Quick assign class (from modal)
function quickAssignClass(matricule) {
  closeModal();
  // Switch to classes section
  document.querySelector('[data-section="classes"]').click();
  // Pre-fill matricule
  setTimeout(() => {
    document.getElementById('assign_matricule').value = matricule;
  }, 100);
}

// Close modal
function closeModal() {
  document.getElementById('studentModal').classList.remove('show');
}

// Record payment
async function recordPayment() {
  const form = document.getElementById('paymentForm');
  const alertDiv = document.getElementById('alert');
  
  const paymentData = {
    matricule: document.getElementById('matricule').value.trim(),
    receipt_number: document.getElementById('receipt_number').value.trim(),
    bank_name: document.getElementById('bank_name').value.trim(),
    amount: parseFloat(document.getElementById('amount').value),
    payment_date: document.getElementById('payment_date').value
  };
  
  // Validation
  if (!paymentData.matricule || !paymentData.receipt_number || !paymentData.bank_name || 
      !paymentData.amount || !paymentData.payment_date) {
    showAlert('All fields are required!', 'error');
    return;
  }
  
  if (paymentData.amount <= 0) {
    showAlert('Payment amount must be greater than zero!', 'error');
    return;
  }
  
  try {
    const data = await apiCall(API_ENDPOINTS.ADMIN.RECORD_PAYMENT, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    
    // Show success message with details
    alertDiv.innerHTML = `
      <div class="alert alert-success show">
        <h4 style="margin-bottom: 10px;">✓ Payment Recorded Successfully!</h4>
        <div style="background: rgba(255,255,255,0.5); padding: 15px; border-radius: 6px; margin-top: 10px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div>
              <label style="font-size: 12px; display: block; margin-bottom: 3px;">Total Paid</label>
              <strong style="font-size: 18px; color: var(--success-color);">${formatCurrency(data.data.total_paid)}</strong>
            </div>
            <div>
              <label style="font-size: 12px; display: block; margin-bottom: 3px;">Remaining</label>
              <strong style="font-size: 18px; color: var(--danger-color);">${formatCurrency(data.data.remaining)}</strong>
            </div>
            <div>
              <label style="font-size: 12px; display: block; margin-bottom: 3px;">Status</label>
              <span class="badge ${getFinancialStatusClass(data.data.financial_status)}" style="font-size: 12px;">
                ${data.data.financial_status}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    form.reset();
    
    // ALWAYS refresh students data to update statistics
    setTimeout(async () => {
      await loadStudents();
      // If we're on the payment section, scroll to show the success message
      if (document.getElementById('payments-section').classList.contains('active')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 1000);
    
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// Load classes
async function loadClasses() {
  const content = document.getElementById('classesContent');
  showLoading('classesContent');
  
  try {
    const data = await apiCall(API_ENDPOINTS.ADMIN.CLASSES);
    currentClasses = data.data;
    
    // Populate class dropdown for student assignment
    const classSelect = document.getElementById('class_id');
    if (classSelect) {
      classSelect.innerHTML = '<option value="">Select a class</option>' +
        currentClasses.map(c => `<option value="${c.id}">${c.class_name} (${c.student_count}/${c.capacity} students)</option>`).join('');
    }

    // Populate class dropdown for teacher assignment
    const teacherClassSelect = document.getElementById('teacher_class_id');
    if (teacherClassSelect) {
        teacherClassSelect.innerHTML = '<option value="">Select a class</option>' +
            currentClasses.map(c => `<option value="${c.id}">${c.class_name}</option>`).join('');
    }
    
    if (currentClasses.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏫</div>
          <h3>No classes available</h3>
          <p>Classes need to be created in the database first.</p>
        </div>
      `;
      return;
    }
    
    content.innerHTML = `
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Level</th>
              <th>Academic Year</th>
              <th>Capacity</th>
              <th>Students Enrolled</th>
              <th>Teachers Assigned</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${currentClasses.map(c => {
              const fillPercentage = (c.student_count / c.capacity * 100).toFixed(0);
              const statusColor = fillPercentage >= 90 ? 'danger' : fillPercentage >= 70 ? 'warning' : 'success';
              
              return `
                <tr>
                  <td><strong>${c.class_name}</strong></td>
                  <td>${c.level}</td>
                  <td>${c.academic_year}</td>
                  <td>${c.capacity}</td>
                  <td>
                    <strong>${c.student_count}</strong> / ${c.capacity}
                    <div style="background: #ecf0f1; height: 6px; border-radius: 3px; margin-top: 5px; overflow: hidden;">
                      <div style="background: var(--${statusColor}-color); height: 100%; width: ${fillPercentage}%;"></div>
                    </div>
                  </td>
                  <td>${c.teacher_count}</td>
                  <td>
                    <span class="badge badge-${statusColor}">
                      ${fillPercentage >= 100 ? 'FULL' : fillPercentage >= 90 ? 'Almost Full' : 'Available'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    
  } catch (error) {
    content.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
  }
}

// Assign student to class
async function assignClass() {
  const matricule = document.getElementById('assign_matricule').value.trim();
  const class_id = document.getElementById('class_id').value;
  
  if (!matricule || !class_id) {
    alert('Please enter matricule and select a class');
    return;
  }
  
  try {
    const data = await apiCall(API_ENDPOINTS.ADMIN.ASSIGN_CLASS, {
      method: 'POST',
      body: JSON.stringify({ matricule, class_id })
    });
    
    alert(`✓ Success!\n${data.data.student} has been assigned to ${data.data.class}`);
    
    document.getElementById('assignClassForm').reset();
    
    // Refresh data
    await loadClasses();
    if (document.getElementById('students-section').classList.contains('active')) {
      await loadStudents();
    }
    
  } catch (error) {
    alert(`✗ Error: ${error.message}`);
  }
}

// Load all teachers
async function loadTeachers() {
    const content = document.getElementById('teachersContent');
    showLoading('teachersContent');

    try {
        const data = await apiCall(API_ENDPOINTS.ADMIN.TEACHERS);
        currentTeachers = data.data;

        // Populate teacher dropdown for assignment
        const teacherSelect = document.getElementById('teacher_id');
        if (teacherSelect) {
            teacherSelect.innerHTML = '<option value="">Select a teacher</option>' +
                currentTeachers.map(t => `<option value="${t.id}">${t.full_name} (${t.specialization || 'N/A'})</option>`).join('');
        }

        if (currentTeachers.length === 0) {
            content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👩‍🏫</div>
          <h3>No teachers registered yet</h3>
          <p>Teachers can be created from the "Manage Accounts" page.</p>
        </div>
      `;
            return;
        }

        content.innerHTML = `
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Specialization</th>
              <th>Classes Assigned</th>
            </tr>
          </thead>
          <tbody>
            ${currentTeachers.map(teacher => `
              <tr>
                <td>${teacher.id}</td>
                <td><strong>${teacher.full_name}</strong></td>
                <td>${teacher.email}</td>
                <td>${teacher.phone || 'N/A'}</td>
                <td>${teacher.specialization || 'N/A'}</td>
                <td>${teacher.class_count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">${error.message}</div>`;
    }
}

// Load all subjects
async function loadSubjects() {
    try {
        const data = await apiCall(API_ENDPOINTS.ADMIN.SUBJECTS);
        currentSubjects = data.data;

        // Populate subject dropdown for assignment
        const subjectSelect = document.getElementById('subject_id');
        if (subjectSelect) {
            subjectSelect.innerHTML = '<option value="">Select a subject</option>' +
                currentSubjects.map(s => `<option value="${s.id}">${s.subject_name} (${s.subject_code})</option>`).join('');
        }
    } catch (error) {
        console.error('Failed to load subjects', error);
    }
}


// Assign teacher to class
async function assignTeacherToClass() {
    const teacher_id = document.getElementById('teacher_id').value;
    const class_id = document.getElementById('teacher_class_id').value;
    const subject_id = document.getElementById('subject_id').value;

    if (!teacher_id || !class_id || !subject_id) {
        alert('Please select a teacher, class, and subject.');
        return;
    }

    try {
        const data = await apiCall(API_ENDPOINTS.ADMIN.ASSIGN_TEACHER_TO_CLASS, {
            method: 'POST',
            body: JSON.stringify({ teacher_id, class_id, subject_id })
        });

        alert(`✓ Success!\nTeacher has been assigned to the class.`);

        document.getElementById('assignTeacherForm').reset();

        // Refresh data
        await loadTeachers();
        await loadClasses();

    } catch (error) {
        alert(`✗ Error: ${error.message}`);
    }
}

// Generate document - VERSION PDF
async function generateDocument(type) {
  const matricule = document.getElementById('doc_matricule').value.trim();
  const resultDiv = document.getElementById('documentResult');
  
  if (!matricule) {
    alert('Veuillez entrer le matricule de l\'étudiant');
    return;
  }
  
  resultDiv.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Génération du document PDF en cours...</p></div>';
  
  try {
    const endpoint = type === 'certificate' ? 
      API_ENDPOINTS.ADMIN.CERTIFICATE(matricule) : 
      API_ENDPOINTS.ADMIN.TRANSCRIPT(matricule);
    
    const token = localStorage.getItem('token');
    
    // Faire une requête pour télécharger le PDF
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la génération du document');
    }
    
    // Vérifier que c'est bien un PDF
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('Le serveur n\'a pas retourné un PDF');
    }
    
    // Convertir la réponse en blob
    const blob = await response.blob();
    
    // Créer une URL pour le blob
    const url = window.URL.createObjectURL(blob);
    
    // Ouvrir le PDF dans un nouvel onglet
    window.open(url, '_blank');
    
    // Message de succès
    resultDiv.innerHTML = `
      <div class="alert alert-success">
        <h4 style="margin-bottom: 10px;">✓ Document généré avec succès !</h4>
        <p>Le ${type === 'certificate' ? 'certificat' : 'relevé de notes'} a été ouvert dans un nouvel onglet.</p>
        <p style="margin-top: 15px;">
          <button onclick="generateDocument('${type}')" class="btn btn-primary">
            🔄 Régénérer le document
          </button>
        </p>
      </div>
    `;
    
    // Nettoyer l'URL du blob après 1 minute
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 60000);
    
  } catch (error) {
    resultDiv.innerHTML = `
      <div class="alert alert-error">
        <h4>Erreur lors de la génération du document</h4>
        <p>${error.message}</p>
        <p style="margin-top: 10px; font-size: 13px; color: #7f8c8d;">
          Vérifiez que :
          <ul style="margin-top: 5px; padding-left: 20px;">
            <li>Le matricule est correct</li>
            <li>L'étudiant a le statut SOLDÉ</li>
            <li>Le backend est en cours d'exécution</li>
          </ul>
        </p>
      </div>
    `;
  }
}
    
  


// Set today's date as default for payment date
window.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('payment_date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
});