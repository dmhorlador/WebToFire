/* ============================================================
   TaskFlow — Dashboard Logic
   Handles: Firestore CRUD, real-time sync, search, filters,
   stats, dark mode, sidebar, and modals.
   ============================================================ */

const THEME_KEY = "taskflow-theme";

let allTasks = [];          // full task list from Firestore (this user)
let currentStatusFilter = "all";
let currentPriorityFilter = "all";
let currentSearchTerm = "";
let editingTaskId = null;
let deleteTargetId = null;
let unsubscribeTasks = null;

/* ============================================================
   THEME (dark mode) — persisted + synced with sidebar label
   ============================================================ */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = document.querySelector("#themeToggle i");
  if (icon) icon.className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";

  const sidebarIcon = document.querySelector("#toggleThemeSidebar i");
  const themeLabel = document.getElementById("themeLabel");
  if (sidebarIcon) sidebarIcon.className = theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars";
  if (themeLabel) themeLabel.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

/* ============================================================
   INIT ON AUTH STATE
   ============================================================ */
auth.onAuthStateChanged(function (user) {
  const loader = document.getElementById("pageLoader");
  if (!user) {
    // auth.js already redirects to login.html; just stop here.
    return;
  }

  // Populate user info
  const displayName = user.displayName || (user.email ? user.email.split("@")[0] : "User");
  document.getElementById("userName").textContent = displayName;
  document.getElementById("userAvatar").textContent = displayName.charAt(0).toUpperCase();
  document.getElementById("greetingText").textContent = `Welcome back, ${displayName.split(" ")[0]} 👋`;
  document.getElementById("todayDate").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  subscribeToTasks(user.uid);

  if (loader) setTimeout(() => loader.classList.add("hidden"), 300);
});

/* ============================================================
   REALTIME DATABASE — Real-time subscription
   ============================================================ */
function subscribeToTasks(uid) {
  if (unsubscribeTasks) unsubscribeTasks();

  const tasksRef = db.ref("tasks/" + uid);

  const listener = tasksRef.on("value", function (snapshot) {
    const data = snapshot.val() || {};
    allTasks = Object.entries(data).map(([id, task]) => ({ id, ...task }));
    // Sort client-side: incomplete first, then by due date ascending
    allTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.dueDate || "").localeCompare(b.dueDate || "");
    });
    renderTasks();
    renderStats();
  }, function (error) {
    console.error(error);
    showAlert("Could not load tasks: " + error.message, "danger");
  });

  // Return an unsubscribe function
  unsubscribeTasks = () => tasksRef.off("value", listener);
}

/* ============================================================
   CREATE / UPDATE TASK
   ============================================================ */
const taskForm = document.getElementById("taskForm");
taskForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const dueDate = document.getElementById("taskDueDate").value;
  const dueTime = document.getElementById("taskDueTime").value;
  const priority = document.querySelector('input[name="priority"]:checked').value;
  const saveBtn = document.getElementById("saveTaskBtn");

  if (!title) {
    showAlert("Please enter a task title.", "warning");
    return;
  }
  if (!dueDate) {
    showAlert("Please select a due date.", "warning");
    return;
  }

  const user = auth.currentUser;
  if (!user) return;

  setButtonLoading(saveBtn, true);

  const taskData = {
    uid: user.uid,
    title,
    description,
    dueDate,
    dueTime: dueTime || null,
    priority,
    updatedAt: Date.now()
  };

  try {
    if (editingTaskId) {
      await db.ref("tasks/" + user.uid + "/" + editingTaskId).update(taskData);
      showAlert("Task updated successfully!", "success");
    } else {
      taskData.completed = false;
      taskData.createdAt = Date.now();
      await db.ref("tasks/" + user.uid).push(taskData);
      showAlert("Task added successfully!", "success");
    }
    bootstrap.Modal.getInstance(document.getElementById("taskModal")).hide();
    resetTaskForm();
  } catch (error) {
    console.error(error);
    showAlert("Error saving task: " + error.message, "danger");
  } finally {
    setButtonLoading(saveBtn, false);
  }
});

function resetTaskForm() {
  taskForm.reset();
  editingTaskId = null;
  document.getElementById("taskId").value = "";
  document.getElementById("taskModalLabel").innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add New Task';
  document.querySelectorAll(".priority-option").forEach(el => el.classList.remove("selected"));
  document.querySelector(".priority-option.p-low").classList.add("selected");
  document.querySelector('input[name="priority"][value="low"]').checked = true;
}

// Reset form whenever the "Add Task" button opens a fresh modal
document.getElementById("openAddTaskBtn").addEventListener("click", resetTaskForm);

// Priority selector visual state
document.querySelectorAll('input[name="priority"]').forEach(radio => {
  radio.addEventListener("change", function () {
    document.querySelectorAll(".priority-option").forEach(el => el.classList.remove("selected"));
    this.closest(".priority-option").classList.add("selected");
  });
});

/* ============================================================
   EDIT TASK
   ============================================================ */
function openEditTask(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  editingTaskId = taskId;
  document.getElementById("taskId").value = taskId;
  document.getElementById("taskTitle").value = task.title || "";
  document.getElementById("taskDescription").value = task.description || "";
  document.getElementById("taskDueDate").value = task.dueDate || "";
  document.getElementById("taskDueTime").value = task.dueTime || "";

  document.querySelectorAll(".priority-option").forEach(el => el.classList.remove("selected"));
  const priorityInput = document.querySelector(`input[name="priority"][value="${task.priority || "low"}"]`);
  if (priorityInput) {
    priorityInput.checked = true;
    priorityInput.closest(".priority-option").classList.add("selected");
  }

  document.getElementById("taskModalLabel").innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Task';
  new bootstrap.Modal(document.getElementById("taskModal")).show();
}

/* ============================================================
   DELETE TASK
   ============================================================ */
function openDeleteModal(taskId) {
  deleteTargetId = taskId;
  new bootstrap.Modal(document.getElementById("deleteModal")).show();
}

document.getElementById("confirmDeleteBtn").addEventListener("click", async function () {
  if (!deleteTargetId) return;
  const btn = this;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Deleting...';

  try {
    await db.ref("tasks/" + auth.currentUser.uid + "/" + deleteTargetId).remove();
    showAlert("Task deleted.", "success");
    bootstrap.Modal.getInstance(document.getElementById("deleteModal")).hide();
  } catch (error) {
    console.error(error);
    showAlert("Error deleting task: " + error.message, "danger");
  } finally {
    deleteTargetId = null;
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
});

/* ============================================================
   TOGGLE COMPLETE / PENDING
   ============================================================ */
async function toggleTaskComplete(taskId, currentStatus) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await db.ref("tasks/" + user.uid + "/" + taskId).update({
      completed: !currentStatus,
      completedAt: !currentStatus ? Date.now() : null
    });
  } catch (error) {
    console.error(error);
    showAlert("Error updating task: " + error.message, "danger");
  }
}

/* ============================================================
   HELPERS: due date status
   ============================================================ */
function getDueStatus(task) {
  if (task.completed) return "completed";
  if (!task.dueDate) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate + "T00:00:00");
  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "upcoming";
}

function formatDueDate(task) {
  if (!task.dueDate) return "No due date";
  const due = new Date(task.dueDate + "T00:00:00");
  const options = { month: "short", day: "numeric", year: "numeric" };
  let str = due.toLocaleDateString(undefined, options);
  if (task.dueTime) {
    const [h, m] = task.dueTime.split(":");
    const d = new Date();
    d.setHours(h, m);
    str += " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return str;
}

/* ============================================================
   RENDER: STATS
   ============================================================ */
function renderStats() {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.completed).length;
  const pending = allTasks.filter(t => !t.completed).length;
  const overdue = allTasks.filter(t => getDueStatus(t) === "overdue").length;

  animateCount("statTotal", total);
  animateCount("statCompleted", completed);
  animateCount("statPending", pending);
  animateCount("statOverdue", overdue);
}

function animateCount(elId, target) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = target;
}

/* ============================================================
   RENDER: TASK LIST (applies search + filters)
   ============================================================ */
function renderTasks() {
  const listEl = document.getElementById("taskList");
  let filtered = allTasks.filter(task => {
    // Status filter
    const dueStatus = getDueStatus(task);
    if (currentStatusFilter === "pending" && task.completed) return false;
    if (currentStatusFilter === "completed" && !task.completed) return false;
    if (currentStatusFilter === "overdue" && dueStatus !== "overdue") return false;

    // Priority filter
    if (currentPriorityFilter !== "all" && task.priority !== currentPriorityFilter) return false;

    // Search
    if (currentSearchTerm) {
      const term = currentSearchTerm.toLowerCase();
      const inTitle = (task.title || "").toLowerCase().includes(term);
      const inDesc = (task.description || "").toLowerCase().includes(term);
      if (!inTitle && !inDesc) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-clipboard-x"></i>
        <h5 class="fw-semibold">No tasks found</h5>
        <p class="mb-0">Try adjusting your filters or search, or add a new task.</p>
      </div>`;
    return;
  }

  listEl.innerHTML = filtered.map((task, index) => renderTaskCard(task, index)).join("");
}

function renderTaskCard(task, index) {
  const dueStatus = getDueStatus(task);
  const priority = task.priority || "low";
  const overdueClass = dueStatus === "overdue" ? "overdue" : "";
  const delay = Math.min(index * 0.04, 0.4);

  const dueIcon = dueStatus === "overdue" ? "bi-exclamation-circle-fill" : "bi-calendar3";

  return `
    <div class="task-card priority-${priority} ${task.completed ? "completed" : ""}" style="animation-delay:${delay}s">
      <div class="task-card-header">
        <div class="flex-grow-1">
          <div class="task-title">${escapeHtml(task.title)}</div>
        </div>
        <span class="badge-priority ${priority}">${priority}</span>
      </div>
      ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ""}
      <div class="task-meta">
        <span class="badge-due ${overdueClass}"><i class="bi ${dueIcon}"></i> ${formatDueDate(task)}</span>
        ${task.completed ? '<span class="badge-due"><i class="bi bi-check-circle-fill text-success"></i> Completed</span>' : ""}
        ${dueStatus === "overdue" ? '<span class="badge-due overdue">Overdue</span>' : ""}
      </div>
      <div class="task-actions">
        <button class="task-icon-btn complete-btn" title="${task.completed ? "Mark as pending" : "Mark as complete"}" onclick="toggleTaskComplete('${task.id}', ${task.completed})">
          <i class="bi ${task.completed ? "bi-arrow-counterclockwise" : "bi-check-lg"}"></i>
        </button>
        <button class="task-icon-btn edit-btn" title="Edit task" onclick="openEditTask('${task.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="task-icon-btn delete-btn" title="Delete task" onclick="openDeleteModal('${task.id}')">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

/* ============================================================
   SEARCH & FILTER EVENT LISTENERS
   ============================================================ */
document.getElementById("searchInput").addEventListener("input", function () {
  currentSearchTerm = this.value.trim();
  renderTasks();
});

document.getElementById("filterPills").addEventListener("click", function (e) {
  const pill = e.target.closest(".filter-pill");
  if (!pill) return;
  document.querySelectorAll("#filterPills .filter-pill").forEach(p => p.classList.remove("active"));
  pill.classList.add("active");
  currentStatusFilter = pill.dataset.status;
  syncSidebarActive(currentStatusFilter);
  renderTasks();
});

document.getElementById("priorityFilterPills").addEventListener("click", function (e) {
  const pill = e.target.closest(".filter-pill");
  if (!pill) return;
  document.querySelectorAll("#priorityFilterPills .filter-pill").forEach(p => p.classList.remove("active"));
  pill.classList.add("active");
  currentPriorityFilter = pill.dataset.priority;
  renderTasks();
});

/* ---------- Sidebar filter links ---------- */
document.querySelectorAll(".sidebar-link[data-filter]").forEach(link => {
  link.addEventListener("click", function () {
    const filter = this.dataset.filter;
    currentStatusFilter = filter;
    document.querySelectorAll("#filterPills .filter-pill").forEach(p => {
      p.classList.toggle("active", p.dataset.status === filter);
    });
    syncSidebarActive(filter);
    renderTasks();
    closeSidebarOnMobile();
  });
});

document.querySelectorAll(".sidebar-link[data-priority-filter]").forEach(link => {
  link.addEventListener("click", function () {
    const priority = this.dataset.priorityFilter;
    currentPriorityFilter = priority;
    document.querySelectorAll("#priorityFilterPills .filter-pill").forEach(p => {
      p.classList.toggle("active", p.dataset.priority === priority);
    });
    renderTasks();
    closeSidebarOnMobile();
  });
});

function syncSidebarActive(filter) {
  document.querySelectorAll(".sidebar-link[data-filter]").forEach(link => {
    link.classList.toggle("active", link.dataset.filter === filter);
  });
}

/* ============================================================
   SIDEBAR TOGGLE (mobile)
   ============================================================ */
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");

if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener("click", function () {
    sidebar.classList.toggle("open");
    sidebarBackdrop.classList.toggle("show");
  });
}
if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener("click", closeSidebarOnMobile);
}
function closeSidebarOnMobile() {
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("show");
}

/* ============================================================
   THEME TOGGLE BUTTONS
   ============================================================ */
document.getElementById("themeToggle").addEventListener("click", toggleTheme);
document.getElementById("toggleThemeSidebar").addEventListener("click", toggleTheme);

/* ============================================================
   LOGOUT
   ============================================================ */
document.getElementById("logoutBtn").addEventListener("click", function () {
  if (unsubscribeTasks) unsubscribeTasks();
  logoutUser();
});

/* ============================================================
   BUTTON LOADING HELPER (shared pattern with auth.js)
   ============================================================ */
function setButtonLoading(btn, loading) {
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-border");
  btn.disabled = loading;
  if (spinner) spinner.classList.toggle("d-none", !loading);
  if (text) text.style.opacity = loading ? "0.7" : "1";
}

/* ============================================================
   INIT
   ============================================================ */
initTheme();

// Default due date to today in the add-task form for convenience
document.addEventListener("DOMContentLoaded", function () {
  const dueDateInput = document.getElementById("taskDueDate");
  if (dueDateInput) {
    const today = new Date().toISOString().split("T")[0];
    dueDateInput.min = "";
    dueDateInput.value = today;
  }
});
