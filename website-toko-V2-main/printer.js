/**
 * printer.js
 * Modul untuk menangani koneksi dan pencetakan ke printer thermal via Web Bluetooth.
 * Menggunakan perintah standar ESC/POS untuk kompatibilitas yang luas.
 */

// Menyimpan state koneksi printer secara global dalam modul ini.
let printerDevice = null;
let printerCharacteristic = null;

// Perintah-perintah dasar ESC/POS yang akan kita gunakan.
const ESC_POS_COMMANDS = {
    LF: '\n',
    ESC: '\x1B',
    GS: '\x1D',
    INITIALIZE: '\x1B@', // Reset printer ke state awal
    ALIGN_LEFT: '\x1Ba\x00',
    ALIGN_CENTER: '\x1Ba\x01',
    ALIGN_RIGHT: '\x1Ba\x02',
    BOLD_ON: '\x1BE\x01',
    BOLD_OFF: '\x1BE\x00',
    DOUBLE_HEIGHT_WIDTH_ON: '\x1D!\x11', // Teks besar (tinggi & lebar 2x)
    DOUBLE_HEIGHT_WIDTH_OFF: '\x1D!\x00',// Kembali ke ukuran normal
    FEED_LINES: (n) => `\x1Bd${String.fromCharCode(n)}`, // Mendorong kertas sebanyak n baris
    CUT_PAPER: '\x1DV\x41\x03', // Perintah potong kertas (partial cut)
};

/**
 * Fungsi untuk memulai koneksi ke printer.
 * Ini akan memicu dialog pemilihan perangkat Bluetooth di browser.
 */
async function connectToPrinter() {
    try {
        console.log('Mencari perangkat printer Bluetooth...');
        // Meminta browser untuk menampilkan dialog pemilihan perangkat.
        // Kita filter berdasarkan UUID standar untuk layanan Serial Port over Bluetooth.
        printerDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });

        console.log('Perangkat ditemukan:', printerDevice.name);
        alert(`Berhasil menemukan: ${printerDevice.name}. Menyambungkan...`);

        // Menghubungkan ke GATT server di perangkat.
        const server = await printerDevice.gatt.connect();
        console.log('Terhubung ke GATT Server.');

        // Mendapatkan layanan utama (primary service).
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        console.log('Mendapatkan Layanan (Service).');

        // Mendapatkan 'characteristic' yang bisa kita gunakan untuk menulis data.
        const characteristics = await service.getCharacteristics();
        printerCharacteristic = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);

        if (!printerCharacteristic) {
            alert('Gagal menemukan characteristic yang sesuai pada printer ini. Printer mungkin tidak kompatibel.');
            return false;
        }

        console.log('Koneksi printer berhasil dan siap digunakan.');
        alert('Printer terhubung dan siap untuk mencetak!');
        return true;

    } catch (error) {
        console.error('Koneksi Bluetooth Gagal:', error);
        alert(`Gagal menyambungkan ke printer: ${error.message}`);
        printerDevice = null;
        printerCharacteristic = null;
        return false;
    }
}

/**
 * Mengecek apakah printer saat ini terhubung.
 * @returns {boolean}
 */
function isPrinterConnected() {
    return !!(printerDevice && printerDevice.gatt.connected && printerCharacteristic);
}

/**
 * Mengirim data mentah (raw data) dalam bentuk string ke printer.
 * @param {string} data - String berisi perintah ESC/POS.
 */
async function writeToPrinter(data) {
    if (!isPrinterConnected()) {
        console.error('Printer tidak terhubung.');
        alert('Printer tidak terhubung. Silakan hubungkan printer terlebih dahulu.');
        return;
    }
    try {
        // Mengubah string menjadi ArrayBuffer yang bisa dikirim via Bluetooth.
        const encoder = new TextEncoder();
        const buffer = encoder.encode(data);
        // Menggunakan writeValueWithoutResponse untuk kecepatan, karena kita tidak butuh balasan dari printer.
        await printerCharacteristic.writeValueWithoutResponse(buffer);
    } catch (error) {
        console.error('Gagal mengirim data ke printer:', error);
        alert(`Gagal mencetak struk: ${error.message}`);
    }
}

/**
 * Membuat string struk dengan format ESC/POS dari data keranjang.
 * @param {Array} cart - Keranjang belanja.
 * @param {number} totalAmount - Total harga.
 * @param {string} userName - Nama kasir.
 * @returns {string} - String mentah untuk dikirim ke printer.
 */
function generateReceipt(cart, totalAmount, userName) {
    const {
        LF, INITIALIZE, ALIGN_CENTER, ALIGN_LEFT, BOLD_ON, BOLD_OFF,
        DOUBLE_HEIGHT_WIDTH_ON, DOUBLE_HEIGHT_WIDTH_OFF, FEED_LINES, CUT_PAPER
    } = ESC_POS_COMMANDS;

    let receipt = '';

    receipt += INITIALIZE;
    receipt += ALIGN_CENTER;
    receipt += DOUBLE_HEIGHT_WIDTH_ON;
    receipt += 'Kedai Terang\n';
    receipt += DOUBLE_HEIGHT_WIDTH_OFF;
    receipt += 'Jl. Urip Sumoharjo, Ponorogo\n';
    receipt += '--------------------------------\n';
    
    receipt += ALIGN_LEFT;
    // Header tabel
    receipt += 'Item'.padEnd(16) + 'Qty'.padEnd(4) + 'Total'.padStart(12) + LF;
    receipt += '--------------------------------' + LF;

    // Daftar item
    cart.forEach(item => {
        const itemName = item.name.length > 15 ? item.name.substring(0, 15) + '.' : item.name;
        const qty = item.quantity.toString();
        const total = `Rp${(item.price * item.quantity).toLocaleString('id-ID')}`;
        receipt += itemName.padEnd(16) + qty.padEnd(4) + total.padStart(12) + LF;
    });

    receipt += '--------------------------------' + LF;

    // Total
    receipt += BOLD_ON;
    receipt += 'Total'.padEnd(20) + `Rp${totalAmount.toLocaleString('id-ID')}`.padStart(12) + LF;
    receipt += BOLD_OFF;

    receipt += LF;
    receipt += ALIGN_CENTER;
    receipt += `Kasir: ${userName || 'N/A'}\n`;
    receipt += new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' }) + '\n\n';
    receipt += 'Terima Kasih!\n';
    receipt += FEED_LINES(3); // Beri 3 baris kosong
    receipt += CUT_PAPER;

    return receipt;
}

/**
 * Fungsi utama yang dipanggil dari luar untuk mencetak struk.
 */
async function printReceipt(cart, totalAmount, userName) {
    if (!isPrinterConnected()) {
        const reconnect = confirm("Printer tidak terhubung. Apakah Anda ingin mencoba menghubungkan sekarang?");
        if (reconnect) {
            const success = await connectToPrinter();
            if (!success) return; // Batal jika koneksi gagal
        } else {
            return; // Batal jika user tidak mau menghubungkan
        }
    }

    const receiptText = generateReceipt(cart, totalAmount, userName);
    console.log("Data Struk yang Akan Dicetak:\n", receiptText);
    await writeToPrinter(receiptText);
}

// Mengekspos fungsi-fungsi penting ke object `window` agar bisa diakses dari file lain.
window.printerModule = {
    connectToPrinter,
    printReceipt,
    isPrinterConnected
};
