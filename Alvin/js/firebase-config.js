// firebase-config.js
// -----------------------------------------------------------------------
// Replace the placeholder values below with your own Firebase project's
// configuration. You can find these values in the Firebase console:
// Project settings > General > Your apps > SDK setup and configuration.
// -----------------------------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC13CmoYNer2zAE9anLnnBq8REB1MBEu6M",
  authDomain: "esp32-fe267.firebaseapp.com",
  databaseURL: "https://esp32-fe267-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp32-fe267",
  storageBucket: "esp32-fe267.firebasestorage.app",
  messagingSenderId: "667112106048",
  appId: "1:667112106048:web:16de546e95e5070a1b97a5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services and export them for use in other modules
export const auth = getAuth(app);
export const db = getDatabase(app);
