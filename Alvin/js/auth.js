// auth.js
// Handles login, registration, tab switching, and redirect logic
// for the index.html (sign-in) page.

import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ---------------------------------------------------------------------
// Element references
// ---------------------------------------------------------------------
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authSubtext = document.getElementById("authSubtext");

const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");

const registerBtn = document.getElementById("registerBtn");
const registerMsg = document.getElementById("registerMsg");

// ---------------------------------------------------------------------
// If the user is already signed in, skip straight to the dashboard.
// ---------------------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});

// ---------------------------------------------------------------------
// Tab switching between Log in / Register
// ---------------------------------------------------------------------
function showLogin() {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  authSubtext.textContent = "Sign in to your account";
  clearMessage(loginMsg);
  clearMessage(registerMsg);
}

function showRegister() {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  authSubtext.textContent = "Create a new account";
  clearMessage(loginMsg);
  clearMessage(registerMsg);
}

tabLogin.addEventListener("click", showLogin);
tabRegister.addEventListener("click", showRegister);

// ---------------------------------------------------------------------
// Message helpers
// ---------------------------------------------------------------------
function showMessage(el, text, type) {
  el.textContent = text;
  el.className = "form-msg show " + type;
}

function clearMessage(el) {
  el.textContent = "";
  el.className = "form-msg";
}

function friendlyError(error) {
  const code = error.code || "";
  if (code.includes("auth/invalid-email")) return "That email address looks invalid.";
  if (code.includes("auth/user-not-found") || code.includes("auth/wrong-password") || code.includes("auth/invalid-credential"))
    return "Incorrect email or password.";
  if (code.includes("auth/email-already-in-use")) return "An account with that email already exists.";
  if (code.includes("auth/weak-password")) return "Password should be at least 6 characters.";
  return error.message || "Something went wrong. Please try again.";
}

// ---------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage(loginMsg);

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged above will redirect to dashboard.html
  } catch (error) {
    showMessage(loginMsg, friendlyError(error), "error");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Log in";
  }
});

// ---------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage(registerMsg);

  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirm").value;

  if (password !== confirm) {
    showMessage(registerMsg, "Passwords do not match.", "error");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Creating account...";

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged above will redirect to dashboard.html
  } catch (error) {
    showMessage(registerMsg, friendlyError(error), "error");
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Create account";
  }
});
