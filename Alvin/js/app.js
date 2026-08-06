// app.js
// Handles the notes dashboard: auth guard, create/read/update/delete
// notes in Cloud Firestore, live search, and logout.

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------------------------------------------------------------------
// Element references
// ---------------------------------------------------------------------
const userEmailEl = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const newNoteBtn = document.getElementById("newNoteBtn");
const searchInput = document.getElementById("searchInput");

const notesGrid = document.getElementById("notesGrid");
const emptyState = document.getElementById("emptyState");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const noteForm = document.getElementById("noteForm");
const noteTitleInput = document.getElementById("noteTitle");
const noteBodyInput = document.getElementById("noteBody");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
let currentUser = null;
let unsubscribeNotes = null;
let allNotes = [];       // full list of notes for the current user
let editingNoteId = null; // null = creating a new note

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
// Firestore: live subscription to the current user's notes
// ---------------------------------------------------------------------
function subscribeToNotes() {
  const notesRef = collection(db, "notes");
  const notesQuery = query(
    notesRef,
    where("uid", "==", currentUser.uid),
    orderBy("updatedAt", "desc")
  );

  unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
    allNotes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    (n.body || "").toLowerCase().includes(t)
  );
}

searchInput.addEventListener("input", () => {
  renderNotes(filterNotes(searchInput.value));
});

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
function formatDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return "";
  const d = timestamp.toDate();
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
        <button class="btn-edit" data-id="${note.id}">Edit</button>
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
// Modal open/close
// ---------------------------------------------------------------------
function openCreateModal() {
  editingNoteId = null;
  modalTitle.textContent = "New note";
  noteTitleInput.value = "";
  noteBodyInput.value = "";
  modalOverlay.classList.remove("hidden");
  noteTitleInput.focus();
}

function openEditModal(noteId) {
  const note = allNotes.find((n) => n.id === noteId);
  if (!note) return;
  editingNoteId = noteId;
  modalTitle.textContent = "Edit note";
  noteTitleInput.value = note.title || "";
  noteBodyInput.value = note.body || "";
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
  const body = noteBodyInput.value.trim();
  if (!title) return;

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    if (editingNoteId) {
      // Update existing note
      const noteRef = doc(db, "notes", editingNoteId);
      await updateDoc(noteRef, {
        title,
        body,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new note
      const notesRef = collection(db, "notes");
      await addDoc(notesRef, {
        uid: currentUser.uid,
        title,
        body,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
    await deleteDoc(doc(db, "notes", noteId));
  } catch (error) {
    console.error("Error deleting note:", error);
    alert("Could not delete the note. Please try again.");
  }
}
