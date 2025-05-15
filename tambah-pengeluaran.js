// Inisialisasi Supabase
const supabaseUrl = 'https://jbvfjehpgvadponxkvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidmZqZWhwZ3ZhZHBvbnhrdnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODg3NzUsImV4cCI6MjA2MjM2NDc3NX0.YLXNLhpodvmhRa5RfPlHQhiVPvoqmnOZb7b-HFcFo8k';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Data global
let items = [{ name: '', price: 0 }]; // Defaultnya satu item kosong
let totalPengeluaran = 0;
let sisaSaldo = 45000; // Nilai default atau bisa diambil dari kalkulasi pendapatan - pengeluaran

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    const tanggalInput = document.getElementById('tanggal');
    const btnAddItem = document.getElementById('btn-add-item');
    const btnSimpan = document.getElementById('btn-simpan');
    const expenseItemsContainer = document.getElementById('expense-items');
    const totalPengeluaranElement = document.getElementById('total-pengeluaran');
    const sisaSaldoElement = document.getElementById('sisa-saldo');

    // Set tanggal default (hari ini)
    const today = new Date();
    const formattedDate = formatDateForInput(today);
    if (tanggalInput) tanggalInput.value = formattedDate;

    // Event listener untuk tombol tambah item
    if (btnAddItem) {
        btnAddItem.addEventListener('click', addNewItem);
    }

    // Event listener untuk tombol simpan
    if (btnSimpan) {
        btnSimpan.addEventListener('click', saveExpense);
    }

    // Inisialisasi item pertama dengan event listeners
    setupInitialItem();

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

        // Laporan (item 3) - halaman sebelumnya
        navItems[2].addEventListener('click', function() {
            window.location.href = 'riwayat.html';
        });
    }
});

// Setup item awal
function setupInitialItem() {
    const itemInputs = document.querySelectorAll('.item-input');
    const priceInputs = document.querySelectorAll('.price-input');

    if (itemInputs.length > 0 && priceInputs.length > 0) {
        itemInputs[0].addEventListener('input', function() {
            items[0].name = this.value;
        });

        priceInputs[0].addEventListener('input', function() {
            formatRupiah(this);
            items[0].price = parseRupiah(this.value);
            updateTotals();
        });
    }
}

// Fungsi untuk menambah item baru
function addNewItem() {
    // Tambahkan item baru ke array
    items.push({ name: '', price: 0 });
    
    // Buat elemen HTML baru
    const newItemElement = document.createElement('div');
    newItemElement.className = 'expense-item';
    newItemElement.innerHTML = `
        <div class="item-row">
            <div class="item-name">
                <span>${items.length}x</span>
                <input type="text" class="item-input" placeholder="Nama Item">
            </div>
            <div class="item-price">
                <input type="text" class="price-input" placeholder="Rp 00.00">
            </div>
        </div>
    `;
    
    // Tambahkan ke container
    const expenseItemsContainer = document.getElementById('expense-items');
    if (expenseItemsContainer) {
        expenseItemsContainer.appendChild(newItemElement);
    }
    
    // Setup event listeners untuk input baru
    const itemIndex = items.length - 1;
    const newItemInput = newItemElement.querySelector('.item-input');
    const newPriceInput = newItemElement.querySelector('.price-input');
    
    if (newItemInput) {
        newItemInput.addEventListener('input', function() {
            items[itemIndex].name = this.value;
        });
    }
    
    if (newPriceInput) {
        newPriceInput.addEventListener('input', function() {
            formatRupiah(this);
            items[itemIndex].price = parseRupiah(this.value);
            updateTotals();
        });
    }
}

// Fungsi untuk menghitung total
function updateTotals() {
    totalPengeluaran = 0;
    
    // Hitung total pengeluaran
    items.forEach(item => {
        totalPengeluaran += item.price;
    });
    
    // Update tampilan
    const totalPengeluaranElement = document.getElementById('total-pengeluaran');
    const sisaSaldoElement = document.getElementById('sisa-saldo');
    
    if (totalPengeluaranElement) {
        totalPengeluaranElement.textContent = formatCurrency(totalPengeluaran);
    }
    
    // Hitung dan update sisa saldo
    if (sisaSaldoElement) {
        sisaSaldo = 45000 - totalPengeluaran; // Contoh saldo awal adalah 45000
        sisaSaldoElement.textContent = formatCurrency(sisaSaldo);
    }
}

// Fungsi untuk menyimpan pengeluaran
async function saveExpense() {
    const tanggalInput = document.getElementById('tanggal');
    
    if (!tanggalInput || !tanggalInput.value) {
        alert('Pilih tanggal terlebih dahulu');
        return;
    }
    
    // Filter item yang kosong
    const validItems = items.filter(item => item.name.trim() !== '' && item.price > 0);
    
    if (validItems.length === 0) {
        alert('Masukkan setidaknya satu item pengeluaran');
        return;
    }
    
    try {
        // Buat group ID unik untuk mengelompokkan item pengeluaran ini
        const groupId = 'exp_' + Date.now();
        
        // Siapkan data untuk disimpan
        const expenseData = validItems.map(item => ({
            name: item.name.trim(),
            amount: item.price,
            date: new Date(tanggalInput.value),
            type: 'expense',
            group_id: groupId // Tambahkan group ID untuk mengelompokkan item yang sama
        }));
        
        console.log("Saving expense data:", expenseData);
        
        // Simpan ke Supabase
        const { data, error } = await supabase
            .from('expenses')
            .insert(expenseData);
            
        if (error) {
            console.error('Error saving expense:', error);
            alert('Gagal menyimpan pengeluaran: ' + error.message);
            return;
        }
        
        console.log("Expense saved successfully:", data);
        alert('Pengeluaran berhasil disimpan!');
        
        // Kembali ke halaman laporan
        window.location.href = 'riwayat.html';
        
    } catch (error) {
        console.error('Unexpected error:', error);
        alert('Terjadi kesalahan: ' + error.message);
    }
}

// Helper function untuk format tanggal untuk input date (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Helper function untuk format Rupiah
function formatRupiah(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        value = parseInt(value).toString();
        value = 'Rp ' + value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else {
        value = '';
    }
    
    input.value = value;
}

// Helper function untuk parse Rupiah menjadi angka
function parseRupiah(rupiahString) {
    if (!rupiahString) return 0;
    return parseInt(rupiahString.replace(/\D/g, '')) || 0;
}

// Format currency to "Rp X.XXX.XXX" format
function formatCurrency(amount) {
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}