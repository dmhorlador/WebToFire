# Notes App (Firebase)

A simple, responsive notes app with email/password authentication and
Cloud Firestore storage. No external JS libraries — just HTML, CSS, and
vanilla JavaScript modules, plus the Firebase SDK loaded from Google's CDN.

## Files

```
notes-app/
├── index.html          Login / Register screen
├── dashboard.html       Notes dashboard (create, edit, delete, search)
├── css/
│   └── style.css        All styling
├── js/
│   ├── firebase-config.js   Firebase init — put your project keys here
│   ├── auth.js               Login/register logic for index.html
│   └── app.js                 Dashboard logic (CRUD + search) for dashboard.html
└── README.md
```

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com and create a new project.
2. In **Build > Authentication > Sign-in method**, enable **Email/Password**.
3. In **Build > Firestore Database**, click **Create database** (start in
   production mode — the security rules below will lock it down properly).
4. In **Project settings > General > Your apps**, add a **Web app** and
   copy the config object it gives you.

## 2. Add your config

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

## 3. Firestore security rules

Notes are stored in a top-level `notes` collection, each document tagged
with the owner's `uid`. Use these rules so users can only read/write their
own notes (Firestore console > Firestore Database > Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read, update, delete: if request.auth != null
                                   && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null
                     && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

## 4. Run it

Because the JS files use ES modules (`type="module"`), open the project
through a local web server rather than a `file://` URL. For example:

```bash
cd notes-app
python3 -m http.server 8000
```

Then visit `http://localhost:8000/index.html`.

## Notes on the data model

Each note document in the `notes` collection has:

| field       | type      | description                          |
|-------------|-----------|---------------------------------------|
| `uid`       | string    | owner's Firebase Auth UID             |
| `title`     | string    | note title                            |
| `body`      | string    | note content                          |
| `createdAt` | timestamp | set once, on creation                 |
| `updatedAt` | timestamp | refreshed on every create/edit        |

Search filters client-side across `title` and `body` for the notes already
loaded for the signed-in user — no extra Firestore queries are needed.
