const express = require('express');
const { Redis } = require('@upstash/redis');

const app = express();
const port = process.env.PORT || 3000;

// Inisialisasi Upstash Redis (otomatis membaca KV_REST_API_URL & KV_REST_API_TOKEN dari Vercel)
const redis = Redis.fromEnv();

// Middleware untuk membaca JSON dari request
app.use(express.json());

// Endpoint utama website
app.get('/', (req, res) => {
  res.send('Website Mie Bangka Teladan Berjalan Normal!');
});

// Endpoint untuk tes simpan data pesanan ke Redis
app.get('/test-redis', async (req, res) => {
  try {
    // Mencoba menyimpan data uji coba ke Redis
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

app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
