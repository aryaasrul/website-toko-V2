**
 * Script otentikasi sederhana untuk website POS
 * Sertakan di setiap halaman yang memerlukan login
 */

// Cek jika user sudah login
document.addEventListener('DOMContentLoaded', function() {
    // Skip pengecekan jika ini adalah halaman login atau loading
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html' || currentPage === 'loading.html') {
        return;
    }
    
    const loggedIn = sessionStorage.getItem('posLoggedIn') === 'true';
    
    if (!loggedIn) {
        // Jika belum login, redirect ke halaman login
        window.location.href = 'login.html';
        return;
    }
    
    // Jika sudah login, ambil nama user
    const userName = sessionStorage.getItem('posUserName');
    
    // Tampilkan nama user jika ada element untuk itu
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && userName) {
        userNameElement.textContent = userName;
    }
    
    // Setup event listener untuk tombol logout
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            logout();
        });
    }
});

// Fungsi untuk melakukan logout
function logout() {
    // Hapus data login dari session storage
    sessionStorage.removeItem('posLoggedIn');
    sessionStorage.removeItem('posUserName');
    
    // Redirect ke halaman login
    window.location.href = 'login.html';
}