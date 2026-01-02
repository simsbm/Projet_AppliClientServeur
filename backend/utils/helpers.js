// Helper utility functions - FIXED VERSION

// Generate unique matricule
const generateMatricule = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `STU${year}${random}`;
};

// Calculate financial status - FIXED to handle both number and string inputs
const calculateFinancialStatus = (totalTuition, amountPaid) => {
  // Convert to numbers for comparison
  const total = parseFloat(totalTuition) || 0;
  const paid = parseFloat(amountPaid) || 0;
  
  console.log('calculateFinancialStatus called with:', { 
    totalTuition, 
    amountPaid, 
    total, 
    paid 
  });
  
  if (paid === 0) {
    return 'NON SOLDE';
  } else if (paid >= total) {
    return 'SOLDE';
  } else {
    return 'PAYE PARTIELLEMENT';
  }
};

// Validate payment amount - FIXED to handle number conversion
const validatePaymentAmount = (amount, totalTuition, alreadyPaid) => {
  // Convert all to numbers
  const paymentAmount = parseFloat(amount);
  const total = parseFloat(totalTuition);
  const paid = parseFloat(alreadyPaid) || 0;
  const remaining = total - paid;
  
  console.log('validatePaymentAmount called with:', {
    amount,
    totalTuition,
    alreadyPaid,
    paymentAmount,
    total,
    paid,
    remaining
  });
  
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    return { valid: false, message: 'Payment amount must be greater than zero.' };
  }
  
  if (paymentAmount > remaining) {
    return { 
      valid: false, 
      message: `Payment amount exceeds remaining balance. Remaining: ${remaining.toFixed(2)} XAF` 
    };
  }
  
  return { valid: true };
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF'
  }).format(amount);
};

// Validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  generateMatricule,
  calculateFinancialStatus,
  validatePaymentAmount,
  formatCurrency,
  isValidEmail
};