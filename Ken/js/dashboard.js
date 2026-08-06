// ============================================
// DASHBOARD LOGIC (dashboard.html)
// ============================================

let currentUser = null;
let allExpenses = [];
let editingId = null;
let unsubscribeExpenses = null;

// --- DOM references ---
const expensesBody = document.getElementById('expensesBody');
const emptyState = document.getElementById('emptyState');
const tableWrapper = document.querySelector('.table-wrapper');
const searchInput = document.getElementById('searchInput');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const expenseModal = document.getElementById('expenseModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const expenseForm = document.getElementById('expenseForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userGreeting = document.getElementById('userGreeting');
const toast = document.getElementById('toast');

const totalExpensesEl = document.getElementById('totalExpenses');
const monthExpensesEl = document.getElementById('monthExpenses');
const totalCountEl = document.getElementById('totalCount');

// ---- Auth Guard ----
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = 'index.html';
  } else {
    currentUser = user;
    userGreeting.textContent = `Hello, ${user.displayName || user.email}`;
    loadExpenses();
  }
});

// ---- Load expenses in real time ----
function loadExpenses() {
  if (unsubscribeExpenses) unsubscribeExpenses();

  unsubscribeExpenses = db.collection('expenses')
    .where('userId', '==', currentUser.uid)
    .orderBy('date', 'desc')
    .onSnapshot(snapshot => {
      allExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      applyFilter();
    }, err => {
      console.error(err);
      showToast('Failed to load expenses: ' + err.message, 'error');
    });
}

// ---- Search Filter ----
function applyFilter() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = term
    ? allExpenses.filter(exp =>
        exp.title.toLowerCase().includes(term) ||
        exp.category.toLowerCase().includes(term))
    : allExpenses;

  renderExpenses(filtered);
  updateSummary();
}

searchInput.addEventListener('input', applyFilter);

// ---- Summary Calculations ----
function updateSummary() {
  const total = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const now = new Date();

  const monthTotal = allExpenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  totalExpensesEl.textContent = '$' + total.toFixed(2);
  monthExpensesEl.textContent = '$' + monthTotal.toFixed(2);
  totalCountEl.textContent = allExpenses.length;
}

// ---- Render Table ----
function renderExpenses(expenses) {
  expensesBody.innerHTML = '';

  if (expenses.length === 0) {
    emptyState.style.display = 'flex';
    tableWrapper.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  tableWrapper.style.display = 'block';

  expenses.forEach(exp => {
    const tr = document.createElement('tr');
    const catClass = escapeHtml((exp.category || 'other').toLowerCase());

    tr.innerHTML = `
      <td data-label="Title">${escapeHtml(exp.title)}</td>
      <td data-label="Category"><span class="badge badge-${catClass}">${escapeHtml(exp.category)}</span></td>
      <td data-label="Amount" class="amount-cell">$${Number(exp.amount).toFixed(2)}</td>
      <td data-label="Date">${formatDate(exp.date)}</td>
      <td data-label="Actions" class="actions-cell">
        <button class="icon-btn edit-btn" data-id="${exp.id}">Edit</button>
        <button class="icon-btn delete-btn" data-id="${exp.id}">Delete</button>
      </td>
    `;
    expensesBody.appendChild(tr);
  });

  document.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', () => openEditModal(btn.dataset.id))
  );
  document.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteExpense(btn.dataset.id))
  );
}

// ---- Modal Handling ----
function openAddModal() {
  editingId = null;
  modalTitle.textContent = 'Add Expense';
  submitBtn.textContent = 'Add Expense';
  expenseForm.reset();
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  expenseModal.classList.add('active');
}

function openEditModal(id) {
  const exp = allExpenses.find(e => e.id === id);
  if (!exp) return;

  editingId = id;
  modalTitle.textContent = 'Edit Expense';
  submitBtn.textContent = 'Save Changes';

  document.getElementById('title').value = exp.title;
  document.getElementById('amount').value = exp.amount;
  document.getElementById('category').value = exp.category;
  document.getElementById('date').value = exp.date;
  document.getElementById('notes').value = exp.notes || '';

  expenseModal.classList.add('active');
}

function closeModal() {
  expenseModal.classList.remove('active');
  expenseForm.reset();
  editingId = null;
}

addExpenseBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
expenseModal.addEventListener('click', (e) => {
  if (e.target === expenseModal) closeModal();
});

// ---- Add / Edit Submit ----
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const notes = document.getElementById('notes').value.trim();

  if (!title || isNaN(amount) || amount <= 0 || !date) {
    showToast('Please fill in all required fields correctly.', 'error');
    return;
  }

  const data = { title, amount, category, date, notes, userId: currentUser.uid };

  submitBtn.disabled = true;
  try {
    if (editingId) {
      await db.collection('expenses').doc(editingId).update(data);
      showToast('Expense updated successfully', 'success');
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('expenses').add(data);
      showToast('Expense added successfully', 'success');
    }
    closeModal();
  } catch (err) {
    showToast('Error saving expense: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

// ---- Delete ----
async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense?')) return;

  try {
    await db.collection('expenses').doc(id).delete();
    showToast('Expense deleted successfully', 'success');
  } catch (err) {
    showToast('Error deleting expense: ' + err.message, 'error');
  }
}

// ---- Logout ----
logoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
});

// ---- Helpers ----
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let toastTimeout;
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}
