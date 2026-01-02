// Authentication helper functions

// Show alert message
const showAlert = (message, type = 'error') => {
  const alertDiv = document.getElementById('alert');
  if (!alertDiv) return;
  
  alertDiv.className = `alert alert-${type} show`;
  alertDiv.textContent = message;
  
  setTimeout(() => {
    alertDiv.classList.remove('show');
  }, 5000);
};

// Hide alert
const hideAlert = () => {
  const alertDiv = document.getElementById('alert');
  if (alertDiv) {
    alertDiv.classList.remove('show');
  }
};

// Handle login
const handleLogin = async (endpoint, credentials) => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Store token and user info
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Check authentication and redirect
const checkAuth = (requiredRole) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    // Not authenticated, redirect to appropriate login
    window.location.href = `../${requiredRole}/login.html`;
    return false;
  }
  
  const user = JSON.parse(userStr);
  
  // Check if user has the required role
  if (user.role !== requiredRole) {
    alert('Access denied. Insufficient permissions.');
    logout();
    window.location.href = `../${requiredRole}/login.html`;
    return false;
  }
  
  return true;
};

// Logout and redirect
const handleLogout = (role) => {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = `login.html`;
  }
};

// Display user info in header
const displayUserInfo = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return;
  
  const user = JSON.parse(userStr);
  const userNameElement = document.getElementById('userName');
  
  if (userNameElement) {
    if (user.role === 'student') {
      userNameElement.textContent = `${user.first_name} ${user.last_name} (${user.matricule})`;
    } else {
      userNameElement.textContent = user.full_name || user.username;
    }
  }
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF'
  }).format(amount);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time
const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Get financial status badge class
const getFinancialStatusClass = (status) => {
  switch (status) {
    case 'SOLDÉ':
      return 'badge-success';
    case 'PAYÉ PARTIELLEMENT':
      return 'badge-warning';
    case 'NON SOLDÉ':
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
};

// Show loading state
const showLoading = (elementId) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading...</p></div>';
  }
};

// Disable button with loading state
const setButtonLoading = (button, loading) => {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Loading...';
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
};