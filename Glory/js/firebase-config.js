/* ==========================================================================
   Firebase Configuration
   --------------------------------------------------------------------------
   Replace the placeholder values below with the config object from your
   own Firebase project:
   Firebase Console -> Project Settings -> General -> Your apps -> SDK setup

   Be sure to include "databaseURL" (from Build -> Realtime Database in the
   Firebase console) — it's required for the Realtime Database SDK to work.

   This project uses the Firebase compat SDKs (loaded via <script> tags in
   each HTML file), so firebase.initializeApp() is available globally.
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyDKsMgE1WTtyWIzfaykBUQiTOf1aTKj96E",
  authDomain: "esp32-glo.firebaseapp.com",
  databaseURL: "https://esp32-glo-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp32-glo",
  storageBucket: "esp32-glo.firebasestorage.app",
  messagingSenderId: "1007926111064",
  appId: "1:1007926111064:web:72f369e7b9c2085fe3932d",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Shared references used across the app
const auth = firebase.auth();
const db = firebase.database();
