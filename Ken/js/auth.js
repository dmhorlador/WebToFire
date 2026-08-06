// ============================================
// AUTH PAGE LOGIC (index.html)
// ============================================

const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const errorMsg = document.getElementById('errorMsg');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

// Redirect to dashboard if already logged in
auth.onAuthStateChanged(user => {
  if (user) {
    window.location.href = 'dashboard.html';
  }
});

// ---- Tab Switching ----
loginTab.addEventListener('click', () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));

function switchTab(tab) {
  hideError();
  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
  }
}

// ---- Error Helpers ----
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = 'block';
}

function hideError() {
  errorMsg.style.display = 'none';
}

function getFriendlyError(code) {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.'
  };
  return messages[code] || 'Something went wrong. Please try again.';
}

// ---- Login ----
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  hideError();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = 'dashboard.html';
    })
    .catch(err => {
      showError(getFriendlyError(err.code));
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    });
});

// ---- Register ----
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  hideError();

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirm').value;

  if (password !== confirmPassword) {
    showError('Passwords do not match.');
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = 'Creating account...';

  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => cred.user.updateProfile({ displayName: name }))
    .then(() => {
      window.location.href = 'dashboard.html';
    })
    .catch(err => {
      showError(getFriendlyError(err.code));
      registerBtn.disabled = false;
      registerBtn.textContent = 'Create Account';
    });
});
