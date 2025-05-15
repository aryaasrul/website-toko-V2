// Inisialisasi Supabase
const supabaseUrl = 'https://jbvfjehpgvadponxkvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidmZqZWhwZ3ZhZHBvbnhrdnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODg3NzUsImV4cCI6MjA2MjM2NDc3NX0.YLXNLhpodvmhRa5RfPlHQhiVPvoqmnOZb7b-HFcFo8k';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Data global
let categories = [];
let selectedCategories = [];
let isEditMode = false;
let currentProductId = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', async function() {
    const namaProdukInput = document.getElementById('nama-produk');
    const hargaJualInput = document.getElementById('harga-jual');
    const hargaHppInput = document.getElementById('harga-hpp');
    const namaProdukCount = document.getElementById('nama-produk-count');
    const hargaJualCount = document.getElementById('harga-jual-count');
    const hargaHppCount = document.getElementById('harga-hpp-count');
    const photoUpload = document.getElementById('photo-upload');
    const btnAturKategori = document.querySelector('.btn-atur-kategori');
    const btnSimpan = document.getElementById('btn-simpan');
    const btnHapus = document.getElementById('btn-hapus');
    const kategoriModal = document.getElementById('kategori-modal');
    const btnAddKategori = document.getElementById('btn-add-kategori');
    const btnTerapkanKategori = document.getElementById('btn-terapkan-kategori');
    const newKategoriInput = document.getElementById('new-kategori');
    const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const closeButtons = document.querySelectorAll('.close');

    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        isEditMode = true;
        currentProductId = productId;
        document.querySelector('.header h1').textContent = 'Ubah Produk';
        
        // Load product data
        await loadProductData(productId);
    } else {
        isEditMode = false;
        document.querySelector('.header h1').textContent = 'Tambah Produk';
        
        // Hide delete button in add mode
        if (btnHapus) btnHapus.style.display = 'none';
    }

    // Event Listeners for form inputs
    if (namaProdukInput) {
        namaProdukInput.addEventListener('input', function() {
            if (namaProdukCount) namaProdukCount.textContent = this.value.length;
        });
    }

    if (hargaJualInput) {
        hargaJualInput.addEventListener('input', function() {
            formatRupiah(this);
            if (hargaJualCount) hargaJualCount.textContent = this.value.length;
        });
    }

    if (hargaHppInput) {
        hargaHppInput.addEventListener('input', function() {
            formatRupiah(this);
            if (hargaHppCount) hargaHppCount.textContent = this.value.length;
        });
    }

    // Photo upload event
    if (photoUpload) {
        photoUpload.addEventListener('change', handlePhotoUpload);
    }

    // Kategori modal events
    if (btnAturKategori) {
        btnAturKategori.addEventListener('click', openKategoriModal);
    }
    
    if (btnAddKategori) {
        btnAddKategori.addEventListener('click', addNewCategory);
    }
    
    if (btnTerapkanKategori) {
        btnTerapkanKategori.addEventListener('click', applyCategories);
    }

    // Save button event
    if (btnSimpan) {
        btnSimpan.addEventListener('click', saveProduk);
    }

    // Delete button events
    if (btnHapus) {
        btnHapus.addEventListener('click', function() {
            openModal(deleteConfirmationModal);
        });
    }
    
    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', function() {
            closeModal(deleteConfirmationModal);
        });
    }
    
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', deleteProduk);
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

        // Katalog (item 2)
        navItems[1].addEventListener('click', function() {
            window.location.href = 'katalog.html';
        });

        // Riwayat/Laporan (item 3)
        navItems[2].addEventListener('click', function() {
            window.location.href = 'riwayat.html';
        });
    }

    // Load categories from database
    await loadCategories();
});

// Function to load categories from database
async function loadCategories() {
    try {
        console.log("Loading categories...");
        
        // First, get unique categories from existing products
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('kategori');
            
        if (productsError) {
            console.error('Error fetching products for categories:', productsError);
            return;
        }
        
        // Extract unique categories
        const uniqueCategories = new Set(['Semua Produk']);
        
        products.forEach(product => {
            if (product.kategori) {
                // If kategori is array
                if (Array.isArray(product.kategori)) {
                    product.kategori.forEach(cat => uniqueCategories.add(cat));
                }
                // If kategori is JSON string
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
                // If kategori is regular string
                else if (typeof product.kategori === 'string') {
                    uniqueCategories.add(product.kategori);
                }
            }
        });
        
        // Add default categories
        const defaultCategories = ['Espresso Based', 'Milk Based'];
        defaultCategories.forEach(cat => uniqueCategories.add(cat));
        
        console.log("Unique categories found:", Array.from(uniqueCategories));
        
        // Set to global categories
        categories = Array.from(uniqueCategories);
        
        // If we're in edit mode, selectedCategories already loaded in loadProductData
        if (!isEditMode) {
            // Default to "Semua Produk" for new products
            selectedCategories = ['Semua Produk'];
            renderSelectedCategories();
        }
        
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// Function to load product data in edit mode
async function loadProductData(productId) {
    try {
        console.log("Loading product data for ID:", productId);
        
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
            
        if (error) {
            console.error('Error fetching product:', error);
            alert("Gagal memuat data produk: " + error.message);
            return;
        }
        
        if (!product) {
            console.error('Product not found');
            alert("Produk tidak ditemukan");
            window.location.href = 'katalog.html';
            return;
        }
        
        console.log("Product data loaded:", product);
        
        // Fill form fields
        const namaProdukInput = document.getElementById('nama-produk');
        const hargaJualInput = document.getElementById('harga-jual');
        const hargaHppInput = document.getElementById('harga-hpp');
        
        if (namaProdukInput) namaProdukInput.value = product.name || '';
        if (hargaJualInput) hargaJualInput.value = formatNumber(product.price || 0);
        if (hargaHppInput) hargaHppInput.value = formatNumber(product.hpp || 0);
        
        // Update character counters
        const namaProdukCount = document.getElementById('nama-produk-count');
        const hargaJualCount = document.getElementById('harga-jual-count');
        const hargaHppCount = document.getElementById('harga-hpp-count');
        
        if (namaProdukCount) namaProdukCount.textContent = (product.name || '').length;
        if (hargaJualCount) hargaJualCount.textContent = formatNumber(product.price || 0).length;
        if (hargaHppCount) hargaHppCount.textContent = formatNumber(product.hpp || 0).length;
        
        // Set selected categories
        if (product.kategori) {
            if (Array.isArray(product.kategori)) {
                selectedCategories = [...product.kategori];
            } else if (typeof product.kategori === 'string' && product.kategori.startsWith('[')) {
                try {
                    selectedCategories = JSON.parse(product.kategori);
                } catch (e) {
                    console.error("Error parsing kategori JSON:", e);
                    selectedCategories = [product.kategori];
                }
            } else if (typeof product.kategori === 'string') {
                selectedCategories = [product.kategori];
            } else {
                selectedCategories = ['Semua Produk'];
            }
        } else {
            selectedCategories = ['Semua Produk'];
        }
        
        renderSelectedCategories();
        
    } catch (error) {
        console.error("Error loading product data:", error);
        alert("Terjadi kesalahan saat memuat data produk");
    }
}

// Function to render selected categories
function renderSelectedCategories() {
    const selectedCategoriesElement = document.getElementById('selected-categories');
    if (!selectedCategoriesElement) return;
    
    selectedCategoriesElement.innerHTML = '';
    
    selectedCategories.forEach(category => {
        const categoryTag = document.createElement('div');
        categoryTag.className = 'category-tag';
        categoryTag.innerHTML = `
            ${category}
            <img src="icons/icon-close.svg" alt="Remove" class="remove-icon">
        `;
        
        const removeIcon = categoryTag.querySelector('.remove-icon');
        removeIcon.addEventListener('click', () => {
            selectedCategories = selectedCategories.filter(cat => cat !== category);
            renderSelectedCategories();
        });
        
        selectedCategoriesElement.appendChild(categoryTag);
    });
}

// Function to open kategori modal
function openKategoriModal() {
    const kategoriListElement = document.getElementById('kategori-list');
    const kategoriModal = document.getElementById('kategori-modal');
    
    if (kategoriListElement) {
        kategoriListElement.innerHTML = '';
        
        categories.forEach(category => {
            const isSelected = selectedCategories.includes(category);
            
            const kategoriItem = document.createElement('div');
            kategoriItem.className = 'kategori-item';
            kategoriItem.innerHTML = `
                <input type="checkbox" id="cat-${category}" class="kategori-checkbox" ${isSelected ? 'checked' : ''}>
                <label for="cat-${category}">${category}</label>
            `;
            
            const checkbox = kategoriItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    if (!selectedCategories.includes(category)) {
                        selectedCategories.push(category);
                    }
                } else {
                    selectedCategories = selectedCategories.filter(cat => cat !== category);
                }
            });
            
            kategoriListElement.appendChild(kategoriItem);
        });
    }
    
    openModal(kategoriModal);
}

// Function to add new category
function addNewCategory() {
    const newKategoriInput = document.getElementById('new-kategori');
    const kategoriListElement = document.getElementById('kategori-list');
    
    if (!newKategoriInput || !kategoriListElement) return;
    
    const newCategory = newKategoriInput.value.trim();
    
    if (!newCategory) {
        alert('Nama kategori tidak boleh kosong');
        return;
    }
    
    if (categories.includes(newCategory)) {
        alert('Kategori sudah ada');
        return;
    }
    
    // Add to categories array
    categories.push(newCategory);
    
    // Add to DOM
    const kategoriItem = document.createElement('div');
    kategoriItem.className = 'kategori-item';
    kategoriItem.innerHTML = `
        <input type="checkbox" id="cat-${newCategory}" class="kategori-checkbox" checked>
        <label for="cat-${newCategory}">${newCategory}</label>
    `;
    
    const checkbox = kategoriItem.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            if (!selectedCategories.includes(newCategory)) {
                selectedCategories.push(newCategory);
            }
        } else {
            selectedCategories = selectedCategories.filter(cat => cat !== newCategory);
        }
    });
    
    kategoriListElement.appendChild(kategoriItem);
    
    // Add to selected categories
    if (!selectedCategories.includes(newCategory)) {
        selectedCategories.push(newCategory);
    }
    
    // Clear input
    newKategoriInput.value = '';
}

// Function to apply selected categories
function applyCategories() {
    renderSelectedCategories();
    closeModal(document.getElementById('kategori-modal'));
}

// Function to handle photo upload (placeholder - implementation would need file storage)
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const photoPreview = document.querySelector('.photo-preview');
    
    if (photoPreview) {
        // Remove empty class
        photoPreview.classList.remove('empty');
        
        // Replace camera icon with image preview
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        
        // Remove existing content
        photoPreview.innerHTML = '';
        
        // Add image
        photoPreview.appendChild(img);
        
        // Keep the file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'photo-upload';
        fileInput.accept = 'image/*';
        fileInput.className = 'photo-input';
        fileInput.addEventListener('change', handlePhotoUpload);
        
        photoPreview.appendChild(fileInput);
    }
    
    // Note: In a real implementation, you would upload the file to storage
    // For this example, we're just updating the UI
    console.log("Photo upload handled UI only (no actual upload):", file.name);
}

// Function to save product
async function saveProduk() {
    const namaProdukInput = document.getElementById('nama-produk');
    const hargaJualInput = document.getElementById('harga-jual');
    const hargaHppInput = document.getElementById('harga-hpp');
    
    // Validation
    if (!namaProdukInput || !namaProdukInput.value.trim()) {
        alert('Nama produk tidak boleh kosong');
        return;
    }
    
    if (!hargaJualInput || parseRupiah(hargaJualInput.value) <= 0) {
        alert('Harga jual harus diisi dengan benar');
        return;
    }
    
    if (!hargaHppInput || parseRupiah(hargaHppInput.value) < 0) {
        alert('Harga HPP harus diisi dengan benar');
        return;
    }
    
    // Prepare data
    const productData = {
        name: namaProdukInput.value.trim(),
        price: parseRupiah(hargaJualInput.value),
        hpp: parseRupiah(hargaHppInput.value),
        kategori: selectedCategories
    };
    
    console.log("Saving product data:", productData);
    
    try {
        let result;
        
        if (isEditMode && currentProductId) {
            // Update existing product
            result = await supabase
                .from('products')
                .update(productData)
                .eq('id', currentProductId);
                
            if (result.error) {
                console.error('Error updating product:', result.error);
                alert("Gagal menyimpan perubahan: " + result.error.message);
                return;
            }
            
            alert("Produk berhasil diperbarui");
        } else {
            // Insert new product
            result = await supabase
                .from('products')
                .insert(productData);
                
            if (result.error) {
                console.error('Error adding product:', result.error);
                alert("Gagal menambahkan produk: " + result.error.message);
                return;
            }
            
            alert("Produk berhasil ditambahkan");
        }
        
        // Return to catalog
        window.location.href = 'katalog.html';
        
    } catch (error) {
        console.error("Error saving product:", error);
        alert("Terjadi kesalahan saat menyimpan produk");
    }
}

// Function to delete product
async function deleteProduk() {
    if (!isEditMode || !currentProductId) {
        closeModal(document.getElementById('delete-confirmation-modal'));
        return;
    }
    
    try {
        console.log("Deleting product with ID:", currentProductId);
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', currentProductId);
            
        if (error) {
            console.error('Error deleting product:', error);
            alert("Gagal menghapus produk: " + error.message);
            return;
        }
        
        alert("Produk berhasil dihapus");
        
        // Return to catalog
        window.location.href = 'katalog.html';
        
    } catch (error) {
        console.error("Error deleting product:", error);
        alert("Terjadi kesalahan saat menghapus produk");
    }
}

// Modal utility functions
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

// Helper function untuk format Rupiah
function formatNumber(number) {
    return 'Rp ' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

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