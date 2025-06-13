const formTitle = document.getElementById('form-title');
const toggleLink = document.getElementById('toggle-link');
const submitBtn = document.getElementById('submit-btn');

let isLogin = true;

// Toggle between Login/Register forms
toggleLink.addEventListener('click', () => {
  isLogin = !isLogin;
  formTitle.textContent = isLogin ? 'Login' : 'Register';
  submitBtn.textContent = isLogin ? 'Login' : 'Register';
  toggleLink.textContent = isLogin ? 'Register' : 'Login';
  document.querySelector('.toggle-text').childNodes[0].textContent = isLogin
    ? 'Don’t have an account? '
    : 'Already have an account? ';
});

// Password strength checker
document.getElementById('password').addEventListener('input', function () {
  if (isLogin) return;

  const password = this.value;
  const meter = document.getElementById('password-strength-bar');
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password)
  };

  Object.keys(requirements).forEach(req => {
    const element = document.getElementById(`req-${req}`);
    if (element) element.classList.toggle('valid', requirements[req]);
  });

  const strength = Object.values(requirements).filter(Boolean).length * 25;

  if (meter) {
    meter.style.width = `${strength}%`;
    meter.style.background =
      strength < 50 ? '#ff4444' :
      strength < 75 ? '#ffbb33' :
      '#00C851';
  }
});

// Password visibility toggle
document.getElementById('toggle-password').addEventListener('click', function () {
  const passwordInput = document.getElementById('password');
  const icon = this;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  } else {
    passwordInput.type = 'password';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  }
});

// Unified Form Submit Handler
document.getElementById('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // Validate password only during registration
  if (!isLogin) {
    const strongRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!strongRegex.test(password)) {
      alert("Password must contain:\n• 8+ characters\n• Uppercase & lowercase letters\n• At least 1 number");
      return;
    }
  }

  try {
    const endpoint = isLogin ? '/login' : '/register';

    const response = await fetch(`http://localhost:3001${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      if (isLogin) {
        // Save token and user info for authenticated sessions
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username);
        
        // Redirect to home
        window.location.href = 'index.html';
      } else {
        // After registration, switch to login form
        alert('Registration successful! Please login');
        isLogin = true;
        formTitle.textContent = 'Login';
        submitBtn.textContent = 'Login';
        toggleLink.textContent = 'Register';
        document.querySelector('.toggle-text').childNodes[0].textContent = 'Don’t have an account? ';
      }
    } else {
      alert(data.error || (isLogin ? 'Invalid credentials' : 'Registration failed'));
    }
  } catch (error) {
    console.error('Auth error:', error);
    alert('Connection error. Please try again later.');
  }
});