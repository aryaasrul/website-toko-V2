// Inisialisasi Supabase
const supabaseUrl = 'https://jbvfjehpgvadponxkvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidmZqZWhwZ3ZhZHBvbnhrdnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODg3NzUsImV4cCI6MjA2MjM2NDc3NX0.YLXNLhpodvmhRa5RfPlHQhiVPvoqmnOZb7b-HFcFo8k';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- DATA GLOBAL ---
let products = [];
let cart = [];
let totalAmount = 0;
let totalProfit = 0;

// --- FUNGSI UTAMA YANG DIJALANKAN SAAT HALAMAN DIMUAT ---
document.addEventListener('DOMContentLoaded', function() {
    // Mengambil elemen-elemen dari halaman (DOM)
    const productListElement = document.querySelector('.product-list');
    const categoriesElement = document.querySelector('.categories');
    const searchInput = document.querySelector('.search-bar input');
    const inputManualBtn = document.querySelector('.btn-input-manual');
    const btnProcess = document.getElementById('btn-process');
    const btnConnectPrinter = document.getElementById('btn-connect-printer');

    // Menambahkan 'event listener' ke setiap tombol
    if (inputManualBtn) {
        inputManualBtn.addEventListener('click', goToInputManual);
    }
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    if (btnProcess) {
        btnProcess.addEventListener('click', processOrder);
    }
    if (btnConnectPrinter) {
        btnConnectPrinter.addEventListener('click', () => {
            if (window.printerModule) {
                window.printerModule.connectToPrinter();
            } else {
                alert('Modul printer tidak ditemukan. Pastikan file printer.js sudah dimuat.');
            }
        });
    }

    // Navigasi bawah
    const navItems = document.querySelectorAll('.navbar .nav-item');
    if (navItems.length >= 3) {
        navItems[1].addEventListener('click', () => window.location.href = 'katalog.html');
        navItems[2].addEventListener('click', () => window.location.href = 'riwayat.html');
    }

    // Mulai aplikasi
    init();
});

/**
 * Fungsi inisialisasi utama untuk memulai aplikasi kasir.
 */
async function init() {
    console.log("Memulai aplikasi kasir...");
    await fetchProducts();
    await loadCategories();
    renderProducts(products);
    updateCartSummary(); // Pastikan total di awal adalah 0
}

// --- FUNGSI-FUNGSI UNTUK MENGAMBIL DATA ---

/**
 * Mengambil semua produk dari database Supabase.
 */
async function fetchProducts() {
    try {
        console.log("Mengambil data produk...");
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        products = data || [];
        console.log("Produk berhasil diambil:", products);
    } catch (error) {
        console.error('Gagal mengambil data produk:', error);
        alert("Gagal mengambil data produk: " + error.message);
    }
}

/**
 * Membuat daftar kategori unik dari data produk.
 */
async function loadCategories() {
    try {
        const uniqueCategories = new Set(['Semua Produk']);
        products.forEach(product => {
            if (Array.isArray(product.kategori)) {
                product.kategori.forEach(cat => uniqueCategories.add(cat));
            } else if (product.kategori) {
                uniqueCategories.add(product.kategori);
            }
        });
        renderCategories(Array.from(uniqueCategories));
    } catch (error) {
        console.error("Gagal memuat kategori:", error);
    }
}

// --- FUNGSI-FUNGSI UNTUK MENAMPILKAN DATA KE UI (RENDER) ---

/**
 * Menampilkan tombol-tombol kategori di UI.
 * @param {Array<string>} categories - Daftar nama kategori.
 */
function renderCategories(categories) {
    const categoriesElement = document.querySelector('.categories');
    if (!categoriesElement) return;
    categoriesElement.innerHTML = '';

    categories.forEach((category, index) => {
        const button = document.createElement('button');
        button.className = 'category';
        button.textContent = category;
        if (index === 0) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            document.querySelectorAll('.category.active').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            filterProductsByCategory(category);
        });
        categoriesElement.appendChild(button);
    });
}

/**
 * Menampilkan semua produk ke dalam daftar.
 * @param {Array<Object>} productsToRender - Daftar produk yang akan ditampilkan.
 */
function renderProducts(productsToRender) {
    const productListElement = document.querySelector('.product-list');
    if (!productListElement) return;
    productListElement.innerHTML = '';

    if (!productsToRender || productsToRender.length === 0) {
        productListElement.innerHTML = '<p style="text-align: center; padding: 20px;">Produk tidak ditemukan.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productInCart = cart.find(item => item.id === product.id);
        const quantity = productInCart ? productInCart.quantity : 0;

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-info">
                <div class="product-image"></div>
                <div class="product-details">
                    <h3>${product.name || 'Tanpa Nama'}</h3>
                    <p>Rp ${formatNumber(product.price || 0)}</p>
                </div>
            </div>
            <div class="quantity-control">
                <button class="btn-minus" data-id="${product.id}">
                    <img src="icons/icon-minus-circle.svg" alt="Minus">
                </button>
                <span id="quantity-${product.id}">${quantity}</span>
                <button class="btn-plus" data-id="${product.id}">
                    <img src="icons/icon-plus-circle.svg" alt="Plus">
                </button>
            </div>
        `;
        productListElement.appendChild(productCard);

        productCard.querySelector('.btn-plus').addEventListener('click', () => incrementQuantity(product));
        productCard.querySelector('.btn-minus').addEventListener('click', () => decrementQuantity(product));
    });
}

// --- FUNGSI-FUNGSI UNTUK LOGIKA KERANJANG BELANJA (CART) ---

/**
 * Menambah jumlah produk di keranjang.
 * @param {Object} product - Produk yang akan ditambahkan.
 */
function incrementQuantity(product) {
    const existingProduct = cart.find(item => item.id === product.id);

    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            hpp: product.hpp || 0,
            quantity: 1
        });
    }
    updateProductQuantityUI(product.id);
    updateCartSummary();
}

/**
 * Mengurangi jumlah produk di keranjang.
 * @param {Object} product - Produk yang akan dikurangi.
 */
function decrementQuantity(product) {
    const existingProductIndex = cart.findIndex(item => item.id === product.id);

    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity--;
        if (cart[existingProductIndex].quantity === 0) {
            cart.splice(existingProductIndex, 1);
        }
        updateProductQuantityUI(product.id);
        updateCartSummary();
    }
}

/**
 * Memperbarui angka jumlah di UI untuk satu produk.
 * @param {number} productId - ID produk yang akan diperbarui.
 */
function updateProductQuantityUI(productId) {
    const quantityElement = document.getElementById(`quantity-${productId}`);
    if (quantityElement) {
        const productInCart = cart.find(item => item.id === productId);
        quantityElement.textContent = productInCart ? productInCart.quantity : 0;
    }
}

/**
 * Menghitung ulang dan menampilkan total harga di ringkasan keranjang.
 */
function updateCartSummary() {
    totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalProfit = cart.reduce((sum, item) => sum + ((item.price - item.hpp) * item.quantity), 0);

    const totalAmountElement = document.getElementById('total-amount');
    if (totalAmountElement) {
        totalAmountElement.textContent = `Rp ${formatNumber(totalAmount)}`;
    }
    console.log("Keranjang diperbarui:", cart);
    console.log(`Total: Rp ${totalAmount}, Laba: Rp ${totalProfit}`);
}

// --- FUNGSI-FUNGSI UNTUK INTERAKSI PENGGUNA ---

/**
 * Menyaring produk berdasarkan kata kunci pencarian.
 */
function handleSearch() {
    const searchTerm = document.querySelector('.search-bar input').value.toLowerCase();
    const activeCategory = document.querySelector('.category.active').textContent;
    
    let filteredProducts = products;

    if (activeCategory !== 'Semua Produk') {
        filteredProducts = products.filter(p => Array.isArray(p.kategori) && p.kategori.includes(activeCategory));
    }

    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(searchTerm));
    }

    renderProducts(filteredProducts);
}

/**
 * Menyaring produk berdasarkan kategori yang dipilih.
 * @param {string} category - Kategori yang dipilih.
 */
function filterProductsByCategory(category) {
    handleSearch(); // Pencarian akan otomatis mempertimbangkan kategori aktif
}

/**
 * Pindah ke halaman input manual.
 */
function goToInputManual() {
    window.location.href = 'input-manual.html';
}

// --- FUNGSI PEMROSESAN PESANAN DAN PENCETAKAN ---

/**
 * Memproses pesanan: menyimpan ke database dan mencetak struk.
 */
async function processOrder() {
    if (cart.length === 0) {
        alert('Keranjang kosong. Tambahkan produk terlebih dahulu!');
        return;
    }

    const btnProcess = document.getElementById('btn-process');
    btnProcess.disabled = true;
    btnProcess.textContent = 'Memproses...';

    try {
        console.log("Memproses pesanan:", cart);
        
        const transactionId = 'txn_' + Date.now();
        const orderItems = cart.map(item => ({
            transaction_id: transactionId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            hpp: item.hpp || 0,
            date: new Date()
        }));

        const { data, error } = await supabase.from('orders').insert(orderItems);
        if (error) throw error;

        console.log("Pesanan berhasil disimpan:", data);
        alert('Pesanan berhasil disimpan!');
        
        // Coba cetak struk jika printer terhubung
        if (window.printerModule && window.printerModule.isPrinterConnected()) {
            console.log("Mencoba mencetak struk...");
            const userName = sessionStorage.getItem('posUserName');
            await window.printerModule.printReceipt(cart, totalAmount, userName);
        } else {
            console.log("Printer tidak terhubung, pesanan hanya disimpan.");
            alert('Pesanan disimpan, tetapi struk tidak dicetak karena printer tidak terhubung.');
        }

        // Reset keranjang dan UI
        cart = [];
        renderProducts(products);
        updateCartSummary();

    } catch (err) {
        console.error('Terjadi kesalahan saat memproses pesanan:', err);
        alert('Terjadi kesalahan: ' + err.message);
    } finally {
        // Pastikan tombol kembali normal
        btnProcess.disabled = false;
        btnProcess.textContent = 'Proses Pesanan';
    }
}

// --- FUNGSI BANTU (HELPER) ---

/**
 * Memformat angka menjadi format ribuan (misal: 1000 menjadi 1.000).
 * @param {number} number - Angka yang akan diformat.
 * @returns {string}
 */
function formatNumber(number) {
    if (typeof number !== 'number') return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
