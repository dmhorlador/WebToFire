# TaskFlow — Productivity Web App

A complete, responsive productivity/task-management web app built with **HTML, CSS, vanilla JavaScript, Bootstrap 5, Bootstrap Icons, Firebase Authentication, and Cloud Firestore.**

## ✨ Features

- User Registration & Login (Firebase Authentication — Email/Password)
- Protected Dashboard (auto-redirects based on auth state)
- Create, Edit, and Delete tasks
- Mark tasks Completed / Pending
- Due dates (with optional due time) and overdue detection
- Priority levels: High, Medium, Low
- Live search across title & description
- Filter by status (All / Pending / Completed / Overdue) and priority
- Dark Mode with persisted preference (localStorage)
- Fully responsive layout (collapsible sidebar on mobile)
- Smooth animations and a polished, modern UI
- Real-time sync via Cloud Firestore `onSnapshot`

## 📁 Project Structure

```
productivity-app/
├── index.html          # Landing / marketing page
├── login.html           # Login page
├── register.html        # Registration page
├── dashboard.html        # Main app (protected)
├── css/
│   └── style.css         # All custom styles, theming, animations
├── js/
│   ├── firebase-config.js  # <-- put your Firebase config here
│   ├── main.js              # Shared theme toggle / loader (public pages)
│   ├── auth.js               # Register / login / logout / route guard
│   └── dashboard.js           # Task CRUD, filters, search, stats
└── assets/
    ├── icons/
    └── img/
```

## 🚀 Setup Instructions

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** and follow the steps.
3. Once created, click the **Web (`</>`)** icon to register a new web app.
4. Copy the `firebaseConfig` object shown.

### 2. Add Your Config
Open `js/firebase-config.js` and replace the placeholder values:

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

### 3. Enable Authentication
In the Firebase Console → **Authentication** → **Sign-in method** → enable **Email/Password**.

### 4. Create a Firestore Database
In the Firebase Console → **Firestore Database** → **Create database** (start in test mode for local development).

### 5. Set Firestore Security Rules
Go to **Firestore Database → Rules** and paste:

```
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
```

### 6. Run the App
Because this is a static site, you can open it with any local web server, for example:

```bash
# Using Python
python3 -m http.server 5500

# Or using VS Code's "Live Server" extension
```

Then visit `http://localhost:5500/index.html`.

> Note: Opening `index.html` directly via `file://` may cause issues with Firebase auth persistence in some browsers — a local server is recommended.

## 🗂 Firestore Data Model

**Collection: `tasks`**

| Field         | Type      | Description                          |
|---------------|-----------|---------------------------------------|
| uid           | string    | Owner's Firebase Auth UID             |
| title         | string    | Task title                            |
| description   | string    | Optional details                      |
| dueDate       | string    | `YYYY-MM-DD`                          |
| dueTime       | string/null | `HH:MM` (optional)                  |
| priority      | string    | `high` \| `medium` \| `low`           |
| completed     | boolean   | Task status                           |
| createdAt     | timestamp | Server timestamp                      |
| updatedAt     | timestamp | Server timestamp                      |
| completedAt   | timestamp/null | Server timestamp when completed  |

**Collection: `users`**

| Field      | Type      | Description        |
|------------|-----------|---------------------|
| name       | string    | Display name        |
| email      | string    | Email address        |
| createdAt  | timestamp | Server timestamp     |

## 🎨 Tech Stack

- **Bootstrap 5.3** (CDN) — layout & components
- **Bootstrap Icons 1.11** (CDN) — iconography
- **Google Fonts (Poppins)**
- **Firebase 10 (compat SDK)** — Authentication + Firestore
- Vanilla JavaScript (no build tools required)

## 📄 License

Free to use and modify for personal or commercial projects.
