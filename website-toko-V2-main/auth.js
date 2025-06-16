/**
 * Script otentikasi sederhana untuk website POS
 * Sertakan di setiap halaman yang memerlukan login
 */

// Fungsi yang akan dijalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log("Auth.js loaded - Current page:", window.location.pathname);
    
    // Jika halaman utama/root atau index.html, redirect ke login jika belum login
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || '';
    
    // Debug info
    console.log("Current page:", currentPage);
    const loggedIn = sessionStorage.getItem('posLoggedIn') === 'true';
    console.log("Login status:", loggedIn);
    
    // Skip login check untuk halaman login dan loading
    if (currentPage === 'login.html' || currentPage === 'loading.html') {
        console.log("Skipping login check for login/loading page");
        return;
    }
    
    // Force redirect ke login.html jika ini adalah halaman utama dan belum login
    if ((currentPage === '' || currentPage === 'index.html' || currentPage === '/') && !loggedIn) {
        console.log("Redirecting to login page");
        window.location.href = 'login.html';
        return;
    }
    
    // Untuk halaman lain, cek login status
    if (!loggedIn) {
        console.log("Not logged in, redirecting to login.html");
        window.location.href = 'login.html';
        return;
    }
    
    // Jika sudah login, tampilkan nama user
    const userName = sessionStorage.getItem('posUserName');
    console.log("User name:", userName);
    
    // Tampilkan nama user jika ada element untuk itu
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && userName) {
        userNameElement.textContent = userName;
    }
    
    // Setup event listener untuk tombol logout
    setupLogoutButton();
});

// Fungsi untuk setup tombol logout
function setupLogoutButton() {
    const logoutButton = document.getElementById('logout-btn');
    console.log("Logout button found:", logoutButton);
    
    if (logoutButton) {
        // Hapus event listener lama untuk menghindari duplikasi
        logoutButton.removeEventListener('click', logout);
        
        // Tambahkan event listener baru
        logoutButton.addEventListener('click', logout);
        
        // Tambahkan juga event listener inline untuk backup
        logoutButton.onclick = logout;
        
        console.log("Logout button event listener attached");
    } else {
        console.warn("Logout button not found in the page");
    }
}

// Fungsi untuk melakukan logout
function logout() {
    console.log("Logout function called");
    
    // Hapus data login dari session storage
    sessionStorage.removeItem('posLoggedIn');
    sessionStorage.removeItem('posUserName');
    
    // Hapus juga dari local storage jika ada
    localStorage.removeItem('posLoggedIn');
    localStorage.removeItem('posUserName');
    
    console.log("Session data cleared, redirecting to login page");
    
    // Redirect ke halaman login
    window.location.href = 'login.html';
}

// Expose logout function globally for inline HTML calls if needed
window.doLogout = logout;