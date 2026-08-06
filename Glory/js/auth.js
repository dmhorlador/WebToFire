/* ==========================================================================
   auth.js
   Handles login, registration, and route protection.
   Relies on `auth` and `db` from firebase-config.js
   ========================================================================== */

/**
 * Converts common Firebase Auth error codes into friendly messages.
 */
function getAuthErrorMessage(error) {
  const map = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/too-many-requests": "Too many attempts. Please try again later."
  };
  return map[error.code] || error.message || "Something went wrong. Please try again.";
}

function showAlert(el, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
}

function hideAlert(el) {
  if (!el) return;
  el.classList.remove("show");
  el.textContent = "";
}

/* ---------------------------- Login page ---------------------------- */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  const alertBox = document.getElementById("alertBox");
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnText = document.getElementById("loginBtnText");

  // If already logged in, skip straight to the dashboard.
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = "dashboard.html";
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showAlert(alertBox, "Please fill in both fields.");
      return;
    }

    loginBtn.disabled = true;
    loginBtnText.textContent = "Signing in…";

    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = "dashboard.html";
    } catch (error) {
      showAlert(alertBox, getAuthErrorMessage(error));
      loginBtn.disabled = false;
      loginBtnText.textContent = "Sign in";
    }
  });
}

/* --------------------------- Register page --------------------------- */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  const alertBox = document.getElementById("alertBox");
  const registerBtn = document.getElementById("registerBtn");
  const registerBtnText = document.getElementById("registerBtnText");

  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = "dashboard.html";
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertBox);

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!fullName || !email || !password || !confirmPassword) {
      showAlert(alertBox, "Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      showAlert(alertBox, "Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showAlert(alertBox, "Passwords do not match.");
      return;
    }

    registerBtn.disabled = true;
    registerBtnText.textContent = "Creating account…";

    try {
      const credential = await auth.createUserWithEmailAndPassword(email, password);

      // Save the display name on the auth profile.
      await credential.user.updateProfile({ displayName: fullName });

      // Store a matching user document in Firestore.
      await db.collection("users").doc(credential.user.uid).set({
        fullName: fullName,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      window.location.href = "dashboard.html";
    } catch (error) {
      showAlert(alertBox, getAuthErrorMessage(error));
      registerBtn.disabled = false;
      registerBtnText.textContent = "Create account";
    }
  });
}
