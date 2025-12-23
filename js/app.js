// State management
let state = {
  poems: [],
  quotes: [],
  currentFilter: "all",
  currentView: "both",
  searchQuery: "",
  theme: localStorage.getItem("theme") || "light",
};

// Category color cache
const categoryColors = new Map();

/**
 * Generate a consistent color for a category using hash-based color generation
 * @param {string} category - The category name
 * @returns {object} - Object with color (hex) and lightColor (rgba) properties
 */
function getCategoryColor(category) {
  // Return cached color if available
  if (categoryColors.has(category)) {
    return categoryColors.get(category);
  }

  // Hash function to generate a number from string
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Generate HSL color with good saturation and lightness for readability
  const hue = Math.abs(hash % 360); // 0-359
  const saturation = 65 + (Math.abs(hash) % 15); // 65-80%
  const lightness = 50 + (Math.abs(hash >> 8) % 10); // 50-60%

  // Convert HSL to RGB
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  // Convert to 0-255 range
  const rgb = {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };

  const colorHex = `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b)
    .toString(16)
    .slice(1)}`;
  const colorRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;

  const colors = {
    color: colorHex,
    lightColor: colorRgba,
    rgb: rgb,
  };

  // Cache the color
  categoryColors.set(category, colors);

  return colors;
}

/**
 * Apply dynamic colors to category tags and cards
 */
function applyCategoryColors() {
  // Get all category tags
  const categoryTags = document.querySelectorAll(".category-tag");

  categoryTags.forEach((tag) => {
    const category = tag.textContent.trim();
    const colors = getCategoryColor(category);

    // Apply colors to the tag
    tag.style.backgroundColor = colors.lightColor;
    tag.style.color = colors.color;
  });

  // Apply colors to poem cards
  const poemCards = document.querySelectorAll(".poem-card");
  poemCards.forEach((card) => {
    const categoryTag = card.querySelector(".category-tag");
    if (categoryTag) {
      const category = categoryTag.textContent.trim();
      const colors = getCategoryColor(category);

      // Set border-left color
      card.style.borderLeftColor = colors.color;

      // Set gradient for the ::before pseudo-element via CSS custom property
      card.style.setProperty(
        "--category-gradient",
        `linear-gradient(135deg, ${colors.color} 0%, transparent 100%)`
      );
    }
  });

  // Apply colors to quote cards
  const quoteCards = document.querySelectorAll(".quote-card");
  quoteCards.forEach((card) => {
    const categoryTag = card.querySelector(".category-tag");
    if (categoryTag) {
      const category = categoryTag.textContent.trim();
      const colors = getCategoryColor(category);

      // Set border-left color
      card.style.borderLeftColor = colors.color;

      // Set gradient for the ::after pseudo-element via CSS custom property
      card.style.setProperty(
        "--category-gradient",
        `linear-gradient(135deg, ${colors.color} 0%, transparent 100%)`
      );
    }
  });
}

// DOM elements
const poemsContainer = document.getElementById("poemsContainer");
const quotesContainer = document.getElementById("quotesContainer");
const poemsSection = document.getElementById("poemsSection");
const quotesSection = document.getElementById("quotesSection");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const viewButtons = document.querySelectorAll(".view-btn");
const themeToggle = document.getElementById("themeToggle");

// Initialize app
async function init() {
  initTheme();
  await loadContent();
  populateCategoryDropdown();
  setupEventListeners();
  renderContent();
}

// Initialize theme
function initTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}

// Load content from localStorage (if available) or JSON file
async function loadContent() {
  try {
    // Check if there's saved data from Poet's Playground in localStorage
    const savedData = localStorage.getItem("poemsQuotesData");

    if (savedData) {
      // Load from localStorage (user's temporary playground data)
      const data = JSON.parse(savedData);
      state.poems = data.poems || [];
      state.quotes = data.quotes || [];
    } else {
      // Load from JSON file (original website content)
      const response = await fetch("data/content.json");
      const data = await response.json();
      state.poems = data.poems || [];
      state.quotes = data.quotes || [];
    }
  } catch (error) {
    console.error("Error loading content:", error);
    showError("Failed to load content. Please try again later.");
  }
}

// Populate category dropdown with unique categories from poems and quotes
function populateCategoryDropdown() {
  // Get all unique categories from both poems and quotes
  const allItems = [...state.poems, ...state.quotes];
  const categories = [...new Set(allItems.map((item) => item.category))].sort();

  // Clear existing options except "All Categories"
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  // Add each category as an option (capitalized)
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryFilter.appendChild(option);
  });
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Setup event listeners
function setupEventListeners() {
  // Search input with debouncing
  const debouncedSearch = debounce((value) => {
    state.searchQuery = value.toLowerCase();
    renderContent();
  }, 300);

  searchInput.addEventListener("input", (e) => {
    debouncedSearch(e.target.value);
  });

  // Category filter dropdown
  categoryFilter.addEventListener("change", (e) => {
    state.currentFilter = e.target.value;
    renderContent();
  });

  // View toggle buttons
  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      viewButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      state.currentView = button.dataset.view;
      updateViewVisibility();
      renderContent();
    });
  });

  // Theme toggle
  themeToggle.addEventListener("click", toggleTheme);

  // Add 3D tilt effect on mouse move for cards
  setup3DCardEffects();

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
  // Alt + 1 for removing filter and alt + d for toggling theme
  if (e.altKey && !e.shiftKey && !e.ctrlKey) {
    if (e.key === "1") {
      e.preventDefault();
      categoryFilter.value = "all";
      categoryFilter.dispatchEvent(new Event("change"));
    } else if (e.key === "d" || e.key === "D") {
      e.preventDefault();
      toggleTheme();
    }
  }
}

// Toggle theme
function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", state.theme);
  localStorage.setItem("theme", state.theme);
}

// Setup 3D card effects
function setup3DCardEffects() {
  const addCardListeners = () => {
    const cards = document.querySelectorAll(".poem-card, .quote-card");

    cards.forEach((card) => {
      card.addEventListener("mouseenter", function () {
        this.style.transition = "none";
      });

      card.addEventListener("mousemove", function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        this.style.transform = `
                    translateY(-10px)
                    rotateX(${rotateX}deg)
                    rotateY(${rotateY}deg)
                    scale(1.02)
                `;
      });

      card.addEventListener("mouseleave", function () {
        this.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
        this.style.transform = "translateY(0) rotateX(0) rotateY(0) scale(1)";
      });
    });
  };

  // Initial setup
  addCardListeners();

  // Re-apply after content changes (using MutationObserver)
  const observer = new MutationObserver(addCardListeners);
  observer.observe(poemsContainer, { childList: true });
  observer.observe(quotesContainer, { childList: true });
}

// Update section visibility based on view
function updateViewVisibility() {
  if (state.currentView === "poems") {
    poemsSection.style.display = "block";
    quotesSection.style.display = "none";
  } else if (state.currentView === "quotes") {
    poemsSection.style.display = "none";
    quotesSection.style.display = "block";
  } else if (state.currentView === "both") {
    poemsSection.style.display = "block";
    quotesSection.style.display = "block";
  }
}

// Filter and search content
function filterContent(items) {
  return items.filter((item) => {
    // Apply category filter
    const categoryMatch =
      state.currentFilter === "all" || item.category === state.currentFilter;

    // Apply search filter
    let searchMatch = true;
    if (state.searchQuery) {
      const searchableText = [
        item.title || "",
        item.text || "",
        item.content || "",
        item.author || "",
        item.category || "",
      ]
        .join(" ")
        .toLowerCase();

      searchMatch = searchableText.includes(state.searchQuery);
    }

    return categoryMatch && searchMatch;
  });
}

// Render all content
function renderContent() {
  const filteredPoems = filterContent(state.poems);
  const filteredQuotes = filterContent(state.quotes);

  // Render poems
  if (state.currentView === "poems" || state.currentView === "both") {
    renderPoems(filteredPoems);
  }

  // Render quotes
  if (state.currentView === "quotes" || state.currentView === "both") {
    renderQuotes(filteredQuotes);
  }

  // Show empty state if no results
  const hasResults =
    (state.currentView === "both" &&
      (filteredPoems.length > 0 || filteredQuotes.length > 0)) ||
    (state.currentView === "poems" && filteredPoems.length > 0) ||
    (state.currentView === "quotes" && filteredQuotes.length > 0);

  emptyState.style.display = hasResults ? "none" : "block";

  // Apply dynamic category colors after rendering
  applyCategoryColors();
}

// Render poems
function renderPoems(poems) {
  if (poems.length === 0) {
    poemsContainer.innerHTML = "";
    return;
  }

  poemsContainer.innerHTML = poems
    .map(
      (poem) => `
        <article class="poem-card ${poem.category}" data-type="poem" data-id="${
        poem.id
      }">
            <button class="copy-btn" data-copy-type="poem" data-copy-id="${
              poem.id
            }" aria-label="Copy poem">
                Copy
            </button>
            <h3 class="poem-title">${escapeHtml(poem.title)}</h3>
            <div class="poem-content">${escapeHtml(poem.content)}</div>
            <div class="poem-meta">
                <div class="meta-left">
                    <span class="category-tag ${poem.category}">${
        poem.category
      }</span>
                    <span class="poem-author">by:  ${escapeHtml(
                      poem.author
                    )}</span>
                </div>
                <span class="poem-date">${formatDate(poem.date)}</span>
            </div>
        </article>
    `
    )
    .join("");

  // Add event listeners to copy buttons
  attachCopyListeners();
}

// Render quotes
function renderQuotes(quotes) {
  if (quotes.length === 0) {
    quotesContainer.innerHTML = "";
    return;
  }

  quotesContainer.innerHTML = quotes
    .map(
      (quote) => `
        <article class="quote-card ${
          quote.category
        }" data-type="quote" data-id="${quote.id}">
            <button class="copy-btn" data-copy-type="quote" data-copy-id="${
              quote.id
            }" aria-label="Copy quote">
                Copy
            </button>
            <p class="quote-text">${escapeHtml(quote.text)}</p>
            <div class="quote-meta">
                <div class="meta-left">
                    <span class="category-tag ${quote.category}">${
        quote.category
      }</span>
                    <span class="poem-author">by:  ${escapeHtml(
                      quote.author
                    )}</span>
                </div>
                <span class="poem-date">${formatDate(quote.date)}</span>
            </div>
        </article>
    `
    )
    .join("");

  // Add event listeners to copy buttons
  attachCopyListeners();
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

function showError(message) {
  emptyState.innerHTML = `<p style="color: #e74c3c;">${message}</p>`;
  emptyState.style.display = "block";
}

// Attach event listeners to copy buttons
function attachCopyListeners() {
  const copyButtons = document.querySelectorAll(".copy-btn");
  copyButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.stopPropagation();
      const type = this.getAttribute("data-copy-type");
      const id = parseInt(this.getAttribute("data-copy-id"), 10);
      copyToClipboard(type, id);
    });
  });
}

// Copy to clipboard functionality
function copyToClipboard(type, id) {
  const item =
    type === "poem"
      ? state.poems.find((p) => p.id === id)
      : state.quotes.find((q) => q.id === id);

  if (!item) return;

  const text =
    type === "poem"
      ? `${item.title}\n\n${item.content}\n\n- ${item.author}`
      : `"${item.text}"\n\n- ${item.author}`;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast(`${type === "poem" ? "Poem" : "Quote"} copied to clipboard!`);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
      showToast("Failed to copy. Please try again.");
    });
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Start the app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
