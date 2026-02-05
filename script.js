// ===== GLOBAL VARIABLES =====
let transactions = []; // Array to store all transactions
let expenseChart = null; // Chart.js instance for pie chart
let filteredTransactions = []; // Filtered transactions based on date
let currentFilter = null; // Current date filter

// ===== DOM ELEMENTS =====
const transactionForm = document.getElementById('transactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const transactionList = document.getElementById('transactionList');
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const chartCanvas = document.getElementById('expenseChart');
const chartInfo = document.getElementById('chartInfo');
const dateFilter = document.getElementById('dateFilter');
const clearFilterBtn = document.getElementById('clearFilter');
const downloadPDFBtn = document.getElementById('downloadPDF');
const downloadExcelBtn = document.getElementById('downloadExcel');
const transactionCount = document.getElementById('transactionCount');

// ===== EVENT LISTENERS =====
// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);

// Handle form submission
transactionForm.addEventListener('submit', handleFormSubmit);

// Handle date filter change
dateFilter.addEventListener('change', handleDateFilter);

// Handle clear filter button
clearFilterBtn.addEventListener('click', clearDateFilter);

// Handle PDF download
downloadPDFBtn.addEventListener('click', downloadPDF);

// Handle Excel download
downloadExcelBtn.addEventListener('click', downloadExcel);

// ===== INITIALIZATION FUNCTION =====
/**
 * Initialize the application
 * Loads data from localStorage and renders the UI
 */
function initApp() {
    loadFromLocalStorage();
    filteredTransactions = [...transactions]; // Initially show all transactions
    renderTransactions();
    updateSummary();
    updateChart();
    updateTransactionCount();
}

// ===== FORM HANDLING =====
/**
 * Handle form submission to add new transaction
 * @param {Event} e - Form submit event
 */
function handleFormSubmit(e) {
    e.preventDefault(); // Prevent page reload

    // Get form values
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const type = document.querySelector('input[name="type"]:checked').value;

    // Validate inputs
    if (!validateInputs(description, amount, category)) {
        return;
    }

    // Create transaction object with current date
    const transaction = {
        id: generateId(),
        description: description,
        amount: amount,
        category: category,
        type: type,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        timestamp: new Date().toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        })
    };

    // Add transaction to array
    transactions.push(transaction);

    // Update UI and storage
    saveToLocalStorage();
    applyCurrentFilter(); // Reapply filter to include new transaction if it matches
    renderTransactions();
    updateSummary();
    updateChart();
    updateTransactionCount();

    // Reset form
    transactionForm.reset();

    // Show success feedback
    showNotification(`${type === 'income' ? '💚 Income' : '❤️ Expense'} added successfully!`);
}

// ===== INPUT VALIDATION =====
/**
 * Validate user inputs
 * @param {string} description - Transaction description
 * @param {number} amount - Transaction amount
 * @param {string} category - Transaction category
 * @returns {boolean} - True if valid, false otherwise
 */
function validateInputs(description, amount, category) {
    if (description === '') {
        alert('⚠️ Please enter a description');
        return false;
    }

    if (isNaN(amount) || amount <= 0) {
        alert('⚠️ Please enter a valid amount greater than 0');
        return false;
    }

    if (category === '') {
        alert('⚠️ Please select a category');
        return false;
    }

    return true;
}

// ===== DATE FILTER FUNCTIONS =====
/**
 * Handle date filter change
 */
function handleDateFilter() {
    const selectedDate = dateFilter.value;

    if (selectedDate) {
        currentFilter = selectedDate;
        // Filter transactions by selected date
        filteredTransactions = transactions.filter(t => t.date === selectedDate);
    } else {
        currentFilter = null;
        filteredTransactions = [...transactions];
    }

    renderTransactions();
    updateSummary();
    updateChart();
    updateTransactionCount();
}

/**
 * Clear date filter and show all transactions
 */
function clearDateFilter() {
    dateFilter.value = '';
    currentFilter = null;
    filteredTransactions = [...transactions];
    renderTransactions();
    updateSummary();
    updateChart();
    updateTransactionCount();
}

/**
 * Apply current filter (used after adding new transaction)
 */
function applyCurrentFilter() {
    if (currentFilter) {
        filteredTransactions = transactions.filter(t => t.date === currentFilter);
    } else {
        filteredTransactions = [...transactions];
    }
}

// ===== RENDER TRANSACTIONS =====
/**
 * Render all filtered transactions to the DOM
 */
function renderTransactions() {
    // Clear current list
    transactionList.innerHTML = '';

    // Check if there are no transactions
    if (filteredTransactions.length === 0) {
        const message = currentFilter
            ? `No transactions found for ${new Date(currentFilter).toLocaleDateString('en-IN', { dateStyle: 'long' })}`
            : 'No transactions yet. Add your first transaction above!';
        transactionList.innerHTML = `<p class="no-transactions">${message}</p>`;
        return;
    }

    // Render each transaction (newest first)
    filteredTransactions.slice().reverse().forEach(transaction => {
        const transactionEl = createTransactionElement(transaction);
        transactionList.appendChild(transactionEl);
    });
}

// ===== CREATE TRANSACTION ELEMENT =====
/**
 * Create a DOM element for a single transaction
 * @param {Object} transaction - Transaction object
 * @returns {HTMLElement} - Transaction DOM element
 */
function createTransactionElement(transaction) {
    const div = document.createElement('div');
    div.className = `transaction-item ${transaction.type}`;

    div.innerHTML = `
        <div class="transaction-details">
            <div class="transaction-description">${transaction.description}</div>
            <div class="transaction-meta">
                <span class="transaction-type">${transaction.type}</span>
                <span class="transaction-category">${transaction.category}</span>
                <span class="transaction-date">📅 ${new Date(transaction.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
        </div>
        <div class="transaction-amount ${transaction.type}">
            ${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}
        </div>
        <button class="btn-delete" onclick="deleteTransaction('${transaction.id}')">🗑️ Delete</button>
    `;

    return div;
}

// ===== DELETE TRANSACTION =====
/**
 * Delete a transaction by ID
 * @param {string} id - Transaction ID
 */
function deleteTransaction(id) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }

    // Filter out the transaction
    transactions = transactions.filter(transaction => transaction.id !== id);

    // Update UI and storage
    saveToLocalStorage();
    applyCurrentFilter(); // Reapply filter after deletion
    renderTransactions();
    updateSummary();
    updateChart();
    updateTransactionCount();

    showNotification('🗑️ Transaction deleted successfully!');
}

// ===== UPDATE SUMMARY =====
/**
 * Calculate and update total balance, income, and expense based on filtered data
 */
function updateSummary() {
    // Calculate totals from filtered transactions
    const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    // Update DOM
    totalIncomeEl.textContent = `₹${income.toFixed(2)}`;
    totalExpenseEl.textContent = `₹${expense.toFixed(2)}`;
    totalBalanceEl.textContent = `₹${balance.toFixed(2)}`;
}

// ===== UPDATE TRANSACTION COUNT =====
/**
 * Update the transaction count display
 */
function updateTransactionCount() {
    const count = filteredTransactions.length;
    const filterText = currentFilter ? ' (filtered)' : '';
    transactionCount.textContent = `${count} transaction${count !== 1 ? 's' : ''}${filterText}`;
}

// ===== UPDATE CHART =====
/**
 * Update the pie chart with expense distribution from filtered data
 */
function updateChart() {
    // Get all expense transactions from filtered data
    const expenses = filteredTransactions.filter(t => t.type === 'expense');

    // If no expenses, show message and destroy chart
    if (expenses.length === 0) {
        chartInfo.textContent = 'No expenses to display';
        chartInfo.style.display = 'block';
        if (expenseChart) {
            expenseChart.destroy();
            expenseChart = null;
        }
        return;
    }

    // Hide info message
    chartInfo.style.display = 'none';

    // Group expenses by category
    const expenseData = {};
    expenses.forEach(expense => {
        if (expenseData[expense.category]) {
            expenseData[expense.category] += expense.amount;
        } else {
            expenseData[expense.category] = expense.amount;
        }
    });

    // Prepare chart data
    const labels = Object.keys(expenseData);
    const data = Object.values(expenseData);
    const colors = generateColors(labels.length);

    // Destroy existing chart if it exists
    if (expenseChart) {
        expenseChart.destroy();
    }

    // Create new chart
    const ctx = chartCanvas.getContext('2d');
    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: 'rgba(255, 255, 255, 0.3)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 13,
                            family: 'Poppins'
                        },
                        color: 'rgba(255, 255, 255, 0.9)'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        family: 'Poppins'
                    },
                    bodyFont: {
                        size: 13,
                        family: 'Poppins'
                    }
                }
            }
        }
    });
}

// ===== GENERATE COLORS FOR CHART =====
/**
 * Generate an array of vibrant colors for the pie chart
 * @param {number} count - Number of colors needed
 * @returns {Array} - Array of color strings
 */
function generateColors(count) {
    const colors = [
        '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#6366f1',
        '#f43f5e', '#84cc16', '#22d3ee', '#a855f7', '#fb923c'
    ];

    // If we need more colors than predefined, generate random ones
    while (colors.length < count) {
        colors.push(`hsl(${Math.random() * 360}, 70%, 60%)`);
    }

    return colors.slice(0, count);
}

// ===== PDF DOWNLOAD FUNCTION =====
/**
 * Generate and download PDF report of transactions
 */
function downloadPDF() {
    // Check if jsPDF is loaded
    if (typeof window.jspdf === 'undefined') {
        alert('⚠️ PDF library not loaded. Please refresh the page.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('💰 Expense Report', 105, 20, { align: 'center' });

    // Date filter info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const dateText = currentFilter
        ? `Date: ${new Date(currentFilter).toLocaleDateString('en-IN', { dateStyle: 'long' })}`
        : 'Date: All Dates';
    doc.text(dateText, 105, 30, { align: 'center' });

    // Summary
    doc.setFontSize(11);
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    doc.text(`Total Income: ₹${income.toFixed(2)}`, 20, 45);
    doc.text(`Total Expense: ₹${expense.toFixed(2)}`, 20, 52);
    doc.text(`Final Balance: ₹${balance.toFixed(2)}`, 20, 59);

    // Table header
    let yPos = 75;
    doc.setFillColor(102, 126, 234);
    doc.rect(20, yPos - 7, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Date', 25, yPos);
    doc.text('Description', 55, yPos);
    doc.text('Category', 105, yPos);
    doc.text('Type', 135, yPos);
    doc.text('Amount', 165, yPos);

    // Table rows
    yPos += 10;
    doc.setTextColor(0, 0, 0);

    filteredTransactions.slice().reverse().forEach((transaction, index) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }

        const dateStr = new Date(transaction.date).toLocaleDateString('en-IN', { dateStyle: 'short' });
        const amountStr = `${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}`;

        doc.text(dateStr, 25, yPos);
        doc.text(transaction.description.substring(0, 20), 55, yPos);
        doc.text(transaction.category, 105, yPos);
        doc.text(transaction.type, 135, yPos);

        // Color amount based on type
        doc.setTextColor(transaction.type === 'income' ? 16 : 239, transaction.type === 'income' ? 185 : 68, transaction.type === 'income' ? 129 : 68);
        doc.text(amountStr, 165, yPos);
        doc.setTextColor(0, 0, 0);

        yPos += 8;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 105, 290, { align: 'center' });
    }

    // Save PDF
    const fileName = currentFilter
        ? `expense-report-${currentFilter}.pdf`
        : `expense-report-all-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    showNotification('📄 PDF downloaded successfully!');
}

// ===== EXCEL DOWNLOAD FUNCTION =====
/**
 * Generate and download Excel report of transactions
 */
function downloadExcel() {
    // Check if XLSX is loaded
    if (typeof XLSX === 'undefined') {
        alert('⚠️ Excel library not loaded. Please refresh the page.');
        return;
    }

    // Prepare data for Excel
    const excelData = filteredTransactions.slice().reverse().map(transaction => ({
        'Date': new Date(transaction.date).toLocaleDateString('en-IN', { dateStyle: 'medium' }),
        'Description': transaction.description,
        'Category': transaction.category,
        'Type': transaction.type.toUpperCase(),
        'Amount': transaction.type === 'income' ? transaction.amount : -transaction.amount
    }));

    // Calculate totals
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    // Add empty row and totals
    excelData.push({});
    excelData.push({
        'Date': '',
        'Description': '',
        'Category': '',
        'Type': 'TOTAL INCOME',
        'Amount': income
    });
    excelData.push({
        'Date': '',
        'Description': '',
        'Category': '',
        'Type': 'TOTAL EXPENSE',
        'Amount': -expense
    });
    excelData.push({
        'Date': '',
        'Description': '',
        'Category': '',
        'Type': 'FINAL BALANCE',
        'Amount': balance
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 15 }, // Date
        { wch: 25 }, // Description
        { wch: 15 }, // Category
        { wch: 12 }, // Type
        { wch: 12 }  // Amount
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    // Save Excel file
    const fileName = currentFilter
        ? `expense-report-${currentFilter}.xlsx`
        : `expense-report-all-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showNotification('📊 Excel downloaded successfully!');
}

// ===== LOCAL STORAGE FUNCTIONS =====
/**
 * Save transactions to localStorage
 */
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

/**
 * Load transactions from localStorage
 */
function loadFromLocalStorage() {
    const stored = localStorage.getItem('transactions');
    if (stored) {
        transactions = JSON.parse(stored);
    }
}

// ===== UTILITY FUNCTIONS =====
/**
 * Generate a unique ID for transactions
 * @returns {string} - Unique ID
 */
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * Show a notification message (console log implementation)
 * @param {string} message - Message to display
 */
function showNotification(message) {
    console.log(message);
    // You can enhance this with a toast notification library if desired
}
