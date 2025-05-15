// Inisialisasi Supabase
const supabaseUrl = 'https://jbvfjehpgvadponxkvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidmZqZWhwZ3ZhZHBvbnhrdnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODg3NzUsImV4cCI6MjA2MjM2NDc3NX0.YLXNLhpodvmhRa5RfPlHQhiVPvoqmnOZb7b-HFcFo8k';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Data global
let products = [];
let currentProduct = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    const productListElement = document.querySelector('.product-list');
    const searchInput = document.querySelector('.search-bar input');
    const btnTambahProduk = document.querySelector('.btn-tambah-produk');
    const btnFilter = document.querySelector('.btn-filter');

    // Modal elements
    const productOptionsModal = document.getElementById('product-options-modal');
    const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    const btnEditProduct = document.getElementById('btn-edit-product');
    const btnDeleteProduct = document.getElementById('btn-delete-product');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const closeButtons = document.querySelectorAll('.close');

    // Event Listeners
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    if (btnTambahProduk) {
        btnTambahProduk.addEventListener('click', goToTambahProduk);
    }

    if (btnFilter) {
        btnFilter.addEventListener('click', () => {
            alert('Fitur filter akan ditambahkan di versi berikutnya');
        });
    }

    // Modal event listeners
    if (btnEditProduct) {
        btnEditProduct.addEventListener('click', function() {
            if (currentProduct) {
                goToEditProduk(currentProduct.id);
                closeModal(productOptionsModal);
            }
        });
    }

    if (btnDeleteProduct) {
        btnDeleteProduct.addEventListener('click', function() {
            if (currentProduct) {
                closeModal(productOptionsModal);
                openModal(deleteConfirmationModal);
            }
        });
    }

    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', function() {
            closeModal(deleteConfirmationModal);
        });
    }

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', function() {
            if (currentProduct) {
                deleteProduk(currentProduct.id);
                closeModal(deleteConfirmationModal);
            }
        });
    }

    // Close buttons for modals
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });

    // Close modal when clicking outside modal content
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });

    // Navbar event listeners
    const navItems = document.querySelectorAll('.navbar .nav-item');
    if (navItems.length >= 3) {
        // Kasir (item 1)
        navItems[0].addEventListener('click', function() {
            window.location.href = 'index.html';
        });

        // Current page - Katalog (item 2)
        // No event needed as we're already on this page

        // Riwayat/Laporan (item 3)
        navItems[2].addEventListener('click', function() {
            window.location.href = 'riwayat.html';
        });
    }

    // Mulai aplikasi
    init();
});

// Fungsi Inisialisasi
async function init() {
    console.log("Initializing katalog...");
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
            .select('*')
            .order('id');

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
        <div class="product-options">
            <button class="btn-options" data-id="${id}">
                <img src="icons/More-Square.svg" alt="Options">
            </button>
        </div>
    `;

    // Tambahkan event listener untuk tombol options
    const btnOptions = productCard.querySelector('.btn-options');
    if (btnOptions) {
        btnOptions.addEventListener('click', function() {
            currentProduct = product;
            openProductOptionsModal();
        });
    }

    return productCard;
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

// Fungsi Modal
function openProductOptionsModal() {
    const modal = document.getElementById('product-options-modal');
    openModal(modal);
}

function openModal(modal) {
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
    }
}

// Fungsi untuk pergi ke halaman tambah produk
function goToTambahProduk() {
    window.location.href = 'tambah-produk.html';
}

// Fungsi untuk pergi ke halaman edit produk
function goToEditProduk(productId) {
    window.location.href = `ubah-produk.html?id=${productId}`;
}

// Fungsi untuk menghapus produk
async function deleteProduk(productId) {
    try {
        console.log("Deleting product with ID:", productId);
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
            
        if (error) {
            console.error('Error deleting product:', error);
            alert("Gagal menghapus produk: " + error.message);
            return;
        }
        
        alert("Produk berhasil dihapus");
        
        // Refresh data produk
        await fetchProducts();
        renderProducts(products);
    } catch (error) {
        console.error('Unexpected error:', error);
        alert("Terjadi kesalahan: " + error.message);
    }
}

// Helper function untuk format angka
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}