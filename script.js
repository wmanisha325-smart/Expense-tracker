const STORAGE_KEY = "personal-expense-tracker.expenses";
const CURRENCY_STORAGE_KEY = "personal-expense-tracker.currency";
const CATEGORIES = ["Food", "Transport", "Utilities", "Other"];
const CURRENCIES = ["USD", "INR"];

const form = document.querySelector("#expense-form");
const nameInput = document.querySelector("#expense-name");
const amountInput = document.querySelector("#expense-amount");
const categoryInput = document.querySelector("#expense-category");
const currencyInput = document.querySelector("#currency-select");
const currencySymbol = document.querySelector(".amount-input > span");
const formMessage = document.querySelector("#form-message");
const totalAmount = document.querySelector("#total-amount");
const expenseList = document.querySelector("#expense-list");
const entryCount = document.querySelector("#entry-count");

let currency = loadCurrency();
let expenses = loadExpenses();

function loadCurrency() {
  try {
    const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved === null) {
      return "USD";
    }

    if (CURRENCIES.includes(saved)) {
      return saved;
    }

    throw new Error("Saved currency has an unexpected value.");
  } catch (error) {
    formMessage.textContent = "Saved currency could not be loaded. US Dollar will be used.";
    console.error("Could not load currency from localStorage:", error);
    return "USD";
  }
}

function isExpense(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    CATEGORIES.includes(value.category)
  );
}

function loadExpenses() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      return [];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isExpense)) {
      throw new Error("Saved expenses have an unexpected format.");
    }

    return parsed;
  } catch (error) {
    formMessage.textContent =
      "Saved expenses could not be loaded. Add an expense to replace the saved data.";
    console.error("Could not load expenses from localStorage:", error);
    return [];
  }
}

function saveExpenses() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    formMessage.textContent = "";
  } catch (error) {
    formMessage.textContent =
      "This expense is shown, but could not be saved in this browser.";
    console.error("Could not save expenses to localStorage:", error);
  }
}

function formatAmount(amount) {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

function renderExpenses() {
  expenseList.replaceChildren();
  currencyInput.value = currency;
  currencySymbol.textContent = currency === "INR" ? "₹" : "$";

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  totalAmount.textContent = formatAmount(total);
  entryCount.textContent = `${expenses.length} ${
    expenses.length === 1 ? "entry" : "entries"
  }`;

  if (expenses.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = "No expenses yet. Add your first one above.";
    expenseList.append(emptyState);
    return;
  }

  for (const expense of expenses) {
    const item = document.createElement("li");
    item.className = "expense-item";

    const mark = document.createElement("span");
    mark.className = "category-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = expense.category.slice(0, 3).toUpperCase();

    const details = document.createElement("div");
    details.className = "expense-details";

    const name = document.createElement("p");
    name.className = "expense-name";
    name.textContent = expense.name;

    const category = document.createElement("p");
    category.className = "expense-category";
    category.textContent = expense.category;
    details.append(name, category);

    const side = document.createElement("div");
    side.className = "expense-side";

    const amount = document.createElement("span");
    amount.className = "expense-amount";
    amount.textContent = formatAmount(expense.amount);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete ${expense.name}`);
    deleteButton.addEventListener("click", () => {
      expenses = expenses.filter((entry) => entry.id !== expense.id);
      saveExpenses();
      renderExpenses();
    });

    side.append(amount, deleteButton);
    item.append(mark, details, side);
    expenseList.append(item);
  }
}

currencyInput.addEventListener("change", () => {
  currency = currencyInput.value;
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    formMessage.textContent = "";
  } catch (error) {
    formMessage.textContent =
      "The currency display changed, but could not be saved in this browser.";
    console.error("Could not save currency to localStorage:", error);
  }
  renderExpenses();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;

  if (!name) {
    formMessage.textContent = "Enter an item name.";
    nameInput.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    formMessage.textContent = "Enter an amount greater than zero.";
    amountInput.focus();
    return;
  }

  if (!CATEGORIES.includes(category)) {
    formMessage.textContent = "Choose a valid category.";
    categoryInput.focus();
    return;
  }

  expenses.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    amount,
    category,
  });

  saveExpenses();
  renderExpenses();
  form.reset();
  nameInput.focus();
});

renderExpenses();
