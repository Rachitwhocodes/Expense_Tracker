// Redirect if user not logged in
const user = localStorage.getItem("loggedInUser");
if (!user) {
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
  return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
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
    .reduce((sum, exp) => sum + Number(exp.amount), 0);
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
  expenseList.appendChild(monthlyTotalHeader);

  // Add individual expenses
  expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(exp => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${exp.name} <small style="color:#666;">(${formatDate(exp.date)})</small></span>
        <span class="amount">₹${Number(exp.amount).toFixed(2)}</span>
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
    const userId = localStorage.getItem('userId');
    if (!userId) {
      window.location.href = 'login.html';
      return;
    }
    
    const response = await fetch(`http://localhost:3001/expenses/${userId}`);
    if (!response.ok) throw new Error('Failed to load expenses');
    
    expenses = await response.json();
    updateUI();
  } catch (error) {
    console.error('Error loading expenses:', error);
    alert('Failed to load expenses. Please try again.');
  }
}

// Add new expense
async function addExpense() {
  const name = expenseNameInput.value.trim();
  const amount = expenseAmountInput.value.trim();

  if (!name || !amount || isNaN(amount) || amount <= 0) {
    alert('Please enter a valid expense name and amount.');
    return;
  }

  try {
    const newExpense = {
      userId: localStorage.getItem('userId'),
      name,
      amount: Number(amount),
      date: new Date().toISOString()
    };

    const response = await fetch('http://localhost:3001/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense)
    });

    if (!response.ok) throw new Error('Failed to save expense');

    expenses.push(newExpense);
    updateUI();
    
    // Clear inputs
    expenseNameInput.value = '';
    expenseAmountInput.value = '';
  } catch (error) {
    console.error('Error adding expense:', error);
    alert('Failed to add expense. Please try again.');
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
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('userId');
  window.location.href = 'login.html';
});

// Add event listeners
addBtn.addEventListener('click', addExpense);
[expenseNameInput, expenseAmountInput].forEach(input =>
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') addExpense();
  })
);

// Initialize
loadExpenses();