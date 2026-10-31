<meta name='viewport' content='width=device-width, initial-scale=1'/>const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/kirim-data', (req, res) => {
    const dataUser = req.body;
    console.log("Data diterima:", dataUser);
    res.json({ 
        status: "Sukses", 
        pesan: "Data berhasil diterima oleh backend Node.js!",
        data: dataUser 
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
