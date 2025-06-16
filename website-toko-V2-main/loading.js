// Cek jika user sudah login
document.addEventListener('DOMContentLoaded', function() {
    const loggedIn = sessionStorage.getItem('posLoggedIn') === 'true';
    
    if (!loggedIn) {
        // Jika belum login, redirect ke halaman login
        window.location.href = 'login.html';
        return;
    }
    
    // Simulasi loading (3 detik)
    setTimeout(function() {
        // Redirect ke halaman utama setelah loading
        window.location.href = 'index.html';
    }, 3000);
});