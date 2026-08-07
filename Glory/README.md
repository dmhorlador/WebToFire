# Student Management System

A simple, responsive Student Management System built with plain HTML, CSS, and JavaScript, backed by Firebase Authentication and the Firebase Realtime Database. No frameworks, no UI libraries.

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
3. In **Build → Realtime Database**, click **Create Database** and start in locked mode (rules below lock it down properly).
4. In **Project settings → General → Your apps**, click the web icon (`</>`) to register a web app and copy the config object it gives you — make sure to also copy the **databaseURL**, shown on the Realtime Database page.

## 2. Add your config

Open `js/firebase-config.js` and replace the placeholder values with your project's real config:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 3. Set Realtime Database security rules

Each student record is tagged with an `ownerId` field matching the creator's `uid`, so every user only ever reads/writes their own records. 

**⚠️ IMPORTANT: This is the most common cause of "Could not save student" errors!**

In the Firebase console under **Realtime Database → Rules**, use:

```json
{
  "rules": {
    "students": {
      ".read": "auth != null",
      ".indexOn": ["ownerId"],
      "$studentId": {
        ".write": "auth != null && (
          !data.exists() || 
          data.child('ownerId').val() === auth.uid
        )"
      }
    }
  }
}
```

**What these rules do:**
- `.read`: Any authenticated user can read from the students path (required for queries)
- `.indexOn`: Optimizes queries by ownerId
- `.write`: Users can only create new records or modify records where they are the owner

**After updating rules, click "Publish"** and wait a few seconds for the rules to take effect.

### Troubleshooting "Could not save student" errors:

1. **Check Database Rules** (most common issue):
   - Go to Firebase Console → Realtime Database → Rules tab
   - Make sure the rules are published as shown above
   - If you see `PERMISSION_DENIED` errors, your rules are incorrect

2. **Check Browser Console** (Press F12):
   - Look for specific error messages
   - Common errors:
     - `PERMISSION_DENIED` → Fix database rules
     - `Network error` → Check internet connection
     - `Firebase not initialized` → Check firebase-config.js

3. **Verify Firebase Config**:
   - Make sure `databaseURL` is included in `firebase-config.js`
   - The URL should match: `https://YOUR_PROJECT-default-rtdb.REGION.firebasedatabase.app`

4. **Check Authentication**:
   - Make sure you're logged in (email should show in top-left)
   - Try logging out and back in

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

- Data updates live via the Realtime Database's `on("value", ...)` listener — no manual refresh needed after add/edit/delete.
- All input is escaped before being rendered into the table to avoid HTML injection.
- No external UI libraries (no SweetAlert, Bootstrap, etc.) — only the official Firebase SDKs are loaded, via CDN `<script>` tags.
