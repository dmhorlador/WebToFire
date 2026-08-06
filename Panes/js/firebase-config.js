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
        - Firestore Database -> Create database (start in test
          mode for development, then set proper security rules
          before going to production)
   ============================================================ */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (using the compat SDKs loaded via CDN in each HTML page)
firebase.initializeApp(firebaseConfig);

// Shared references used across the app
const auth = firebase.auth();
const db = firebase.firestore();

/* ------------------------------------------------------------
   Recommended Firestore Security Rules (paste into the
   Firestore "Rules" tab in the Firebase console):

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /tasks/{taskId} {
         allow read, update, delete: if request.auth != null &&
                                         request.auth.uid == resource.data.uid;
         allow create: if request.auth != null &&
                          request.auth.uid == request.resource.data.uid;
       }
       match /users/{userId} {
         allow read, write: if request.auth != null &&
                                request.auth.uid == userId;
       }
     }
   }
   ------------------------------------------------------------ */
