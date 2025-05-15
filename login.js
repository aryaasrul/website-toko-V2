// Kode rahasia (sebaiknya ini divalidasi di server, bukan di client)
const secretCode = "terang123"; // Ganti dengan kode rahasia Anda

// DOM Elements
const namaInput = document.getElementById('nama');
const kodeInput = document.getElementById('kode');
const rememberCheckbox = document.getElementById('remember');
const loginButton = document.getElementById('btn-login');
const errorMessage = document.getElementById('error-message');
const togglePasswordButton = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');

// Fungsi untuk toggle show/hide password
function togglePassword() {
    if (kodeInput.type === 'password') {
        kodeInput.type = 'text';
        eyeIcon.src = 'icons/eye-slash.svg'; // Pastikan icon ini tersedia
    } else {
        kodeInput.type = 'password';
        eyeIcon.src = 'icons/eye.svg'; // Pastikan icon ini tersedia
    }
}

// Fungsi login
function login() {
    const nama = namaInput.value.trim();
    const kode = kodeInput.value;
    const remember = rememberCheckbox.checked;
    
    // Validasi input
    if (!nama) {
        showError("Silakan masukkan nama Anda");
        return;
    }
    
    if (kode !== secretCode) {
        showError("Kode rahasia salah");
        return;
    }
    
    // Semua validasi berhasil, hapus pesan error
    hideError();
    
    // Simpan data pengguna jika remember me dicentang
    if (remember) {
        localStorage.setItem('posUserName', nama);
        localStorage.setItem('posRememberMe', 'true');
    } else {
        // Hapus data jika ada
        localStorage.removeItem('posUserName');
        localStorage.removeItem('posRememberMe');
    }
    
    // Simpan info login di session storage
    sessionStorage.setItem('posLoggedIn', 'true');
    sessionStorage.setItem('posUserName', nama);
    
    // Redirect ke loading screen (jika ada) atau langsung ke halaman utama
    if (document.referrer && document.referrer.includes('loading.html')) {
        window.location.href = 'index.html'; // Skip loading screen
    } else {
        window.location.href = 'loading.html'; // Go to loading
    }
}

// Helper untuk menampilkan pesan error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Helper untuk menyembunyikan pesan error
function hideError() {
    errorMessage.style.display = 'none';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah user sudah remember me
    const remembered = localStorage.getItem('posRememberMe') === 'true';
    
    if (remembered) {
        const savedName = localStorage.getItem('posUserName');
        if (namaInput && savedName) {
            namaInput.value = savedName;
        }
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
    
    // Cek apakah user sudah login di session ini
    const loggedIn = sessionStorage.getItem('posLoggedIn') === 'true';
    
    if (loggedIn) {
        window.location.href = 'index.html'; // Langsung ke halaman utama
    }
    
    // Toggle password visibility
    if (togglePasswordButton) {
        togglePasswordButton.addEventListener('click', togglePassword);
    }
    
    // Login button click
    if (loginButton) {
        loginButton.addEventListener('click', login);
    }
    
    // Enter key untuk login
    kodeInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            login();
        }
    });
});