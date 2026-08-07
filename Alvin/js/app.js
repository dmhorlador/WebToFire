// app.js
// Handles the notes dashboard: auth guard, create/read/update/delete
// notes in Firebase Realtime Database, live search, and logout.

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  ref,
  push,
  update,
  remove,
  onValue,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ---------------------------------------------------------------------
// Element references
// ---------------------------------------------------------------------
const userEmailEl   = document.getElementById("userEmail");
const logoutBtn     = document.getElementById("logoutBtn");
const newNoteBtn    = document.getElementById("newNoteBtn");
const searchInput   = document.getElementById("searchInput");

const notesGrid     = document.getElementById("notesGrid");
const emptyState    = document.getElementById("emptyState");

const modalOverlay  = document.getElementById("modalOverlay");
const modalTitle    = document.getElementById("modalTitle");
const noteForm      = document.getElementById("noteForm");
const noteTitleInput = document.getElementById("noteTitle");
const noteBodyInput  = document.getElementById("noteBody");
const cancelBtn     = document.getElementById("cancelBtn");
const saveBtn       = document.getElementById("saveBtn");

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
let currentUser    = null;
let unsubscribeNotes = null; // holds the RTDB off() function
let allNotes       = [];     // full list of notes for the current user
let editingNoteId  = null;   // null = creating a new note

// ---------------------------------------------------------------------
// Auth guard: redirect to login if not signed in
// ---------------------------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  userEmailEl.textContent = user.email;
  subscribeToNotes();
});

logoutBtn.addEventListener("click", async () => {
  if (unsubscribeNotes) unsubscribeNotes();
  await signOut(auth);
  window.location.href = "index.html";
});

// ---------------------------------------------------------------------
// Realtime Database: live subscription to the current user's notes
// Data path: /notes/<uid>/<noteId>
// ---------------------------------------------------------------------
function subscribeToNotes() {
  const notesRef = ref(db, `notes/${currentUser.uid}`);

  // onValue returns an unsubscribe function
  unsubscribeNotes = onValue(notesRef, (snapshot) => {
    allNotes = [];
    snapshot.forEach((child) => {
      allNotes.push({ id: child.key, ...child.val() });
    });

    // Sort by updatedAt descending (most recently updated first)
    allNotes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    renderNotes(filterNotes(searchInput.value));
  }, (error) => {
    console.error("Error loading notes:", error);
  });
}

// ---------------------------------------------------------------------
// Search / filter
// ---------------------------------------------------------------------
function filterNotes(term) {
  const t = term.trim().toLowerCase();
  if (!t) return allNotes;
  return allNotes.filter((n) =>
    (n.title || "").toLowerCase().includes(t) ||
    (n.body  || "").toLowerCase().includes(t)
  );
}

searchInput.addEventListener("input", () => {
  renderNotes(filterNotes(searchInput.value));
});

// ---------------------------------------------------------------------
// Rendering
// RTDB timestamps are plain numbers (ms since epoch), not Firestore
// Timestamp objects, so we use new Date(timestamp) directly.
// ---------------------------------------------------------------------
function formatDate(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function renderNotes(notes) {
  notesGrid.innerHTML = "";

  if (notes.length === 0) {
    emptyState.classList.remove("hidden");
    notesGrid.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  notesGrid.classList.remove("hidden");

  notes.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card";
    card.innerHTML = `
      <div class="note-title">${escapeHtml(note.title)}</div>
      <div class="note-body">${escapeHtml(note.body)}</div>
      <div class="note-meta">${formatDate(note.updatedAt)}</div>
      <div class="note-actions">
        <button class="btn-edit"   data-id="${note.id}">Edit</button>
        <button class="btn-delete" data-id="${note.id}">Delete</button>
      </div>
    `;
    notesGrid.appendChild(card);
  });

  // Wire up action buttons
  notesGrid.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });
  notesGrid.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.id));
  });
}

// ---------------------------------------------------------------------
// Modal open / close
// ---------------------------------------------------------------------
function openCreateModal() {
  editingNoteId = null;
  modalTitle.textContent = "New note";
  noteTitleInput.value = "";
  noteBodyInput.value  = "";
  modalOverlay.classList.remove("hidden");
  noteTitleInput.focus();
}

function openEditModal(noteId) {
  const note = allNotes.find((n) => n.id === noteId);
  if (!note) return;
  editingNoteId = noteId;
  modalTitle.textContent = "Edit note";
  noteTitleInput.value = note.title || "";
  noteBodyInput.value  = note.body  || "";
  modalOverlay.classList.remove("hidden");
  noteTitleInput.focus();
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  editingNoteId = null;
  noteForm.reset();
}

newNoteBtn.addEventListener("click", openCreateModal);
cancelBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ---------------------------------------------------------------------
// Create / Update
// ---------------------------------------------------------------------
noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = noteTitleInput.value.trim();
  const body  = noteBodyInput.value.trim();
  if (!title) return;

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const now = serverTimestamp();

    if (editingNoteId) {
      // Update existing note at /notes/<uid>/<noteId>
      const noteRef = ref(db, `notes/${currentUser.uid}/${editingNoteId}`);
      await update(noteRef, { title, body, updatedAt: now });
    } else {
      // Create new note under /notes/<uid>/
      const userNotesRef = ref(db, `notes/${currentUser.uid}`);
      await push(userNotesRef, {
        title,
        body,
        createdAt: now,
        updatedAt: now
      });
    }
    closeModal();
  } catch (error) {
    console.error("Error saving note:", error);
    alert("Could not save the note. Please try again.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save note";
  }
});

// ---------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------
async function handleDelete(noteId) {
  const confirmed = confirm("Delete this note? This cannot be undone.");
  if (!confirmed) return;

  try {
    await remove(ref(db, `notes/${currentUser.uid}/${noteId}`));
  } catch (error) {
    console.error("Error deleting note:", error);
    alert("Could not delete the note. Please try again.");
  }
}
