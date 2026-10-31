import express from 'express';
import { Redis } from '@upstash/redis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Inisialisasi Upstash Redis secara aman
let redis = null;
try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redis = Redis.fromEnv();
    }
} catch (e) {
    console.log("Redis init note: Menggunakan memori cadangan.");
}

let memoriPesanan = [];

// API POST: Kirim Pesanan (Wajib mengembalikan JSON murni)
app.post('/api/pesanan', async (req, res) => {
    try {
        const pesananBaru = req.body;
        if (!pesananBaru.id) {
            pesananBaru.id = "ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        if (redis) {
            try {
                await redis.lpush('daftar_pesanan', JSON.stringify(pesananBaru));
            } catch (redisErr) {
                console.log("Redis save error, fallback ke memori:", redisErr);
            }
        }
        
        memoriPesanan.unshift(pesananBaru);

        return res.status(200).json({ 
            success: true, 
            message: "Pesanan berhasil disimpan!", 
            pesanan: pesananBaru 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Terjadi kesalahan server" 
        });
    }
});

// API GET: Ambil Pesanan (Wajib mengembalikan JSON murni)
app.get('/api/pesanan', async (req, res) => {
    try {
        let semuaPesanan = [];

        if (redis) {
            try {
                const dataRedis = await redis.lrange('daftar_pesanan', 0, -1);
                if (dataRedis && dataRedis.length > 0) {
                    semuaPesanan = dataRedis.map(item => typeof item === 'string' ? JSON.parse(item) : item);
                }
            } catch (redisErr) {
                console.log("Redis fetch error, fallback ke memori:", redisErr);
            }
        }

        if (semuaPesanan.length === 0) {
            semuaPesanan = memoriPesanan;
        }

        return res.status(200).json({ 
            success: true, 
            pesanan: semuaPesanan 
        });
    } catch (error) {
        return res.status(200).json({ 
            success: true, 
            pesanan: memoriPesanan 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
