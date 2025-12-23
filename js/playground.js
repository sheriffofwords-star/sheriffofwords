// Poet's Playground JavaScript

// State management
let contentData = {
  poems: [],
  quotes: [],
};

let originalData = {
  poems: [],
  quotes: [],
};

let editingPoemId = null;
let editingQuoteId = null;
let theme = localStorage.getItem("theme") || "light";

// Wait for DOM to be ready before accessing elements
let customAlertOverlay,
  alertIcon,
  alertTitle,
  alertMessage,
  alertOkBtn,
  alertCancelBtn;

// Custom Alert System - Initialize after DOM loads
function initCustomAlerts() {
  customAlertOverlay = document.getElementById("customAlert");
  alertIcon = document.getElementById("alertIcon");
  alertTitle = document.getElementById("alertTitle");
  alertMessage = document.getElementById("alertMessage");
  alertOkBtn = document.getElementById("alertOkBtn");
  alertCancelBtn = document.getElementById("alertCancelBtn");
}

// Show custom alert (replaces window.alert)
function showAlert(message, title = "Notice", type = "info") {
  return new Promise((resolve) => {
    alertIcon.className = `custom-alert-icon ${type}`;
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertCancelBtn.style.display = "none";

    customAlertOverlay.classList.add("show");

    const handleOk = () => {
      customAlertOverlay.classList.remove("show");
      alertOkBtn.removeEventListener("click", handleOk);
      resolve(true);
    };

    alertOkBtn.addEventListener("click", handleOk);
  });
}

// Show custom confirm (replaces window.confirm)
function showConfirm(message, title = "Confirm Action", type = "warning") {
  return new Promise((resolve) => {
    alertIcon.className = `custom-alert-icon ${type}`;
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertCancelBtn.style.display = "block";

    customAlertOverlay.classList.add("show");

    const handleOk = () => {
      customAlertOverlay.classList.remove("show");
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      customAlertOverlay.classList.remove("show");
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      alertOkBtn.removeEventListener("click", handleOk);
      alertCancelBtn.removeEventListener("click", handleCancel);
    };

    alertOkBtn.addEventListener("click", handleOk);
    alertCancelBtn.addEventListener("click", handleCancel);
  });
}

// DOM elements
const poemForm = document.getElementById("poemForm");
const quoteForm = document.getElementById("quoteForm");
const poemsList = document.getElementById("poemsList");
const quotesList = document.getElementById("quotesList");
const tabButtons = document.querySelectorAll(".tab-btn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const cancelPoemBtn = document.getElementById("cancelPoemBtn");
const cancelQuoteBtn = document.getElementById("cancelQuoteBtn");
const themeToggle = document.getElementById("themeToggle");

// Initialize
async function init() {
  initCustomAlerts();
  initTheme();
  await loadContent();
  setupEventListeners();
  renderPoems();
  renderQuotes();
  setDefaultDate();
}

// Initialize theme
function initTheme() {
  document.documentElement.setAttribute("data-theme", theme);
}

// Toggle theme
function toggleTheme() {
  theme = theme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

// Load content from JSON file or localStorage
async function loadContent() {
  // First, always load original data from JSON
  try {
    const response = await fetch("data/content.json");
    originalData = await response.json();
  } catch (error) {
    console.error("Error loading original content:", error);
    await showAlert(
      "Failed to load content. Please check the data file.",
      "Error",
      "error"
    );
    return;
  }

  // Check if there's saved data in localStorage
  const savedData = localStorage.getItem("poemsQuotesData");

  if (savedData) {
    contentData = JSON.parse(savedData);
  } else {
    // Clone original data to contentData
    contentData = JSON.parse(JSON.stringify(originalData));
    saveToLocalStorage();
  }
}

// Save to localStorage
function saveToLocalStorage() {
  localStorage.setItem("poemsQuotesData", JSON.stringify(contentData));
}

// Check if item is user-added (not in original data)
function isUserAdded(id, type) {
  const originalItems =
    type === "poem" ? originalData.poems : originalData.quotes;
  return !originalItems.some((item) => item.id === id);
}

// Setup event listeners
function setupEventListeners() {
  // Theme toggle
  themeToggle.addEventListener("click", toggleTheme);

  // Tab switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
      switchTab(tab);
    });
  });

  // Poem form submission
  poemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await savePoemData();
  });

  // Quote form submission
  quoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveQuoteData();
  });

  // Cancel buttons
  cancelPoemBtn.addEventListener("click", () => {
    resetPoemForm();
  });

  cancelQuoteBtn.addEventListener("click", () => {
    resetQuoteForm();
  });

  // Download button
  downloadBtn.addEventListener("click", async () => {
    await downloadJSON();
  });

  // Reset button
  resetBtn.addEventListener("click", async () => {
    const confirmed = await showConfirm(
      "Are you sure you want to reset to the original content? This will delete all your changes.",
      "Reset Confirmation",
      "warning"
    );
    if (confirmed) {
      localStorage.removeItem("poemsQuotesData");
      location.reload();
    }
  });
}

// Switch tabs
function switchTab(tabName) {
  tabButtons.forEach((btn) => btn.classList.remove("active"));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

  document
    .querySelectorAll(".admin-tab")
    .forEach((tab) => tab.classList.remove("active"));
  document.getElementById(`${tabName}Tab`).classList.add("active");
}

// Set default date to today
function setDefaultDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("poemDate").value = today;
  document.getElementById("quoteDate").value = today;
}

// Poem functions
async function savePoemData() {
  const poemData = {
    id: editingPoemId || Date.now(),
    title: document.getElementById("poemTitle").value,
    content: document.getElementById("poemContent").value,
    category: document.getElementById("poemCategory").value,
    author: document.getElementById("poemAuthor").value,
    date: document.getElementById("poemDate").value,
  };

  if (editingPoemId) {
    // Check if user is trying to edit original content
    if (!isUserAdded(editingPoemId, "poem")) {
      await showAlert(
        "You cannot edit original site content. You can only add your own poems!",
        "Cannot Edit",
        "error"
      );
      resetPoemForm();
      return;
    }
    // Update existing user-added poem
    const index = contentData.poems.findIndex((p) => p.id === editingPoemId);
    contentData.poems[index] = poemData;
  } else {
    // Add new poem
    contentData.poems.push(poemData);
  }

  saveToLocalStorage();
  renderPoems();
  resetPoemForm();
  await showAlert("Poem saved successfully!", "Success", "success");
}

async function editPoem(id) {
  // Check if this is original content
  if (!isUserAdded(id, "poem")) {
    await showAlert(
      "This is original site content and cannot be edited. You can only edit poems you added!",
      "Cannot Edit",
      "error"
    );
    return;
  }

  const poem = contentData.poems.find((p) => p.id === id);
  if (!poem) return;

  editingPoemId = id;
  document.getElementById("poemId").value = id;
  document.getElementById("poemTitle").value = poem.title;
  document.getElementById("poemContent").value = poem.content;
  document.getElementById("poemCategory").value = poem.category;
  document.getElementById("poemAuthor").value = poem.author;
  document.getElementById("poemDate").value = poem.date;

  // Scroll to form
  poemForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deletePoem(id) {
  // Check if this is original content
  if (!isUserAdded(id, "poem")) {
    await showAlert(
      "This is original site content and cannot be deleted!",
      "Cannot Delete",
      "error"
    );
    return;
  }

  const confirmed = await showConfirm(
    "Are you sure you want to delete this poem?",
    "Delete Poem",
    "warning"
  );
  if (!confirmed) return;

  contentData.poems = contentData.poems.filter((p) => p.id !== id);
  saveToLocalStorage();
  renderPoems();
  resetPoemForm();
  await showAlert("Poem deleted successfully!", "Deleted", "success");
}

function resetPoemForm() {
  editingPoemId = null;
  poemForm.reset();
  document.getElementById("poemId").value = "";
  setDefaultDate();
}

function renderPoems() {
  if (contentData.poems.length === 0) {
    poemsList.innerHTML =
      '<p style="text-align: center; color: #7f8c8d;">No poems yet. Add your first poem above!</p>';
    return;
  }

  poemsList.innerHTML = contentData.poems
    .map((poem) => {
      const userAdded = isUserAdded(poem.id, "poem");
      const badge = userAdded
        ? '<span class="user-badge">Your Creation</span>'
        : '<span class="original-badge">Original</span>';
      const buttons = userAdded
        ? `<button class="btn btn-edit" data-edit-type="poem" data-edit-id="${poem.id}">Edit</button>
               <button class="btn btn-danger" data-delete-type="poem" data-delete-id="${poem.id}">Delete</button>`
        : '<span class="read-only-label">Read-Only</span>';

      return `
            <div class="item-card ${poem.category} ${
        userAdded ? "user-added" : "original-content"
      }">
                <div class="item-header">
                    <div>
                        <h4 class="item-title">${escapeHtml(poem.title)}</h4>
                        ${badge}
                    </div>
                    <div class="item-actions">
                        ${buttons}
                    </div>
                </div>
                <div class="item-content">${escapeHtml(poem.content)}</div>
                <div class="item-meta">
                    <strong>${poem.category}</strong> | ${
        poem.author
      } | ${formatDate(poem.date)}
                </div>
            </div>
        `;
    })
    .join("");

  // Attach event listeners to edit and delete buttons
  attachPoemListeners();
}

// Quote functions
async function saveQuoteData() {
  const quoteData = {
    id: editingQuoteId || Date.now(),
    text: document.getElementById("quoteText").value,
    category: document.getElementById("quoteCategory").value,
    author: document.getElementById("quoteAuthor").value,
    date: document.getElementById("quoteDate").value,
  };

  if (editingQuoteId) {
    // Check if user is trying to edit original content
    if (!isUserAdded(editingQuoteId, "quote")) {
      await showAlert(
        "You cannot edit original site content. You can only add your own quotes!",
        "Cannot Edit",
        "error"
      );
      resetQuoteForm();
      return;
    }
    // Update existing user-added quote
    const index = contentData.quotes.findIndex((q) => q.id === editingQuoteId);
    contentData.quotes[index] = quoteData;
  } else {
    // Add new quote
    contentData.quotes.push(quoteData);
  }

  saveToLocalStorage();
  renderQuotes();
  resetQuoteForm();
  await showAlert("Quote saved successfully!", "Success", "success");
}

async function editQuote(id) {
  // Check if this is original content
  if (!isUserAdded(id, "quote")) {
    await showAlert(
      "This is original site content and cannot be edited. You can only edit quotes you added!",
      "Cannot Edit",
      "error"
    );
    return;
  }

  const quote = contentData.quotes.find((q) => q.id === id);
  if (!quote) return;

  editingQuoteId = id;
  document.getElementById("quoteId").value = id;
  document.getElementById("quoteText").value = quote.text;
  document.getElementById("quoteCategory").value = quote.category;
  document.getElementById("quoteAuthor").value = quote.author;
  document.getElementById("quoteDate").value = quote.date;

  // Scroll to form
  quoteForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteQuote(id) {
  // Check if this is original content
  if (!isUserAdded(id, "quote")) {
    await showAlert(
      "This is original site content and cannot be deleted!",
      "Cannot Delete",
      "error"
    );
    return;
  }

  const confirmed = await showConfirm(
    "Are you sure you want to delete this quote?",
    "Delete Quote",
    "warning"
  );
  if (!confirmed) return;

  contentData.quotes = contentData.quotes.filter((q) => q.id !== id);
  saveToLocalStorage();
  renderQuotes();
  resetQuoteForm();
  await showAlert("Quote deleted successfully!", "Deleted", "success");
}

function resetQuoteForm() {
  editingQuoteId = null;
  quoteForm.reset();
  document.getElementById("quoteId").value = "";
  setDefaultDate();
}

function renderQuotes() {
  if (contentData.quotes.length === 0) {
    quotesList.innerHTML =
      '<p style="text-align: center; color: #7f8c8d;">No quotes yet. Add your first quote above!</p>';
    return;
  }

  quotesList.innerHTML = contentData.quotes
    .map((quote) => {
      const userAdded = isUserAdded(quote.id, "quote");
      const badge = userAdded
        ? '<span class="user-badge">Your Creation</span>'
        : '<span class="original-badge">Original</span>';
      const buttons = userAdded
        ? `<button class="btn btn-edit" data-edit-type="quote" data-edit-id="${quote.id}">Edit</button>
               <button class="btn btn-danger" data-delete-type="quote" data-delete-id="${quote.id}">Delete</button>`
        : '<span class="read-only-label">Read-Only</span>';

      return `
            <div class="item-card ${quote.category} ${
        userAdded ? "user-added" : "original-content"
      }">
                <div class="item-header">
                    <div class="header-top">
                        ${badge}
                        <div class="item-actions">
                            ${buttons}
                        </div>
                    </div>
                </div>
                <div class="item-content">${escapeHtml(quote.text)}</div>
                <div class="item-meta">
                    <strong>${quote.category}</strong> | ${
        quote.author
      } | ${formatDate(quote.date)}
                </div>
            </div>
        `;
    })
    .join("");

  // Attach event listeners to edit and delete buttons
  attachQuoteListeners();
}

// Download JSON
async function downloadJSON() {
  const dataStr = JSON.stringify(contentData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "content.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  await showAlert(
    "JSON file downloaded! Email content.json to publish your content.",
    "Download Complete",
    "success"
  );
}

// Attach event listeners to poem buttons
function attachPoemListeners() {
  const editButtons = poemsList.querySelectorAll('[data-edit-type="poem"]');
  const deleteButtons = poemsList.querySelectorAll('[data-delete-type="poem"]');

  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const id = parseInt(this.getAttribute("data-edit-id"), 10);
      editPoem(id);
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const id = parseInt(this.getAttribute("data-delete-id"), 10);
      deletePoem(id);
    });
  });
}

// Attach event listeners to quote buttons
function attachQuoteListeners() {
  const editButtons = quotesList.querySelectorAll('[data-edit-type="quote"]');
  const deleteButtons = quotesList.querySelectorAll(
    '[data-delete-type="quote"]'
  );

  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const id = parseInt(this.getAttribute("data-edit-id"), 10);
      editQuote(id);
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const id = parseInt(this.getAttribute("data-delete-id"), 10);
      deleteQuote(id);
    });
  });
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

// Start the app
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
