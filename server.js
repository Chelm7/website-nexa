const express = require('express');
const { Redis } = require('@upstash/redis');

const app = express();
const port = process.env.PORT || 3000;

// Inisialisasi Upstash Redis (otomatis membaca KV_REST_API_URL & KV_REST_API_TOKEN dari Vercel)
const redis = Redis.fromEnv();

// Middleware untuk membaca JSON dari request
app.use(express.json());

// ==========================================
// 1. ENDPOINT UTAMA & TES KONEKSI REDIS
// ==========================================

// Endpoint utama website
app.get('/', (req, res) => {
  res.send('Website Mie Bangka Teladan Berjalan Normal!');
});

// Endpoint untuk tes simpan data ke Redis
app.get('/test-redis', async (req, res) => {
  try {
    await redis.set('test_koneksi', 'Berhasil terhubung ke Upstash Redis!');
    const pesan = await redis.get('test_koneksi');
    
    res.json({
      success: true,
      message: pesan
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==========================================
// 2. ENDPOINT PESANAN & PANEL ADMIN
// ==========================================

// Endpoint untuk menyimpan pesanan baru dari pelanggan
app.post('/api/pesanan', async (req, res) => {
  try {
    const dataPesanan = req.body;
    const idPesanan = 'order_' + Date.now();
    
    // Simpan data pesanan ke Upstash Redis
    await redis.set(idPesanan, JSON.stringify(dataPesanan));
    
    // Masukkan ID pesanan ke dalam list daftar pesanan
    await redis.lpush('daftar_pesanan', idPesanan);

    res.json({ success: true, message: 'Pesanan berhasil disimpan!', id: idPesanan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint untuk mengambil semua daftar pesanan untuk Panel Admin
app.get('/api/pesanan', async (req, res) => {
  try {
    const listId = await redis.lrange('daftar_pesanan', 0, -1);
    if (!listId || listId.length === 0) {
      return res.json({ success: true, pesanan: [] });
    }

    const semuaPesanan = [];
    for (const id of listId) {
      const detail = await redis.get(id);
      if (detail) {
        semuaPesanan.push({ id, ...JSON.parse(detail) });
      }
    }

    res.json({ success: true, pesanan: semuaPesanan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Menjalankan server
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
