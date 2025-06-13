// Redirect if user not logged in
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

// Select elements
const expenseNameInput = document.getElementById('expense-name');
const expenseAmountInput = document.getElementById('expense-amount');
const addBtn = document.getElementById('add-btn');
const expenseList = document.getElementById('expense-list');
const totalDisplay = document.getElementById('total');
const logoutBtn = document.getElementById('logout-btn');
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

let expenses = [];

// Helper: Format Date to readable string
function formatDate(dateStr) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString(undefined, options);
}

// Calculate ALL-TIME total
function calculateTotal() {
  return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
}

// Calculate monthly total
function calculateMonthlyTotal() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return expenses
    .filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
}

// Render expenses in history tab
function renderExpenses() {
  expenseList.innerHTML = '';

  if (expenses.length === 0) {
    expenseList.innerHTML = `<li style="text-align:center; color:#777;">No expenses recorded yet.</li>`;
    return;
  }

  // Add monthly total header
  const monthlyTotalHeader = document.createElement('li');
  monthlyTotalHeader.innerHTML = `
    <strong>Monthly Total:</strong>
    <span class="amount">₹${calculateMonthlyTotal().toFixed(2)}</span>
  `;
  monthlyTotalHeader.style.background = '#f0f0f0';
  monthlyTotalHeader.style.fontWeight = 'bold';
  monthlyTotalHeader.style.padding = '12px 8px';
  expenseList.appendChild(monthlyTotalHeader);

  // Add individual expenses
  expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(exp => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${exp.name} <small style="color:#666;">(${formatDate(exp.date)})</small></span>
        <span class="amount">₹${parseFloat(exp.amount).toFixed(2)}</span>
      `;
      expenseList.appendChild(li);
    });
}

// Update UI (render list + total)
function updateUI() {
  renderExpenses();
  totalDisplay.textContent = calculateTotal().toFixed(2);
}

// Load expenses from database
async function loadExpenses() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    
    const response = await fetch(`http://localhost:3001/expenses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to load expenses: ${response.status}`);
    }
    
    expenses = await response.json();
    
    // Ensure amounts are numbers
    expenses.forEach(exp => {
      exp.amount = parseFloat(exp.amount);
    });
    
    updateUI();
  } catch (error) {
    console.error('Error loading expenses:', error);
    alert(`Failed to load expenses: ${error.message}`);
  }
}

// Add new expense
async function addExpense() {
  const name = expenseNameInput.value.trim();
  const amount = expenseAmountInput.value.trim();
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
    return;
  }

  if (!name || !amount || isNaN(amount) || amount <= 0) {
    alert('Please enter a valid expense name and amount.');
    return;
  }

  try {
    const amountNum = parseFloat(amount);
    
    const response = await fetch('http://localhost:3001/expenses', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, amount: amountNum })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save expense');
    }

    const savedExpense = await response.json();
    savedExpense.amount = parseFloat(savedExpense.amount);
    expenses.push(savedExpense);
    updateUI();
    
    // Clear inputs
    expenseNameInput.value = '';
    expenseAmountInput.value = '';
    expenseNameInput.focus();
  } catch (error) {
    console.error('Error adding expense:', error);
    alert(`Failed to add expense: ${error.message}`);
  }
}

// Tab switching logic
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  window.location.href = 'login.html';
});

// Auto-logout when token expires
function checkTokenExpiration() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      alert('Your session has expired. Please login again.');
      logoutBtn.click();
    }
  } catch (e) {
    console.error('Token check error:', e);
  }
}

// Add event listeners
addBtn.addEventListener('click', addExpense);

// Handle Enter key in input fields
[expenseNameInput, expenseAmountInput].forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') addExpense();
  });
});

// Initialize
loadExpenses();

// Check token expiration every minute
setInterval(checkTokenExpiration, 60000);