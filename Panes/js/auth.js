/* ============================================================
   TaskFlow — Authentication Logic
   Handles: Register, Login, Logout, Password visibility toggle,
   Floating alerts, and Auth-state route protection.
   ============================================================ */

/* ---------- Utility: Floating Alert ---------- */
function showAlert(message, type = "danger") {
  const container = document.getElementById("alertContainer");
  if (!container) {
    alert(message);
    return;
  }
  const icons = {
    danger: "bi-exclamation-triangle-fill",
    success: "bi-check-circle-fill",
    warning: "bi-exclamation-circle-fill",
    info: "bi-info-circle-fill"
  };
  const alertEl = document.createElement("div");
  alertEl.className = `alert alert-${type} alert-floating shadow d-flex align-items-center gap-2`;
  alertEl.role = "alert";
  alertEl.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i> <span>${message}</span>`;
  container.appendChild(alertEl);
  setTimeout(() => {
    alertEl.style.transition = "opacity 0.4s ease";
    alertEl.style.opacity = "0";
    setTimeout(() => alertEl.remove(), 400);
  }, 4000);
}

/* ---------- Utility: Friendly Firebase error messages ---------- */
function friendlyAuthError(error) {
  const map = {
    "auth/email-already-in-use": "That email is already registered. Try logging in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Please check your connection."
  };
  return map[error.code] || error.message || "Something went wrong. Please try again.";
}

/* ---------- Password visibility toggle ---------- */
document.addEventListener("click", function (e) {
  const toggle = e.target.closest(".toggle-password");
  if (!toggle) return;
  const input = document.getElementById(toggle.dataset.target);
  if (!input) return;
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  toggle.classList.toggle("bi-eye", !isPassword);
  toggle.classList.toggle("bi-eye-slash", isPassword);
});

/* ---------- Button loading state helper ---------- */
function setButtonLoading(btn, loading) {
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-border");
  btn.disabled = loading;
  if (spinner) spinner.classList.toggle("d-none", !loading);
  if (text) text.style.opacity = loading ? "0.7" : "1";
}

/* ============================================================
   REGISTER
   ============================================================ */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;
    const agreeTerms = document.getElementById("agreeTerms").checked;
    const btn = document.getElementById("registerBtn");

    if (name.length < 2) {
      showAlert("Please enter your full name.", "warning");
      return;
    }
    if (password.length < 6) {
      showAlert("Password must be at least 6 characters.", "warning");
      return;
    }
    if (password !== confirmPassword) {
      showAlert("Passwords do not match.", "warning");
      return;
    }
    if (!agreeTerms) {
      showAlert("Please agree to the Terms of Service.", "warning");
      return;
    }

    setButtonLoading(btn, true);
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });

      // Create a user profile document in Firestore
      await db.collection("users").doc(cred.user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showAlert("Account created successfully! Redirecting…", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 1000);
    } catch (error) {
      showAlert(friendlyAuthError(error), "danger");
      setButtonLoading(btn, false);
    }
  });
}

/* ============================================================
   LOGIN
   ============================================================ */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const btn = document.getElementById("loginBtn");

    setButtonLoading(btn, true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      showAlert("Welcome back! Redirecting…", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 800);
    } catch (error) {
      showAlert(friendlyAuthError(error), "danger");
      setButtonLoading(btn, false);
    }
  });
}

/* ---------- Forgot Password ---------- */
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async function (e) {
    e.preventDefault();
    const emailInput = document.getElementById("loginEmail");
    const email = emailInput.value.trim();
    if (!email) {
      showAlert("Enter your email above first, then click 'Forgot password?'", "warning");
      emailInput.focus();
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      showAlert("Password reset email sent! Check your inbox.", "success");
    } catch (error) {
      showAlert(friendlyAuthError(error), "danger");
    }
  });
}

/* ============================================================
   ROUTE PROTECTION
   - login.html / register.html -> redirect to dashboard if
     already logged in
   - dashboard.html -> redirect to login if NOT logged in
     (handled again in dashboard.js for the UI bits)
   ============================================================ */
const currentPage = window.location.pathname.split("/").pop();

auth.onAuthStateChanged(function (user) {
  if (user && (currentPage === "login.html" || currentPage === "register.html")) {
    window.location.href = "dashboard.html";
  }
  if (!user && currentPage === "dashboard.html") {
    window.location.href = "login.html";
  }
});

/* ============================================================
   LOGOUT (used on dashboard.html)
   ============================================================ */
function logoutUser() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    showAlert(friendlyAuthError(error), "danger");
  });
}
