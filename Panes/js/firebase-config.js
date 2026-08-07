/* ============================================================
   FIREBASE CONFIGURATION
   ============================================================
   1. Go to https://console.firebase.google.com/
   2. Create a new project (or use an existing one)
   3. Add a Web App to the project
   4. Copy the config object Firebase gives you and paste the
      values below, replacing the placeholders.
   5. In the Firebase Console, enable:
        - Authentication -> Sign-in method -> Email/Password
        - Realtime Database -> Create database (start in test
          mode for development, then set proper security rules
          before going to production)
   ============================================================ */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (using the compat SDKs loaded via CDN in each HTML page)
firebase.initializeApp(firebaseConfig);

// Shared references used across the app
const auth = firebase.auth();
const db = firebase.database();

/* ------------------------------------------------------------
   Recommended Realtime Database Security Rules (paste into the
   Realtime Database "Rules" tab in the Firebase console):

   {
     "rules": {
       "users": {
         "$uid": {
           ".read":  "$uid === auth.uid",
           ".write": "$uid === auth.uid"
         }
       },
       "tasks": {
         "$uid": {
           ".read":  "$uid === auth.uid",
           ".write": "$uid === auth.uid"
         }
       }
     }
   }
   ------------------------------------------------------------ */
