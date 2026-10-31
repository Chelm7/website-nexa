import express from 'express';
import { Redis } from '@upstash/redis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Inisialisasi Upstash Redis (mengambil otomatis dari env: UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN)
let redis;
try {
    redis = Redis.fromEnv();
} catch (e) {
    console.log("Catatan: Redis belum dikonfigurasi via env, menggunakan memori lokal sementara.");
}

// Memori cadangan jika Redis gagal terhubung
let memoriPesanan = [];

// API Kirim Pesanan (POST)
app.post('/api/pesanan', async (req, res) => {
    try {
        const pesananBaru = req.body;
        if (!pesananBaru.id) {
            pesananBaru.id = "ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        // Coba simpan ke Upstash Redis
        if (redis) {
            await redis.lpush('daftar_pesanan', JSON.stringify(pesananBaru));
        }
        
        // Simpan juga ke memori lokal sbg cadangan aman
        memoriPesanan.unshift(pesananBaru);

        res.json({ success: true, message: "Pesanan berhasil disimpan!", pesanan: pesananBaru });
    } catch (error) {
        console.error("Gagal simpan pesanan:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Ambil Daftar Pesanan (GET)
app.get('/api/pesanan', async (req, res) => {
    try {
        let semuaPesanan = [];

        if (redis) {
            const dataRedis = await redis.lrange('daftar_pesanan', 0, -1);
            if (dataRedis && dataRedis.length > 0) {
                semuaPesanan = dataRedis.map(item => typeof item === 'string' ? JSON.parse(item) : item);
            }
        }

        // Jika Redis kosong, gunakan memori lokal
        if (semuaPesanan.length === 0) {
            semuaPesanan = memoriPesanan;
        }

        res.json({ success: true, pesanan: semuaPesanan });
    } catch (error) {
        console.error("Gagal ambil pesanan:", error);
        res.json({ success: true, pesanan: memoriPesanan });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Mie Bangka Teladan berjalan di port ${PORT}`);
});
