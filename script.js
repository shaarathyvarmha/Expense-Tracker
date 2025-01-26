const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let transactionHistory = JSON.parse(localStorage.getItem('transactionHistory')) || [];
let mainChart, yearChart;

function updateDashboard() {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    document.getElementById('total-income').textContent = totalIncome.toFixed(2);
    document.getElementById('total-expense').textContent = totalExpense.toFixed(2);
    document.getElementById('balance').textContent = balance.toFixed(2);

    generateSuggestions(totalIncome, totalExpense);
    renderCharts();
}

function addTransaction(e) {
    e.preventDefault();
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const repeat = document.getElementById('repeat').checked;

    if (!amount || !date) {
        alert('Please fill in all fields');
        return;
    }

    const transaction = { type, category, amount, date };
    if (repeat) {
        for (let i = 0; i < 12; i++) {
            const nextMonth = new Date(date);
            nextMonth.setMonth(nextMonth.getMonth() + i);
            transactions.push({ ...transaction, date: nextMonth.toISOString().split('T')[0] });
        }
    } else {
        transactions.push(transaction);
    }

    transactionHistory.push([...transactions]);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
    updateDashboard();
    e.target.reset();
}

function undo() {
    if (transactionHistory.length > 1) {
        transactionHistory.pop();
        transactions.splice(0, transactions.length, ...transactionHistory[transactionHistory.length - 1]);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateDashboard();
    } else {
        alert('Nothing to undo!');
    }
}

function resetAll() {
    if (confirm('Are you sure you want to reset all transactions?')) {
        transactions.length = 0;
        transactionHistory.length = 0;
        localStorage.removeItem('transactions');
        localStorage.removeItem('transactionHistory');
        updateDashboard();
    }
}

function generateSuggestions(totalIncome, totalExpense) {
    const suggestionList = document.getElementById('suggestion-list');
    suggestionList.innerHTML = '';

    // Suggestion 1: General expense vs income
    if (totalExpense > totalIncome) {
        const li = document.createElement('li');
        li.textContent = 'Consider reducing your expenses to stay within your income limits.';
        suggestionList.appendChild(li);
    } else {
        const li = document.createElement('li');
        li.textContent = 'Great job! Your expenses are within your income limits.';
        suggestionList.appendChild(li);
    }

    // Suggestion 2: Highest expense category
    const highestExpenseCategory = transactions.filter(t => t.type === 'expense').reduce((max, t) => t.amount > max.amount ? t : max, { amount: 0 });
    if (highestExpenseCategory.amount > 0) {
        const li = document.createElement('li');
        li.textContent = `Highest expense category: ${highestExpenseCategory.category} with amount ${highestExpenseCategory.amount.toFixed(2)}`;
        suggestionList.appendChild(li);
    }

    // Suggestion 3: Lowest expense category
    const lowestExpenseCategory = transactions.filter(t => t.type === 'expense').reduce((min, t) => t.amount < min.amount ? t : min, { amount: Infinity });
    if (lowestExpenseCategory.amount < Infinity) {
        const li = document.createElement('li');
        li.textContent = `Lowest expense category: ${lowestExpenseCategory.category} with amount ${lowestExpenseCategory.amount.toFixed(2)}`;
        suggestionList.appendChild(li);
    }

    // Suggestion 4: Monthly highest expense
    const monthlyExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
        const month = new Date(t.date).getMonth();
        acc[month] = (acc[month] || 0) + t.amount;
        return acc;
    }, {});
    const highestMonthlyExpense = Object.keys(monthlyExpenses).reduce((max, month) => monthlyExpenses[month] > max.amount ? { month, amount: monthlyExpenses[month] } : max, { amount: 0 });
    if (highestMonthlyExpense.amount > 0) {
        const li = document.createElement('li');
        li.textContent = `Highest monthly expense: Month ${parseInt(highestMonthlyExpense.month) + 1} with amount ${highestMonthlyExpense.amount.toFixed(2)}`;
        suggestionList.appendChild(li);
    }

    // Suggestion 5: Average monthly expense
    const averageMonthlyExpense = totalExpense / 12;
    const liAvg = document.createElement('li');
    liAvg.textContent = `Average monthly expense: ${averageMonthlyExpense.toFixed(2)}`;
    suggestionList.appendChild(liAvg);

    // Suggestion 6: Most frequent expense category
    const categoryFrequency = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
    }, {});
    const mostFrequentCategory = Object.keys(categoryFrequency).reduce((max, category) => categoryFrequency[category] > categoryFrequency[max] ? category : max, Object.keys(categoryFrequency)[0]);
    const liFreq = document.createElement('li');
    liFreq.textContent = `Most frequent expense category: ${mostFrequentCategory}`;
    suggestionList.appendChild(liFreq);

    // Suggestion 7: Highest single expense
    const highestSingleExpense = transactions.filter(t => t.type === 'expense').reduce((max, t) => t.amount > max.amount ? t : max, { amount: 0 });
    if (highestSingleExpense.amount > 0) {
        const liSingle = document.createElement('li');
        liSingle.textContent = `Highest single expense: ${highestSingleExpense.category} with amount ${highestSingleExpense.amount.toFixed(2)}`;
        suggestionList.appendChild(liSingle);
    }

    // Suggestion 8: Lowest single expense
    const lowestSingleExpense = transactions.filter(t => t.type === 'expense').reduce((min, t) => t.amount < min.amount ? t : min, { amount: Infinity });
    if (lowestSingleExpense.amount < Infinity) {
        const liLowSingle = document.createElement('li');
        liLowSingle.textContent = `Lowest single expense: ${lowestSingleExpense.category} with amount ${lowestSingleExpense.amount.toFixed(2)}`;
        suggestionList.appendChild(liLowSingle);
    }
}

function renderCharts() {
    const chartView = document.getElementById('chart-view').value;
    const monthSelect = document.getElementById('month-select');
    const selectedMonth = parseInt(monthSelect.value);

    let expenseCategories = {};

    if (chartView === 'overall') {
        monthSelect.style.display = 'none';
        expenseCategories = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});
    } else if (chartView === 'monthly') {
        monthSelect.style.display = 'inline-block';
        expenseCategories = transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === selectedMonth).reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});
    }

    const ctxPie = document.getElementById('expense-pie-chart').getContext('2d');
    if (mainChart) mainChart.destroy();
    mainChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: Object.keys(expenseCategories),
            datasets: [{
                data: Object.values(expenseCategories),
                backgroundColor: Object.keys(expenseCategories).map(() => '#' + Math.floor(Math.random() * 16777215).toString(16)),
            }]
        }
    });

    const monthlyExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
        const month = new Date(t.date).getMonth();
        acc[month] = (acc[month] || 0) + t.amount;
        return acc;
    }, {});

    const ctxBar = document.getElementById('expense-bar-chart').getContext('2d');
    if (yearChart) yearChart.destroy();
    yearChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: Object.keys(monthlyExpenses).map(month => new Date(0, month).toLocaleString('default', { month: 'long' })),
            datasets: [{
                data: Object.values(monthlyExpenses),
                backgroundColor: '#9400D3',
            }]
        }
    });
}

// Attach event listeners
document.getElementById('add-transaction-form').addEventListener('submit', addTransaction);
document.getElementById('toggle-theme').addEventListener('click', () => document.body.classList.toggle('dark-mode'));
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('reset').addEventListener('click', resetAll);
document.getElementById('chart-view').addEventListener('change', renderCharts);
document.getElementById('month-select').addEventListener('change', renderCharts);

updateDashboard();