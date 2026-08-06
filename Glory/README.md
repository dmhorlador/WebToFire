# Student Management System

A simple, responsive Student Management System built with plain HTML, CSS, and JavaScript, backed by Firebase Authentication and Cloud Firestore. No frameworks, no UI libraries.

## Folder structure

```
student-management-system/
├── index.html          Login page
├── register.html        Registration page
├── dashboard.html        Dashboard (list, search, add/edit/delete modals)
├── css/
│   └── style.css        All styles
├── js/
│   ├── firebase-config.js  Firebase project config (placeholders — fill this in)
│   ├── auth.js         Login / register logic
│   ├── students.js      Firestore CRUD helpers
│   └── dashboard.js      Dashboard UI wiring
└── assets/            Static assets (empty by default)
```

## 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. In **Build → Authentication → Sign-in method**, enable **Email/Password**.
3. In **Build → Firestore Database**, click **Create database** and start in production mode (rules below lock it down properly).
4. In **Project settings → General → Your apps**, click the web icon (`</>`) to register a web app and copy the config object it gives you.

## 2. Add your config

Open `js/firebase-config.js` and replace the placeholder values with your project's real config:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 3. Set Firestore security rules

Each student document is tagged with an `ownerId` field matching the creator's `uid`, so every user only ever reads/writes their own records. In the Firebase console under **Firestore Database → Rules**, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /students/{studentId} {
      allow read, update, delete: if request.auth != null
                                    && request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null
                     && request.auth.uid == request.resource.data.ownerId;
    }
  }
}
```

## 4. Run it locally

This is a static site — no build step required. Serve the folder with any static server, for example:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL in your browser (opening `index.html` directly via `file://` may block some browser features, so a local server is recommended).

## Features

- **Login / Register** — Email & password auth via Firebase Authentication.
- **Dashboard** — Live stats (total, active, inactive, unique courses) that update in real time.
- **Add / Edit Student** — Modal form for name, email, phone, course, year level, and status.
- **Delete Student** — Confirmation modal before permanent deletion.
- **Search & Filter** — Instant client-side search across name/email/course, plus a status filter.
- **Responsive design** — Works down to mobile widths; sidebar collapses into a top bar.

## Notes

- Data updates live via Firestore's `onSnapshot` listener — no manual refresh needed after add/edit/delete.
- All input is escaped before being rendered into the table to avoid HTML injection.
- No external UI libraries (no SweetAlert, Bootstrap, etc.) — only the official Firebase SDKs are loaded, via CDN `<script>` tags.
