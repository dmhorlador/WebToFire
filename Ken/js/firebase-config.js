// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Replace the placeholder values below with the config
// from your Firebase Console:
// Project Settings > General > Your apps > SDK setup and configuration

const firebaseConfig = {
 apiKey: "AIzaSyA9XgENMX2t1UdH2OE0KSeCHzS8-3e7Kww",
  authDomain: "esp-32-34bce.firebaseapp.com",
  databaseURL: "https://esp-32-34bce-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp-32-34bce",
  storageBucket: "esp-32-34bce.firebasestorage.app",
  messagingSenderId: "608918899713",
  appId: "1:608918899713:web:cf59cba537a3bc5f7c4400"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Shared Firebase service instances used across auth.js and dashboard.js
const auth = firebase.auth();
const database = firebase.database();
