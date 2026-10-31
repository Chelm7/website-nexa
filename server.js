import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Memori lokal sementara yang aman (100% jalan tanpa takut koneksi Redis putus)
let daftarPesananGlobal = [];

// API POST: Kirim Pesanan
app.post('/api/pesanan', (req, res) => {
    try {
        const dataBaru = req.body || {};
        const pesanan = {
            id: dataBaru.id || ("ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase()),
            nama: dataBaru.nama || "Tanpa Nama",
            menu: dataBaru.menu || "-",
            catatan: dataBaru.catatan || "Tidak ada",
            waktu: dataBaru.waktu || new Date().toLocaleString('id-ID')
        };

        daftarPesananGlobal.unshift(pesanan);

        return res.json({ 
            success: true, 
            message: "Pesanan berhasil disimpan", 
            pesanan: pesanan 
        });
    } catch (err) {
        return res.json({ 
            success: false, 
            error: err.message 
        });
    }
});

// API GET: Ambil Daftar Pesanan
app.get('/api/pesanan', (req, res) => {
    try {
        return res.json({ 
            success: true, 
            pesanan: daftarPesananGlobal 
        });
    } catch (err) {
        return res.json({ 
            success: true, 
            pesanan: [] 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
