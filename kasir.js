// Inisialisasi Supabase
const supabaseUrl = 'https://jbvfjehpgvadponxkvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidmZqZWhwZ3ZhZHBvbnhrdnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODg3NzUsImV4cCI6MjA2MjM2NDc3NX0.YLXNLhpodvmhRa5RfPlHQhiVPvoqmnOZb7b-HFcFo8k';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Data global
let products = [];
let cart = [];
let totalAmount = 0;
let totalProfit = 0;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    const productListElement = document.querySelector('.product-list');
    const categoriesElement = document.querySelector('.categories');
    const searchInput = document.querySelector('.search-bar input');
    const inputManualBtn = document.querySelector('.btn-input-manual');
    const btnProcess = document.getElementById('btn-process');

    // Test koneksi Supabase
    testSupabaseConnection();

    // Event Listeners
    if (inputManualBtn) {
        inputManualBtn.addEventListener('click', goToInputManual);
    }

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    if (btnProcess) {
        btnProcess.addEventListener('click', processOrder);
    }

    // Navbar event listeners
    const navItems = document.querySelectorAll('.navbar .nav-item');
    if (navItems.length >= 3) {
        // Current page - Kasir (item 1)
        // No event needed as we're already on this page

        // Katalog (item 2)
        navItems[1].addEventListener('click', function() {
            window.location.href = 'katalog.html';
        });

        // Riwayat/Laporan (item 3)
        navItems[2].addEventListener('click', function() {
            window.location.href = 'riwayat.html';
        });
    }

    // Mulai aplikasi
    init();
});

// Test koneksi Supabase
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('products').select('count');
        if (error) {
            console.error('Supabase connection test failed:', error);
            return false;
        }
        console.log('Supabase connection successful!', data);
        return true;
    } catch (e) {
        console.error('Supabase connection test error:', e);
        return false;
    }
}

// Fungsi Inisialisasi
async function init() {
    console.log("Initializing...");
    await fetchProducts();
    await loadCategories();
    renderProducts(products);
}

// Fungsi untuk memuat kategori dari database
async function loadCategories() {
    try {
        console.log("Loading categories...");
        
        // Set kategori default
        const defaultCategories = ['Semua Produk', 'Espresso Based', 'Milk Based'];
        
        // Ambil kategori unik dari produk
        const uniqueCategories = new Set(['Semua Produk']);
        
        // Ekstrak kategori dari semua produk
        products.forEach(product => {
            if (product.kategori) {
                // Jika kategori adalah array
                if (Array.isArray(product.kategori)) {
                    product.kategori.forEach(cat => uniqueCategories.add(cat));
                }
                // Jika kategori adalah string JSON
                else if (typeof product.kategori === 'string' && product.kategori.startsWith('[')) {
                    try {
                        const kategoriArray = JSON.parse(product.kategori);
                        if (Array.isArray(kategoriArray)) {
                            kategoriArray.forEach(cat => uniqueCategories.add(cat));
                        }
                    } catch (e) {
                        console.error("Error parsing kategori JSON:", e);
                    }
                }
                // Jika kategori adalah string biasa
                else if (typeof product.kategori === 'string') {
                    uniqueCategories.add(product.kategori);
                }
            }
        });
        
        console.log("Unique categories found:", Array.from(uniqueCategories));
        
        // Jika tidak ada kategori, gunakan default
        if (uniqueCategories.size <= 1) {
            console.log("No categories found, using defaults");
            defaultCategories.forEach(cat => uniqueCategories.add(cat));
        }
        
        // Render kategori ke UI
        renderCategories(Array.from(uniqueCategories));
    } catch (error) {
        console.error("Error loading categories:", error);
        // Jika gagal, tetap tampilkan kategori default
        renderCategories(['Semua Produk', 'Espresso Based', 'Milk Based']);
    }
}

// Fungsi untuk render kategori ke UI
function renderCategories(categories) {
    const categoriesElement = document.querySelector('.categories');
    if (!categoriesElement) {
        console.error("Categories element not found!");
        return;
    }
    
    categoriesElement.innerHTML = '';
    
    categories.forEach((category, index) => {
        const categoryButton = document.createElement('button');
        categoryButton.className = 'category';
        
        if (index === 0) {
            categoryButton.classList.add('active');
        }
        
        categoryButton.textContent = category;
        categoryButton.addEventListener('click', () => {
            // Hapus kelas active dari semua tombol
            document.querySelectorAll('.category').forEach(btn => btn.classList.remove('active'));
            
            // Tambahkan kelas active ke tombol yang diklik
            categoryButton.classList.add('active');
            
            // Filter produk berdasarkan kategori
            filterProductsByCategory(category);
        });
        
        categoriesElement.appendChild(categoryButton);
    });
}

// Fungsi untuk mengambil data produk dari Supabase
async function fetchProducts() {
    try {
        console.log("Fetching products...");
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) {
            console.error('Error fetching products:', error);
            alert("Gagal mengambil data produk: " + error.message);
            return;
        }

        console.log("Products fetched:", data);
        if (data) {
            products = data;
        } else {
            console.warn("No products data received");
            products = [];
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        alert("Terjadi kesalahan: " + error.message);
    }
}

// Fungsi untuk menampilkan produk
function renderProducts(productsToRender) {
    const productListElement = document.querySelector('.product-list');
    if (!productListElement) {
        console.error("Product list element not found!");
        return;
    }
    
    console.log("Rendering products:", productsToRender);
    productListElement.innerHTML = '';

    if (!productsToRender || productsToRender.length === 0) {
        productListElement.innerHTML = '<p style="text-align: center; padding: 20px;">Tidak ada produk yang tersedia.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productElement = createProductElement(product);
        productListElement.appendChild(productElement);
    });
}

// Fungsi untuk membuat elemen produk
function createProductElement(product) {
    console.log("Creating product element for:", product);
    
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Pastikan properti yang dibutuhkan ada
    const name = product.name || 'Produk Tanpa Nama';
    const price = product.price || 0;
    const id = product.id || Date.now(); // Fallback ke timestamp jika tidak ada ID
    
    productCard.innerHTML = `
        <div class="product-info">
            <div class="product-image"></div>
            <div class="product-details">
                <h3>${name}</h3>
                <p>Rp. ${formatNumber(price)}</p>
            </div>
        </div>
        <div class="quantity-control">
            <button class="btn-minus" data-id="${id}">
                <img src="icons/icon-minus-circle.svg" alt="Minus">
            </button>
            <span id="quantity-${id}">0</span>
            <button class="btn-plus" data-id="${id}">
                <img src="icons/icon-plus-circle.svg" alt="Plus">
            </button>
        </div>
    `;

    // Tambahkan event listener untuk tombol plus dan minus
    const btnPlus = productCard.querySelector('.btn-plus');
    const btnMinus = productCard.querySelector('.btn-minus');

    btnPlus.addEventListener('click', () => incrementQuantity(product));
    btnMinus.addEventListener('click', () => decrementQuantity(product));

    return productCard;
}

// Fungsi untuk menambah jumlah produk
function incrementQuantity(product) {
    // Cek apakah produk sudah ada di cart
    const existingProductIndex = cart.findIndex(item => item.id === product.id);

    if (existingProductIndex !== -1) {
        // Jika sudah ada, tambah jumlahnya
        cart[existingProductIndex].quantity += 1;
    } else {
        // Jika belum ada, tambahkan ke cart
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            hpp: product.hpp || 0,
            quantity: 1
        });
    }

    // Update tampilan
    const quantityElement = document.getElementById(`quantity-${product.id}`);
    if (quantityElement) {
        const currentQuantity = parseInt(quantityElement.textContent) + 1;
        quantityElement.textContent = currentQuantity;
    }

    // Update total
    calculateTotal();
}

// Fungsi untuk mengurangi jumlah produk
function decrementQuantity(product) {
    // Cek apakah produk sudah ada di cart
    const existingProductIndex = cart.findIndex(item => item.id === product.id);

    if (existingProductIndex !== -1) {
        // Jika ada, kurangi jumlahnya
        if (cart[existingProductIndex].quantity > 0) {
            cart[existingProductIndex].quantity -= 1;

            // Jika jumlahnya 0, hapus dari cart
            if (cart[existingProductIndex].quantity === 0) {
                cart.splice(existingProductIndex, 1);
            }

            // Update tampilan
            const quantityElement = document.getElementById(`quantity-${product.id}`);
            if (quantityElement) {
                const currentQuantity = parseInt(quantityElement.textContent) - 1;
                quantityElement.textContent = currentQuantity >= 0 ? currentQuantity : 0;
            }

            // Update total
            calculateTotal();
        }
    }
}

// Fungsi untuk menghitung total
function calculateTotal() {
    totalAmount = 0;
    totalProfit = 0;

    cart.forEach(item => {
        totalAmount += item.price * item.quantity;
        totalProfit += (item.price - (item.hpp || 0)) * item.quantity;
    });

    // Jika ada elemen total, update
    const totalElement = document.getElementById('total-amount');
    if (totalElement) {
        totalElement.textContent = `Rp. ${formatNumber(totalAmount)}`;
    }
    
    console.log("Cart updated:", cart);
    console.log("Total: Rp.", totalAmount, "Profit: Rp.", totalProfit);
}

// Fungsi untuk mencari produk
function handleSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        renderProducts(products);
        return;
    }

    const filteredProducts = products.filter(product => 
        product.name && product.name.toLowerCase().includes(searchTerm)
    );

    renderProducts(filteredProducts);
}

// Fungsi untuk filter berdasarkan kategori
function filterProductsByCategory(category) {
    console.log("Filtering by category:", category);
    
    if (category === 'Semua Produk') {
        renderProducts(products);
        return;
    }

    const filteredProducts = products.filter(product => {
        // Periksa berbagai kemungkinan format kategori
        if (product.kategori) {
            // 1. Jika kategori adalah array JSON
            if (Array.isArray(product.kategori)) {
                return product.kategori.includes(category);
            } 
            // 2. Jika kategori adalah string JSON yang bisa di-parse menjadi array
            else if (typeof product.kategori === 'string' && product.kategori.startsWith('[')) {
                try {
                    const kategoriArray = JSON.parse(product.kategori);
                    return Array.isArray(kategoriArray) && kategoriArray.includes(category);
                } catch (e) {
                    console.error("Error parsing kategori JSON:", e);
                    return false;
                }
            }
            // 3. Jika kategori adalah string biasa
            else if (typeof product.kategori === 'string') {
                return product.kategori === category || product.kategori.includes(category);
            }
        }
        return false;
    });

    console.log("Filtered products:", filteredProducts);
    renderProducts(filteredProducts);
}

// Fungsi untuk pergi ke halaman input manual
function goToInputManual() {
    window.location.href = 'input-manual.html';
}

// Fungsi untuk memproses pesanan
async function processOrder() {
    if (cart.length === 0) {
        alert('Keranjang kosong. Tambahkan produk terlebih dahulu!');
        return;
    }

    try {
        console.log("Processing order:", cart);
        
        // Siapkan data untuk disimpan ke database
        const orderItems = cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            hpp: item.hpp || 0,
            date: new Date()
        }));

        // Simpan ke Supabase
        const { data, error } = await supabase
            .from('orders')
            .insert(orderItems);

        if (error) {
            console.error('Error adding order:', error);
            alert('Terjadi kesalahan saat menyimpan pesanan: ' + error.message);
            return;
        }

        console.log("Order saved successfully:", data);
        alert('Pesanan berhasil disimpan!');
        
        // Reset cart
        cart = [];
        renderProducts(products);
        calculateTotal();
    } catch (error) {
        console.error('Unexpected error:', error);
        alert('Terjadi kesalahan: ' + error.message);
    }
}

// Helper function untuk format angka
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}