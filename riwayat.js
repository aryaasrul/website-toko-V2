// Inisialisasi Supabase
const supabaseUrl = 'https://jbvfjehpgvadponxkvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidmZqZWhwZ3ZhZHBvbnhrdnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODg3NzUsImV4cCI6MjA2MjM2NDc3NX0.YLXNLhpodvmhRa5RfPlHQhiVPvoqmnOZb7b-HFcFo8k';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Data global
let orders = [];
let expenses = [];
let groupedOrders = {};
let groupedExpenses = {};
let currentFilter = 'Seminggu Terakhir'; // Default filter
let activeTab = 'pemasukan'; // Default tab
let currentBalance = 0; // Saldo saat ini

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    const orderListElement = document.querySelector('.order-list');
    const expenseListElement = document.querySelector('.expense-list');
    const filterBtn = document.querySelector('.filter-btn');
    const refreshBtn = document.querySelector('.refresh-btn');
    const periodBtn = document.querySelector('.period-btn');
    const filterDropdown = document.querySelector('.filter-dropdown');
    const btnAddExpense = document.getElementById('btn-add-expense');
    const tabPemasukan = document.getElementById('tab-pemasukan');
    const tabPengeluaran = document.getElementById('tab-pengeluaran');
    const pemasukanContent = document.getElementById('pemasukan-content');
    const pengeluaranContent = document.getElementById('pengeluaran-content');
    
    // Event Listeners untuk tabs
    if (tabPemasukan && tabPengeluaran) {
        tabPemasukan.addEventListener('click', function() {
            setActiveTab('pemasukan');
        });
        
        tabPengeluaran.addEventListener('click', function() {
            setActiveTab('pengeluaran');
        });
    }
    
    // Event Listener untuk tombol tambah pengeluaran
    if (btnAddExpense) {
        btnAddExpense.addEventListener('click', function() {
            goToAddExpense();
        });
    }
    
    // Event Listeners yang sudah ada
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            openDatePicker();
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            refreshData();
        });
    }
    
    if (periodBtn) {
        periodBtn.addEventListener('click', function() {
            toggleFilterDropdown();
        });
    }
    
    // Filter options setup
    const filterOptions = document.querySelectorAll('.filter-option');
    if (filterOptions) {
        filterOptions.forEach(option => {
            option.addEventListener('click', function() {
                currentFilter = this.textContent.trim();
                updatePeriodButtonText(currentFilter);
                toggleFilterDropdown();
                
                // Ambil data sesuai dengan tab yang aktif
                if (activeTab === 'pemasukan') {
                    fetchOrders(currentFilter);
                } else {
                    fetchExpenses(currentFilter);
                }
            });
        });
    }
    
    // Toggle order item expansion
    document.addEventListener('click', function(e) {
        const orderHeader = e.target.closest('.order-header');
        if (orderHeader) {
            const orderItem = orderHeader.closest('.order-item');
            toggleOrderItem(orderItem);
        }
        
        const expenseHeader = e.target.closest('.expense-header');
        if (expenseHeader) {
            const expenseItem = expenseHeader.closest('.expense-item');
            toggleExpenseItem(expenseItem);
        }
    });
    
    // Navbar event listeners
    const navItems = document.querySelectorAll('.navbar .nav-item');
    if (navItems.length >= 3) {
        // Kasir (item 1)
        navItems[0].addEventListener('click', function() {
            window.location.href = 'index.html';
        });

        // Katalog (item 2)
        navItems[1].addEventListener('click', function() {
            window.location.href = 'katalog.html';
        });

        // Current page - Laporan (item 3)
        // No event needed as we're already on this page
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (filterDropdown && filterDropdown.classList.contains('show')) {
            if (!e.target.closest('.filter-period') && !e.target.closest('.filter-dropdown')) {
                filterDropdown.classList.remove('show');
            }
        }
    });
    
    // Initial data load
    init();
});

// Fungsi untuk menghitung saldo saat ini berdasarkan semua transaksi
async function calculateCurrentBalance() {
    try {
        console.log("Calculating current balance...");
        
        // Ambil semua pemasukan (orders)
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('price, quantity');
            
        if (ordersError) {
            console.error('Error fetching orders for balance:', ordersError);
            return 0; // Default jika terjadi error
        }
        
        // Ambil semua pengeluaran (expenses)
        const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('amount');
            
        if (expensesError) {
            console.error('Error fetching expenses for balance:', expensesError);
            return 0; // Default jika terjadi error
        }
        
        // Hitung total pemasukan
        let totalIncome = 0;
        if (ordersData && ordersData.length > 0) {
            totalIncome = ordersData.reduce((sum, order) => {
                return sum + (order.price * (order.quantity || 1));
            }, 0);
        }
        
        // Hitung total pengeluaran
        let totalExpense = 0;
        if (expensesData && expensesData.length > 0) {
            totalExpense = expensesData.reduce((sum, expense) => {
                return sum + (expense.amount || 0);
            }, 0);
        }
        
        // Hitung saldo saat ini
        const currentBalance = totalIncome - totalExpense;
        console.log(`Current balance calculated: Income=${totalIncome}, Expense=${totalExpense}, Balance=${currentBalance}`);
        
        return currentBalance;
    } catch (error) {
        console.error("Error calculating balance:", error);
        return 0; // Default jika terjadi error
    }
}

// Fungsi untuk mengatur tab aktif
function setActiveTab(tab) {
    activeTab = tab;
    
    const tabPemasukan = document.getElementById('tab-pemasukan');
    const tabPengeluaran = document.getElementById('tab-pengeluaran');
    const pemasukanContent = document.getElementById('pemasukan-content');
    const pengeluaranContent = document.getElementById('pengeluaran-content');
    
    if (tab === 'pemasukan') {
        tabPemasukan.classList.add('active');
        tabPengeluaran.classList.remove('active');
        pemasukanContent.style.display = 'block';
        pengeluaranContent.style.display = 'none';
        fetchOrders(currentFilter);
    } else {
        tabPemasukan.classList.remove('active');
        tabPengeluaran.classList.add('active');
        pemasukanContent.style.display = 'none';
        pengeluaranContent.style.display = 'block';
        fetchExpenses(currentFilter);
    }
}

// Fungsi Inisialisasi
async function init() {
    console.log("Initializing riwayat...");
    
    // Hitung saldo saat ini
    currentBalance = await calculateCurrentBalance();
    console.log("Current balance:", currentBalance);
    
    updatePeriodButtonText(currentFilter);
    await fetchOrders(currentFilter);
    // Jangan perlu mengambil expenses di awal karena tab defaultnya adalah pemasukan
}

// Fungsi navigasi ke halaman tambah pengeluaran
function goToAddExpense() {
    window.location.href = 'tambah-pengeluaran.html';
}

// Function to update period button text
function updatePeriodButtonText(filterText) {
    const periodBtn = document.querySelector('.period-btn span');
    if (periodBtn) {
        periodBtn.textContent = filterText;
    }
}

// Function to toggle filter dropdown
function toggleFilterDropdown() {
    const filterDropdown = document.querySelector('.filter-dropdown');
    if (filterDropdown) {
        filterDropdown.classList.toggle('show');
    }
}

// Function to open date picker (placeholder)
function openDatePicker() {
    // In a real implementation, this would open a date picker
    alert('Fitur filter tanggal akan tersedia di versi berikutnya');
}

// Function to refresh data
function refreshData() {
    console.log("Refreshing data...");
    if (activeTab === 'pemasukan') {
        fetchOrders(currentFilter);
    } else {
        fetchExpenses(currentFilter);
    }
}

// Function to toggle order item expansion
function toggleOrderItem(orderItem) {
    if (!orderItem) return;
    
    const isExpanded = orderItem.classList.contains('expanded');
    const toggleBtn = orderItem.querySelector('.toggle-btn img');
    
    if (isExpanded) {
        orderItem.classList.remove('expanded');
        if (toggleBtn) toggleBtn.src = 'icons/Arrow-Down-2.svg';
        
        // Hide details
        const details = orderItem.querySelector('.order-details');
        const actions = orderItem.querySelector('.order-actions');
        
        if (details) details.style.display = 'none';
        if (actions) actions.style.display = 'none';
        
        // Change summary layout
        const summary = orderItem.querySelector('.order-summary');
        if (summary) {
            summary.classList.add('collapsed');
        }
    } else {
        orderItem.classList.add('expanded');
        if (toggleBtn) toggleBtn.src = 'icons/Arrow-Up-2.svg';
        
        // Show details if they exist
        const details = orderItem.querySelector('.order-details');
        const actions = orderItem.querySelector('.order-actions');
        
        if (details) details.style.display = 'block';
        if (actions) actions.style.display = 'flex';
        
        // Change summary layout
        const summary = orderItem.querySelector('.order-summary');
        if (summary) {
            summary.classList.remove('collapsed');
        }
    }
}

// Function to toggle expense item expansion (similar to order item)
function toggleExpenseItem(expenseItem) {
    if (!expenseItem) return;
    
    const isExpanded = expenseItem.classList.contains('expanded');
    const toggleBtn = expenseItem.querySelector('.toggle-btn img');
    
    if (isExpanded) {
        expenseItem.classList.remove('expanded');
        if (toggleBtn) toggleBtn.src = 'icons/Arrow-Down-2.svg';
        
        // Hide details
        const details = expenseItem.querySelector('.expense-details');
        const actions = expenseItem.querySelector('.expense-actions');
        
        if (details) details.style.display = 'none';
        if (actions) actions.style.display = 'none';
        
        // Change summary layout
        const summary = expenseItem.querySelector('.expense-summary');
        if (summary) {
            summary.classList.add('collapsed');
        }
    } else {
        expenseItem.classList.add('expanded');
        if (toggleBtn) toggleBtn.src = 'icons/Arrow-Up-2.svg';
        
        // Show details if they exist
        const details = expenseItem.querySelector('.expense-details');
        const actions = expenseItem.querySelector('.expense-actions');
        
        if (details) details.style.display = 'block';
        if (actions) actions.style.display = 'flex';
        
        // Change summary layout
        const summary = expenseItem.querySelector('.expense-summary');
        if (summary) {
            summary.classList.remove('collapsed');
        }
    }
}

// Fungsi untuk mengambil dan mengolah data pesanan dari Supabase
async function fetchOrders(filterType = 'Seminggu Terakhir') {
    try {
        console.log("Fetching orders with filter:", filterType);
        
        // Get the date range based on filter type
        const dateRange = getDateRangeFromFilter(filterType);
        
        // Fetch orders from Supabase
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .gte('date', dateRange.startDate.toISOString())
            .lte('date', dateRange.endDate.toISOString())
            .order('date', { ascending: false });
            
        if (error) {
            console.error('Error fetching orders:', error);
            return;
        }
        
        console.log("Raw orders data:", data);
        
        if (!data || data.length === 0) {
            renderEmptyState('order-list');
            return;
        }
        
        // Process and group orders by date
        processOrdersData(data);
        
        // Render the grouped orders
        renderOrdersList();
        
    } catch (error) {
        console.error("Error in fetchOrders:", error);
        renderErrorState('order-list');
    }
}

// Fungsi untuk mengambil dan mengolah data pengeluaran dari Supabase
async function fetchExpenses(filterType = 'Seminggu Terakhir') {
    try {
        console.log("Fetching expenses with filter:", filterType);
        
        // Get the date range based on filter type
        const dateRange = getDateRangeFromFilter(filterType);
        
        // Fetch expenses from Supabase
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .gte('date', dateRange.startDate.toISOString())
            .lte('date', dateRange.endDate.toISOString())
            .order('date', { ascending: false });
            
        if (error) {
            console.error('Error fetching expenses:', error);
            return;
        }
        
        console.log("Raw expenses data:", data);
        
        if (!data || data.length === 0) {
            renderEmptyState('expense-list');
            return;
        }
        
        // Process and group expenses by date
        processExpensesData(data);
        
        // Render the grouped expenses
        renderExpensesList();
        
    } catch (error) {
        console.error("Error in fetchExpenses:", error);
        renderErrorState('expense-list');
    }
}

// Function to calculate date range based on filter
function getDateRangeFromFilter(filterType) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999); // End of today
    
    let startDate = new Date(now);
    
    switch (filterType) {
        case 'Hari Ini':
            startDate.setHours(0, 0, 0, 0); // Start of today
            break;
            
        case 'Kemarin':
            startDate.setDate(now.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(now.getDate() - 1);
            endDate.setHours(23, 59, 59, 999);
            break;
            
        case 'Seminggu Terakhir':
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
            
        case 'Bulan Ini':
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            break;
            
        case 'Bulan Lalu':
            startDate.setMonth(now.getMonth() - 1);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(0); // Last day of previous month
            endDate.setHours(23, 59, 59, 999);
            break;
            
        case 'Kustom':
            // For custom, we'll just use a 30-day range as placeholder
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            break;
            
        default:
            startDate.setDate(now.getDate() - 7); // Default to a week
            startDate.setHours(0, 0, 0, 0);
    }
    
    return { startDate, endDate };
}

// Process and group orders by date
function processOrdersData(orders) {
    groupedOrders = {};
    
    orders.forEach(order => {
        const orderDate = new Date(order.date);
        const dateString = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!groupedOrders[dateString]) {
            groupedOrders[dateString] = {
                date: orderDate,
                orders: [],
                totalAmount: 0,
                totalProfit: 0
            };
        }
        
        groupedOrders[dateString].orders.push(order);
        groupedOrders[dateString].totalAmount += order.price * order.quantity;
        groupedOrders[dateString].totalProfit += (order.price - (order.hpp || 0)) * order.quantity;
    });
    
    console.log("Grouped orders:", groupedOrders);
}

// Process and group expenses by date
function processExpensesData(expenses) {
    groupedExpenses = {};
    
    expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const dateString = expenseDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!groupedExpenses[dateString]) {
            groupedExpenses[dateString] = {
                date: expenseDate,
                expenses: [],
                totalAmount: 0
            };
        }
        
        groupedExpenses[dateString].expenses.push(expense);
        groupedExpenses[dateString].totalAmount += expense.amount || 0;
    });
    
    console.log("Grouped expenses:", groupedExpenses);
}

// Render the orders list
function renderOrdersList() {
    const orderListElement = document.querySelector('.order-list');
    if (!orderListElement) return;
    
    orderListElement.innerHTML = '';
    
    // Convert object to array and sort by date (newest first)
    const sortedDates = Object.keys(groupedOrders).sort().reverse();
    
    if (sortedDates.length === 0) {
        renderEmptyState('order-list');
        return;
    }
    
    sortedDates.forEach((dateString, index) => {
        const dateData = groupedOrders[dateString];
        const orderItem = createOrderItemElement(dateData, index === 0); // Expand first item
        orderListElement.appendChild(orderItem);
    });
}

// Render the expenses list
function renderExpensesList() {
    const expenseListElement = document.querySelector('.expense-list');
    if (!expenseListElement) return;
    
    expenseListElement.innerHTML = '';
    
    // Convert object to array and sort by date (newest first)
    const sortedDates = Object.keys(groupedExpenses).sort().reverse();
    
    if (sortedDates.length === 0) {
        renderEmptyState('expense-list');
        return;
    }
    
    sortedDates.forEach((dateString, index) => {
        const dateData = groupedExpenses[dateString];
        const expenseItem = createExpenseItemElement(dateData, index === 0); // Expand first item
        expenseListElement.appendChild(expenseItem);
    });
}

// Create an order item element
function createOrderItemElement(dateData, isExpanded = false) {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const date = dateData.date;
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const formattedDate = `${dayName}, ${day} ${month} ${year}`;
    
    const orderItem = document.createElement('div');
    orderItem.className = 'order-item' + (isExpanded ? ' expanded' : '');
    
    // Create the order header
    const orderHeader = document.createElement('div');
    orderHeader.className = 'order-header';
    orderHeader.innerHTML = `
        <div class="date">${formattedDate}</div>
        <div class="toggle-btn">
            <img src="icons/${isExpanded ? 'Arrow-Up-2' : 'Arrow-Down-2'}.svg" alt="${isExpanded ? 'Collapse' : 'Expand'}">
        </div>
    `;
    
    // Create the order summary
    const orderSummary = document.createElement('div');
    orderSummary.className = 'order-summary' + (isExpanded ? '' : ' collapsed');
    
    const totalAmount = formatCurrency(dateData.totalAmount);
    const totalProfit = formatCurrency(dateData.totalProfit);
    
    orderSummary.innerHTML = `
        <div class="summary-row">
            <div class="summary-label">Total Transaksi</div>
            <div class="summary-value">+${totalAmount}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Total Laba</div>
            <div class="summary-value">+${totalProfit}</div>
        </div>
    `;
    
    // Create order details (only for expanded items)
    const orderDetails = document.createElement('div');
    orderDetails.className = 'order-details';
    orderDetails.style.display = isExpanded ? 'block' : 'none';
    
    // Group identical items
    const groupedItems = {};
    dateData.orders.forEach(order => {
        const itemKey = `${order.name}_${order.price}_${order.hpp}`;
        if (!groupedItems[itemKey]) {
            groupedItems[itemKey] = {
                name: order.name,
                price: order.price,
                quantity: 0
            };
        }
        groupedItems[itemKey].quantity += order.quantity;
    });
    
    // Add each item to details
    Object.values(groupedItems).forEach(item => {
        const detailItem = document.createElement('div');
        detailItem.className = 'order-detail-item';
        detailItem.innerHTML = `
            <div class="item-name">${item.quantity}x ${item.name}</div>
            <div class="item-price">+${formatCurrency(item.price * item.quantity)}</div>
        `;
        orderDetails.appendChild(detailItem);
    });
    
    // Create order actions (share button)
    const orderActions = document.createElement('div');
    orderActions.className = 'order-actions';
    orderActions.style.display = isExpanded ? 'flex' : 'none';
    orderActions.innerHTML = `
        <button class="share-btn">
            <img src="icons/Download.svg" alt="Share">
        </button>
    `;
    
    // Assemble the order item
    orderItem.appendChild(orderHeader);
    orderItem.appendChild(orderSummary);
    orderItem.appendChild(orderDetails);
    orderItem.appendChild(orderActions);
    
    return orderItem;
}

// Create an expense item element
function createExpenseItemElement(dateData, isExpanded = false) {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const date = dateData.date;
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const formattedDate = `${dayName}, ${day} ${month} ${year}`;
    
    const expenseItem = document.createElement('div');
    expenseItem.className = 'expense-item' + (isExpanded ? ' expanded' : '');
    
    // Create the expense header
    const expenseHeader = document.createElement('div');
    expenseHeader.className = 'expense-header';
    expenseHeader.innerHTML = `
        <div class="date">${formattedDate}</div>
        <div class="toggle-btn">
            <img src="icons/${isExpanded ? 'Arrow-Up-2' : 'Arrow-Down-2'}.svg" alt="${isExpanded ? 'Collapse' : 'Expand'}">
        </div>
    `;
    
    // Create the expense summary
    const expenseSummary = document.createElement('div');
    expenseSummary.className = 'expense-summary' + (isExpanded ? '' : ' collapsed');
    
    const totalAmount = formatCurrency(dateData.totalAmount);
    
    // Gunakan saldo yang sudah dihitung sebelumnya
    const sisaSaldo = formatCurrency(currentBalance);
    
    expenseSummary.innerHTML = `
        <div class="summary-row">
            <div class="summary-label">Total Pengeluaran</div>
            <div class="summary-value">-${totalAmount}</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Sisa saldo</div>
            <div class="summary-value">${sisaSaldo}</div>
        </div>
    `;
    
    // Create expense details (only for expanded items)
    const expenseDetails = document.createElement('div');
    expenseDetails.className = 'expense-details';
    expenseDetails.style.display = isExpanded ? 'block' : 'none';
    
    // Group identical items
    const groupedItems = {};
    dateData.expenses.forEach(expense => {
        if (!groupedItems[expense.name]) {
            groupedItems[expense.name] = {
                name: expense.name,
                amount: 0,
                count: 0
            };
        }
        groupedItems[expense.name].amount += expense.amount || 0;
        groupedItems[expense.name].count += 1;
    });
    
    // Add each item to details
    Object.values(groupedItems).forEach(item => {
        const detailItem = document.createElement('div');
        detailItem.className = 'expense-detail-item';
        detailItem.innerHTML = `
            <div class="item-name">${item.count}x ${item.name}</div>
            <div class="item-price">-${formatCurrency(item.amount)}</div>
        `;
        expenseDetails.appendChild(detailItem);
    });
    
    // Create expense actions (share button)
    const expenseActions = document.createElement('div');
    expenseActions.className = 'expense-actions';
    expenseActions.style.display = isExpanded ? 'flex' : 'none';
    expenseActions.innerHTML = `
        <button class="share-btn">
            <img src="icons/Download.svg" alt="Share">
        </button>
    `;
    
    // Assemble the expense item
    expenseItem.appendChild(expenseHeader);
    expenseItem.appendChild(expenseSummary);
    expenseItem.appendChild(expenseDetails);
    expenseItem.appendChild(expenseActions);
    
    return expenseItem;
}

// Render empty state
function renderEmptyState(containerClass) {
    const containerElement = document.querySelector(`.${containerClass}`);
    if (!containerElement) return;
    
    containerElement.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: #666;">
            <p>${containerClass === 'order-list' ? 'Tidak ada transaksi' : 'Tidak ada pengeluaran'} untuk periode ini</p>
        </div>
    `;
}

// Render error state
function renderErrorState(containerClass) {
    const containerElement = document.querySelector(`.${containerClass}`);
    if (!containerElement) return;
    
    containerElement.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: #666;">
            <p>Terjadi kesalahan saat memuat data</p>
            <button id="retry-btn" style="margin-top: 15px; padding: 8px 16px; background-color: #000; color: #fff; border: none; border-radius: 8px; cursor: pointer;">
                Coba Lagi
            </button>
        </div>
    `;
    
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            if (containerClass === 'order-list') {
                fetchOrders(currentFilter);
            } else {
                fetchExpenses(currentFilter);
            }
        });
    }
}

// Format currency to "Rp X.XXX.XXX" format
function formatCurrency(amount) {
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}