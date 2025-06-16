// Inisialisasi Supabase
const supabaseUrl = 'https://jbvfjehpgvadponxkvsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidmZqZWhwZ3ZhZHBvbnhrdnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODg3NzUsImV4cCI6MjA2MjM2NDc3NX0.YLXNLhpodvmhRa5RfPlHQhiVPvoqmnOZb7b-HFcFo8k';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    const namaProdukInput = document.getElementById('nama-produk');
    const hargaJualInput = document.getElementById('harga-jual');
    const hargaHppInput = document.getElementById('harga-hpp');
    const btnSelesai = document.getElementById('btn-selesai');
    const namaProdukCount = document.getElementById('nama-produk-count');
    const hargaJualCount = document.getElementById('harga-jual-count');
    const hargaHppCount = document.getElementById('harga-hpp-count');

    // Navbar event listeners
    const navItems = document.querySelectorAll('.navbar .nav-item');
    if (navItems.length >= 3) {
        // Kasir (item 1) - already on this page's parent
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

    // Event Listeners
    btnSelesai.addEventListener('click', prosesInputManual);

    // Input counter
    if (namaProdukInput) {
        namaProdukInput.addEventListener('input', function() {
            namaProdukCount.textContent = this.value.length;
        });
    }

    if (hargaJualInput) {
        hargaJualInput.addEventListener('input', function() {
            formatRupiah(this);
            hargaJualCount.textContent = this.value.length;
        });
    }

    if (hargaHppInput) {
        hargaHppInput.addEventListener('input', function() {
            formatRupiah(this);
            hargaHppCount.textContent = this.value.length;
        });
    }

    // Reset form
    init();
});

// Fungsi Inisialisasi
function init() {
    const namaProdukInput = document.getElementById('nama-produk');
    const hargaJualInput = document.getElementById('harga-jual');
    const hargaHppInput = document.getElementById('harga-hpp');
    const namaProdukCount = document.getElementById('nama-produk-count');
    const hargaJualCount = document.getElementById('harga-jual-count');
    const hargaHppCount = document.getElementById('harga-hpp-count');

    if (namaProdukInput) namaProdukInput.value = '';
    if (hargaJualInput) hargaJualInput.value = '';
    if (hargaHppInput) hargaHppInput.value = '';
    
    // Reset counter
    updateCharCounter();
}

// Fungsi untuk memperbarui penghitung karakter
function updateCharCounter() {
    const namaProdukInput = document.getElementById('nama-produk');
    const hargaJualInput = document.getElementById('harga-jual');
    const hargaHppInput = document.getElementById('harga-hpp');
    const namaProdukCount = document.getElementById('nama-produk-count');
    const hargaJualCount = document.getElementById('harga-jual-count');
    const hargaHppCount = document.getElementById('harga-hpp-count');

    if (namaProdukInput && namaProdukCount) {
        namaProdukCount.textContent = namaProdukInput.value.length;
    }
    
    if (hargaJualInput && hargaJualCount) {
        hargaJualCount.textContent = hargaJualInput.value.length;
    }
    
    if (hargaHppInput && hargaHppCount) {
        hargaHppCount.textContent = hargaHppInput.value.length;
    }
}

// Fungsi untuk memproses input manual
async function prosesInputManual() {
    const namaProdukInput = document.getElementById('nama-produk');
    const hargaJualInput = document.getElementById('harga-jual');
    const hargaHppInput = document.getElementById('harga-hpp');

    const namaProduk = namaProdukInput.value.trim();
    const hargaJual = parseRupiah(hargaJualInput.value);
    const hargaHpp = parseRupiah(hargaHppInput.value);

    // Validasi
    if (!namaProduk) {
        alert('Nama produk tidak boleh kosong');
        return;
    }

    if (!hargaJual || hargaJual <= 0) {
        alert('Harga jual harus diisi dengan benar');
        return;
    }

    if (!hargaHpp || hargaHpp < 0) {
        alert('Harga HPP harus diisi dengan benar');
        return;
    }

    try {
        console.log("Saving manual input:", {
            name: namaProduk,
            price: hargaJual,
            hpp: hargaHpp
        });

        // 1. Simpan order ke tabel orders
        const order = {
            name: namaProduk,
            price: hargaJual,
            hpp: hargaHpp,
            quantity: 1,
            date: new Date()
        };

        const { data, error } = await supabase
            .from('orders')
            .insert([order]);

        if (error) {
            console.error('Error simpan order:', error);
            alert('Terjadi kesalahan saat menyimpan pesanan: ' + error.message);
            return;
        }

        console.log("Order saved successfully:", data);
        alert('Pesanan berhasil disimpan!');
        
        // Kembali ke halaman kasir
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memproses pesanan: ' + error.message);
    }
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