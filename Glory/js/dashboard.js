/* ==========================================================================
   dashboard.js
   Wires up the dashboard UI: auth guard, real-time student list, search,
   filtering, and the add / edit / delete modals.
   Relies on `auth`, `db` from firebase-config.js and the helpers in
   students.js (addStudent, updateStudent, deleteStudent, listenToStudents)
   ========================================================================== */

let allStudents = [];
let unsubscribeStudents = null;
let studentPendingDelete = null;

/* ------------------------------ DOM refs ------------------------------ */

const currentUserEmailEl = document.getElementById("currentUserEmail");
const logoutBtn = document.getElementById("logoutBtn");
const alertBox = document.getElementById("alertBox");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const studentsTableBody = document.getElementById("studentsTableBody");
const emptyState = document.getElementById("emptyState");

const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statInactive = document.getElementById("statInactive");
const statCourses = document.getElementById("statCourses");

const studentModalBackdrop = document.getElementById("studentModalBackdrop");
const studentModalTitle = document.getElementById("studentModalTitle");
const studentForm = document.getElementById("studentForm");
const studentFormAlert = document.getElementById("studentFormAlert");
const openAddModalBtn = document.getElementById("openAddModalBtn");
const addStudentNavBtn = document.getElementById("addStudentNavBtn");
const closeStudentModalBtn = document.getElementById("closeStudentModalBtn");
const cancelStudentFormBtn = document.getElementById("cancelStudentFormBtn");
const saveStudentBtn = document.getElementById("saveStudentBtn");
const saveStudentBtnText = document.getElementById("saveStudentBtnText");

const deleteModalBackdrop = document.getElementById("deleteModalBackdrop");
const deleteStudentNameEl = document.getElementById("deleteStudentName");
const closeDeleteModalBtn = document.getElementById("closeDeleteModalBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const confirmDeleteBtnText = document.getElementById("confirmDeleteBtnText");

/* ------------------------------ Auth guard ----------------------------- */

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUserEmailEl.textContent = user.email;

  unsubscribeStudents = listenToStudents(
    (students) => {
      allStudents = students;
      renderStudents();
    },
    () => {
      studentsTableBody.innerHTML =
        '<tr class="loading-row"><td colspan="6">Could not load students. Please refresh.</td></tr>';
    }
  );
});

logoutBtn.addEventListener("click", async () => {
  if (unsubscribeStudents) unsubscribeStudents();
  await auth.signOut();
  window.location.href = "index.html";
});

/* ------------------------------ Rendering ------------------------------ */

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
  return initials.join("") || "?";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function getFilteredStudents() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  return allStudents.filter((s) => {
    const matchesQuery =
      !query ||
      s.name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.course?.toLowerCase().includes(query);

    const matchesStatus = status === "all" || s.status === status;

    return matchesQuery && matchesStatus;
  });
}

function renderStudents() {
  const filtered = getFilteredStudents();

  updateStats();

  if (filtered.length === 0) {
    studentsTableBody.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  // Sort alphabetically by name for a stable, predictable list.
  const sorted = [...filtered].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );

  studentsTableBody.innerHTML = sorted
    .map((s) => {
      const statusClass = s.status === "Active" ? "badge-active" : "badge-inactive";
      return `
        <tr>
          <td>
            <span class="avatar-chip">${escapeHtml(getInitials(s.name))}</span>
            ${escapeHtml(s.name)}
          </td>
          <td>${escapeHtml(s.email)}</td>
          <td>${escapeHtml(s.course)}</td>
          <td>${escapeHtml(s.year)}</td>
          <td><span class="badge ${statusClass}">${escapeHtml(s.status)}</span></td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" data-action="edit" data-id="${s.id}" type="button">Edit</button>
              <button class="icon-btn danger" data-action="delete" data-id="${s.id}" type="button">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function updateStats() {
  const total = allStudents.length;
  const active = allStudents.filter((s) => s.status === "Active").length;
  const inactive = total - active;
  const courses = new Set(allStudents.map((s) => s.course).filter(Boolean)).size;

  statTotal.textContent = total;
  statActive.textContent = active;
  statInactive.textContent = inactive;
  statCourses.textContent = courses;
}

searchInput.addEventListener("input", renderStudents);
statusFilter.addEventListener("change", renderStudents);

/* Row action clicks (event delegation) */
studentsTableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const student = allStudents.find((s) => s.id === id);
  if (!student) return;

  if (btn.dataset.action === "edit") {
    openEditModal(student);
  } else if (btn.dataset.action === "delete") {
    openDeleteModal(student);
  }
});

/* ------------------------- Add / Edit modal ------------------------- */

function openAddModal() {
  studentModalTitle.textContent = "Add Student";
  saveStudentBtnText.textContent = "Save Student";
  studentForm.reset();
  document.getElementById("studentId").value = "";
  document.getElementById("studentStatus").value = "Active";
  hideAlert(studentFormAlert);
  studentModalBackdrop.classList.add("show");
  document.getElementById("studentName").focus();
}

function openEditModal(student) {
  studentModalTitle.textContent = "Edit Student";
  saveStudentBtnText.textContent = "Update Student";
  hideAlert(studentFormAlert);

  document.getElementById("studentId").value = student.id;
  document.getElementById("studentName").value = student.name || "";
  document.getElementById("studentEmail").value = student.email || "";
  document.getElementById("studentPhone").value = student.phone || "";
  document.getElementById("studentCourse").value = student.course || "";
  document.getElementById("studentYear").value = student.year || "";
  document.getElementById("studentStatus").value = student.status || "Active";

  studentModalBackdrop.classList.add("show");
  document.getElementById("studentName").focus();
}

function closeStudentModal() {
  studentModalBackdrop.classList.remove("show");
  studentForm.reset();
}

openAddModalBtn.addEventListener("click", openAddModal);
addStudentNavBtn.addEventListener("click", openAddModal);
closeStudentModalBtn.addEventListener("click", closeStudentModal);
cancelStudentFormBtn.addEventListener("click", closeStudentModal);

studentModalBackdrop.addEventListener("click", (e) => {
  if (e.target === studentModalBackdrop) closeStudentModal();
});

studentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert(studentFormAlert);

  const id = document.getElementById("studentId").value;
  const data = {
    name: document.getElementById("studentName").value.trim(),
    email: document.getElementById("studentEmail").value.trim(),
    phone: document.getElementById("studentPhone").value.trim(),
    course: document.getElementById("studentCourse").value.trim(),
    year: document.getElementById("studentYear").value,
    status: document.getElementById("studentStatus").value
  };

  if (!data.name || !data.email || !data.course || !data.year) {
    showAlert(studentFormAlert, "Please fill in all required fields.");
    return;
  }

  saveStudentBtn.disabled = true;
  saveStudentBtnText.textContent = id ? "Updating…" : "Saving…";

  try {
    if (id) {
      await updateStudent(id, data);
      showDashboardAlert("Student updated successfully.");
    } else {
      await addStudent(data);
      showDashboardAlert("Student added successfully.");
    }
    closeStudentModal();
  } catch (error) {
    console.error("Error saving student:", error);
    let errorMessage = "Could not save student. Please try again.";
    
    // Provide more specific error messages based on error code
    if (error.code === "PERMISSION_DENIED" || error.message?.includes("permission")) {
      errorMessage = "Permission denied. Please check your database security rules.";
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    showAlert(studentFormAlert, errorMessage);
  } finally {
    saveStudentBtn.disabled = false;
    saveStudentBtnText.textContent = id ? "Update Student" : "Save Student";
  }
});

/* ----------------------------- Delete modal ----------------------------- */

function openDeleteModal(student) {
  studentPendingDelete = student;
  deleteStudentNameEl.textContent = student.name || "this student";
  deleteModalBackdrop.classList.add("show");
}

function closeDeleteModal() {
  studentPendingDelete = null;
  deleteModalBackdrop.classList.remove("show");
}

closeDeleteModalBtn.addEventListener("click", closeDeleteModal);
cancelDeleteBtn.addEventListener("click", closeDeleteModal);

deleteModalBackdrop.addEventListener("click", (e) => {
  if (e.target === deleteModalBackdrop) closeDeleteModal();
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!studentPendingDelete) return;

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtnText.textContent = "Deleting…";

  try {
    await deleteStudent(studentPendingDelete.id);
    showDashboardAlert("Student deleted successfully.");
    closeDeleteModal();
  } catch (error) {
    console.error(error);
    showDashboardAlert("Could not delete student. Please try again.", true);
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtnText.textContent = "Delete";
  }
});

/* ------------------------------- Alerts ------------------------------- */

function showAlert(el, message) {
  el.textContent = message;
  el.classList.add("show");
}

function hideAlert(el) {
  el.classList.remove("show");
  el.textContent = "";
}

function showDashboardAlert(message, isError = false) {
  alertBox.className = "alert " + (isError ? "alert-error" : "alert-success") + " show";
  alertBox.textContent = message;
  setTimeout(() => hideAlert(alertBox), 3500);
}

/* Keyboard: close modals with Escape */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (studentModalBackdrop.classList.contains("show")) closeStudentModal();
  if (deleteModalBackdrop.classList.contains("show")) closeDeleteModal();
});
